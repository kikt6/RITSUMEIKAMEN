// 勉強会・イベントの表示（events.html の一覧と、トップの「勉強会・イベント」欄）
(() => {
  const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
  const byId = (id) => document.getElementById(id);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const events = (window.circleEvents || [])
    .filter((e) => e && e.date && e.title)
    .map((e) => ({ ...e, id: e.id || `${e.date}|${e.title}` }));

  function parseLocalDate(value) {
    const [y, m, d] = String(value).split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function today() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const startOf = (e) => parseLocalDate(e.date);
  const endOf = (e) => parseLocalDate(e.endDate || e.date);
  const isPast = (e, base) => endOf(e) < base;
  const isToday = (e, base) => startOf(e) <= base && endOf(e) >= base;
  const daysUntil = (e, base) => Math.round((startOf(e) - base) / 86400000);

  function dateLabel(e) {
    const d = startOf(e);
    let label = `${d.getMonth() + 1}/${d.getDate()}(${WEEK[d.getDay()]})`;
    if (e.endDate && e.endDate !== e.date) {
      const end = endOf(e);
      label += `〜${end.getMonth() + 1}/${end.getDate()}(${WEEK[end.getDay()]})`;
    }
    return label;
  }

  const timeLabel = (e) => (e.start ? `${e.start}${e.end ? `〜${e.end}` : ""}` : "終日");
  const placeLabel = (e) => [e.campus, e.place].filter(Boolean).join(" ");

  function sorted(base) {
    const upcoming = events.filter((e) => !isPast(e, base)).sort((a, b) => startOf(a) - startOf(b));
    const past = events.filter((e) => isPast(e, base)).sort((a, b) => startOf(b) - startOf(a));
    return { upcoming, past };
  }

  function toCalendarEvent(e) {
    return {
      uid: `event|${e.id}`,
      title: `【サークル】${e.title}`,
      date: e.date,
      endDate: e.endDate,
      start: e.start,
      end: e.end,
      location: placeLabel(e),
      description: [e.body, e.join ? `参加方法: ${e.join}` : "", e.mapUrl ? `地図: ${e.mapUrl}` : ""]
        .filter(Boolean)
        .join("\n"),
      url: new URL("./events.html", location.href).href,
      alarmMinutesBefore: 60,
    };
  }

  function calendarButtons(e) {
    const row = el("div", "ev-actions");
    if (window.calendarExport) {
      const add = el("button", "ev-action ev-action--primary", "カレンダーに追加");
      add.type = "button";
      add.addEventListener("click", () => {
        window.calendarExport.download(`${e.id}.ics`, window.calendarExport.toIcs([toCalendarEvent(e)]));
      });
      const google = el("a", "ev-action", "Googleカレンダー");
      google.href = window.calendarExport.googleUrl(toCalendarEvent(e));
      google.target = "_blank";
      google.rel = "noopener noreferrer";
      row.append(add, google);
    }
    if (e.mapUrl) {
      const map = el("a", "ev-action", "地図");
      map.href = e.mapUrl;
      map.target = "_blank";
      map.rel = "noopener noreferrer";
      row.append(map);
    }
    return row;
  }

  // ===== 参加表明（代表にだけ届く） =====
  const RSVP = window.circleEventsRsvp || {};
  const RSVP_KEY = "ritsumeikamen-rsvp";
  const NAME_KEY = "ritsumeikamen-rsvp-name";
  const DEVICE_KEY = "ritsumeikamen-device-id";

  function storageGet(key, fallback) {
    try {
      const raw = window.localStorage?.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage?.setItem(key, JSON.stringify(value));
    } catch {
      // 保存できない環境では、このページを開いている間だけ有効
    }
  }

  function deviceId() {
    let id = storageGet(DEVICE_KEY, "");
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`).slice(0, 18);
      storageSet(DEVICE_KEY, id);
    }
    return id;
  }

  const rsvpEnabled = (e) => Boolean(RSVP.formAction && RSVP.fields) && e.rsvp !== false;

  async function sendRsvp(e, name, action) {
    const f = RSVP.fields;
    const body = new FormData();
    body.append(f.eventId, e.id);
    body.append(f.eventTitle, `${e.date} ${e.title}`);
    body.append(f.name, name);
    body.append(f.action, action);
    body.append(f.deviceId, deviceId());
    // Google フォームは応答を読ませてくれない（no-cors）ので、通信できたかどうかだけ分かる
    await fetch(RSVP.formAction, { method: "POST", mode: "no-cors", body });
  }

  function rsvpBox(e) {
    const box = el("div", "ev-rsvp");
    const render = () => {
      box.innerHTML = "";
      const records = storageGet(RSVP_KEY, {});
      const mine = records[e.id];

      if (mine) {
        const done = el("p", "ev-rsvp__done", `✓ 参加を送信しました（${mine.name}）`);
        const cancel = el("button", "ev-rsvp__link", "やっぱり行けない");
        cancel.type = "button";
        cancel.addEventListener("click", async () => {
          cancel.disabled = true;
          cancel.textContent = "送信中…";
          try {
            await sendRsvp(e, mine.name, "取り消し");
            const next = storageGet(RSVP_KEY, {});
            delete next[e.id];
            storageSet(RSVP_KEY, next);
            render();
          } catch {
            cancel.disabled = false;
            cancel.textContent = "やっぱり行けない";
            box.append(el("p", "ev-rsvp__error", "送信できませんでした。電波の良いところでもう一度押してください。"));
          }
        });
        box.append(done, cancel);
        return;
      }

      const go = el("button", "ev-action ev-rsvp__go", "行く！");
      go.type = "button";
      const form = el("form", "ev-rsvp__form");
      form.hidden = true;
      const label = el("label", "ev-rsvp__label");
      label.append(el("span", "", "名前（LINEの表示名など）"));
      const input = el("input");
      input.type = "text";
      input.maxLength = 30;
      input.required = true;
      input.autocomplete = "nickname";
      input.value = storageGet(NAME_KEY, "");
      label.append(input);
      const send = el("button", "ev-action ev-action--primary", "送信する");
      send.type = "submit";
      const status = el("p", "ev-rsvp__note", "名前は代表にだけ届きます。ほかの人には人数も名前も表示されません。");
      form.append(label, send);

      go.addEventListener("click", () => {
        go.hidden = true;
        form.hidden = false;
        input.focus();
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = input.value.trim();
        if (!name) return;
        send.disabled = true;
        send.textContent = "送信中…";
        try {
          await sendRsvp(e, name, "行く");
          storageSet(NAME_KEY, name);
          const next = storageGet(RSVP_KEY, {});
          next[e.id] = { name, at: new Date().toISOString() };
          storageSet(RSVP_KEY, next);
          render();
        } catch {
          send.disabled = false;
          send.textContent = "送信する";
          status.textContent = "送信できませんでした。電波の良いところでもう一度押してください。";
          status.classList.add("ev-rsvp__error");
        }
      });

      box.append(go, form, status);
    };
    render();
    return box;
  }

  function badgeFor(e, base) {
    if (isToday(e, base)) return el("span", "ev-badge is-today", "今日");
    const days = daysUntil(e, base);
    return el("span", "ev-badge", days === 1 ? "明日" : `あと${days}日`);
  }

  function eventCard(e, base, compact = false) {
    const card = el("article", `ev-card${isToday(e, base) ? " is-today" : ""}`);
    const d = startOf(e);

    const date = el("div", "ev-card__date");
    date.append(el("small", "", `${d.getMonth() + 1}月`), el("strong", "", String(d.getDate())), el("small", "", WEEK[d.getDay()]));

    const body = el("div", "ev-card__body");
    const head = el("div", "ev-card__head");
    if (e.tag) head.append(el("span", "card__tag", e.tag));
    head.append(badgeFor(e, base));
    body.append(head, el("h3", "", e.title));

    const meta = el("p", "ev-card__meta");
    meta.append(el("span", "", `${dateLabel(e)} ${timeLabel(e)}`));
    if (placeLabel(e)) meta.append(el("span", "", placeLabel(e)));
    body.append(meta);

    if (!compact && e.body) body.append(el("p", "ev-card__text", e.body));
    if (e.join) body.append(el("p", "ev-card__join", `参加方法: ${e.join}`));
    if (rsvpEnabled(e)) body.append(rsvpBox(e));
    body.append(calendarButtons(e));

    card.append(date, body);
    return card;
  }

  function renderPage(base) {
    const upcomingRoot = byId("evUpcoming");
    const pastRoot = byId("evPast");
    if (!upcomingRoot) return;
    const { upcoming, past } = sorted(base);

    upcomingRoot.innerHTML = "";
    if (upcoming.length === 0) {
      const empty = el("div", "ev-empty");
      empty.append(
        el("strong", "", "次の勉強会・イベントは準備中です"),
        el("p", "", "決まったらトップのお知らせと通知でお知らせします。通知をオンにしておくと見逃しません。"),
      );
      const link = el("a", "ev-action", "通知の設定へ");
      link.href = "./notify.html";
      empty.append(link);
      upcomingRoot.append(empty);
    } else {
      upcoming.forEach((e) => upcomingRoot.append(eventCard(e, base)));
    }

    if (!pastRoot) return;
    pastRoot.innerHTML = "";
    byId("evPastSection").hidden = past.length === 0;
    byId("evPastCount").textContent = `${past.length}件`;
    const list = el("ul", "ev-past");
    past.forEach((e) => {
      const item = el("li", "ev-past__item");
      const time = el("time", "", `${startOf(e).getFullYear()}/${dateLabel(e)}`);
      time.dateTime = e.date;
      const text = el("div", "ev-past__text");
      text.append(el("strong", "", e.title));
      text.append(el("span", "", [timeLabel(e), placeLabel(e)].filter(Boolean).join(" / ")));
      if (e.body) text.append(el("p", "", e.body));
      item.append(time, text);
      list.append(item);
    });
    pastRoot.append(list);
  }

  function renderPreview(base) {
    const root = byId("eventsPreview");
    if (!root) return;
    root.innerHTML = "";
    const { upcoming, past } = sorted(base);

    if (upcoming.length > 0) {
      root.append(eventCard(upcoming[0], base, true));
      if (upcoming.length > 1) root.append(el("p", "ev-more", `ほか${upcoming.length - 1}件の予定があります`));
      return;
    }

    const empty = el("p", "ev-preview-empty", "次の勉強会・イベントは準備中です。決まったらお知らせと通知でお知らせします。");
    root.append(empty);
    if (past[0]) root.append(el("p", "ev-more", `前回: ${dateLabel(past[0])} ${past[0].title}`));
  }

  function render() {
    const base = today();
    renderPage(base);
    renderPreview(base);
  }

  render();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") render();
  });
})();
