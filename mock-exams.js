// 模試日程一覧ページ（mock-exams.html）
(() => {
  const exams = (window.examSchedule || []).map((exam, index) => ({
    ...exam,
    id: `${exam.date}|${exam.provider}|${exam.name}`,
    order: index,
  }));

  const STAR_KEY = "ritsumeikamen-mock-stars";
  const PROVIDERS = ["河合塾", "駿台", "東進", "代ゼミ"];
  const CATEGORIES = ["記述", "共テ"];
  const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

  const byId = (id) => document.getElementById(id);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const state = {
    query: "",
    provider: "all",
    category: "all",
    starOnly: false,
    showPast: false,
    stars: loadStars(),
  };

  readHash();

  function loadStars() {
    try {
      const raw = window.localStorage?.getItem(STAR_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(list) ? list : []);
    } catch {
      return new Set();
    }
  }

  function saveStars() {
    try {
      window.localStorage?.setItem(STAR_KEY, JSON.stringify([...state.stars]));
    } catch {
      // 保存できない環境では、このページを開いている間だけ有効
    }
  }

  function readHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (params.get("q")) state.query = params.get("q");
    if (PROVIDERS.includes(params.get("p"))) state.provider = params.get("p");
    if (CATEGORIES.includes(params.get("c"))) state.category = params.get("c");
    state.starOnly = params.get("star") === "1";
    state.showPast = params.get("past") === "1";
  }

  function writeHash() {
    const params = new URLSearchParams();
    if (state.query) params.set("q", state.query);
    if (state.provider !== "all") params.set("p", state.provider);
    if (state.category !== "all") params.set("c", state.category);
    if (state.starOnly) params.set("star", "1");
    if (state.showPast) params.set("past", "1");
    const hash = params.toString();
    history.replaceState(null, "", hash ? `#${hash}` : location.pathname + location.search);
  }

  function parseLocalDate(value) {
    const [y, m, d] = String(value).split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function today() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function daysUntil(exam, base) {
    return Math.round((parseLocalDate(exam.date) - base) / 86400000);
  }

  function isPast(exam, base) {
    return parseLocalDate(exam.endDate || exam.date) < base;
  }

  function isToday(exam, base) {
    return parseLocalDate(exam.date) <= base && parseLocalDate(exam.endDate || exam.date) >= base;
  }

  function dateLabel(exam) {
    if (exam.displayDate) return exam.displayDate;
    const d = parseLocalDate(exam.date);
    return `${d.getMonth() + 1}/${d.getDate()}(${WEEK[d.getDay()]})`;
  }

  function normalize(text) {
    return String(text || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/東工大|東京医科歯科|医科歯科/g, "東京科学大")
      .replace(/神戸大/g, "神大")
      .replace(/共通テスト|共テ/g, "共テ");
  }

  function matches(exam, base) {
    if (!state.showPast && !state.starOnly && isPast(exam, base)) return false;
    if (state.starOnly && !state.stars.has(exam.id)) return false;
    if (state.provider !== "all" && !String(exam.provider).includes(state.provider)) return false;
    if (state.category !== "all" && exam.category !== state.category) return false;
    if (state.query) {
      const hay = normalize(`${exam.name} ${exam.provider} ${exam.category}`);
      const words = state.query.split(/[\s　]+/).map(normalize).filter(Boolean);
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  }

  function providerClass(provider) {
    if (provider.includes("河合")) return "is-kawai";
    if (provider.includes("駿台")) return "is-sundai";
    if (provider.includes("東進")) return "is-toshin";
    return "is-yozemi";
  }

  function renderChips(rootId, options, key) {
    const root = byId(rootId);
    root.innerHTML = "";
    [["all", "すべて"], ...options.map((o) => [o, o])].forEach(([value, label]) => {
      const button = el("button", state[key] === value ? "is-active" : "", label);
      button.type = "button";
      button.setAttribute("aria-pressed", String(state[key] === value));
      button.addEventListener("click", () => {
        state[key] = value;
        renderChips(rootId, options, key);
        update();
      });
      root.append(button);
    });
  }

  function renderNext(base) {
    const root = byId("mxNext");
    root.innerHTML = "";
    const starredUpcoming = exams
      .filter((e) => state.stars.has(e.id) && !isPast(e, base))
      .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
    const upcoming = exams
      .filter((e) => !isPast(e, base))
      .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
    const target = starredUpcoming[0] || upcoming[0];

    if (!target) {
      root.append(el("p", "mx-next__empty", "今年度の模試はすべて終了しました。"));
      return;
    }

    const days = daysUntil(target, base);
    const card = el("div", "mx-next__card");
    const text = el("div", "mx-next__text");
    text.append(
      el("span", "mx-next__label", starredUpcoming[0] ? "★ 次に受ける模試" : "次の模試"),
      el("strong", "mx-next__name", target.name),
      el("span", "mx-next__meta", [dateLabel(target), target.provider, target.category, target.fee].filter(Boolean).join(" / ")),
    );
    const count = el("div", "mx-next__count");
    if (days <= 0) {
      count.append(el("strong", "", "今日"));
    } else {
      count.append(el("small", "", "あと"), el("strong", "", String(days)), el("small", "", "日"));
    }
    card.append(text, count);
    root.append(card);

    if (!starredUpcoming[0]) {
      root.append(el("p", "mx-next__hint", "受ける模試に★を付けると、ここに次の受験日までのカウントダウンが出て、スマホのカレンダーにも追加できます。"));
    }
  }

  function toCalendarEvent(exam) {
    return {
      uid: `mock|${exam.id}`,
      title: `【模試】${exam.name}`,
      date: exam.date,
      endDate: exam.endDate,
      description: [
        [exam.provider, exam.category, exam.fee ? exam.fee.replace(/\s+/g, "") : ""].filter(Boolean).join(" / "),
        "申込期間・会場は各予備校の公式サイトで確認してください。",
        "立命館仮面浪人サークル 模試一覧:",
      ].join("\n"),
      url: new URL("./mock-exams.html#star=1", location.href).href,
      alarmMinutesBefore: 240, // 終日予定の0時から4時間前 = 前日20時
    };
  }

  function renderCalendar(base) {
    const root = byId("mxCal");
    if (!root || !window.calendarExport) return;
    const targets = exams
      .filter((e) => state.stars.has(e.id) && !isPast(e, base))
      .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
    root.hidden = targets.length === 0;
    if (targets.length === 0) return;

    byId("mxCalLead").textContent = `★を付けたこれからの模試 ${targets.length}件を、スマホやPCのカレンダーにまとめて入れられます。`;
    byId("mxCalDownload").textContent = `${targets.length}件をカレンダーに追加`;

    const google = byId("mxCalGoogle");
    google.innerHTML = "";
    targets.forEach((exam) => {
      const item = el("li");
      const link = el("a", "", `${dateLabel(exam)} ${exam.name}`);
      link.href = window.calendarExport.googleUrl(toCalendarEvent(exam));
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      item.append(link);
      google.append(item);
    });
  }

  function downloadCalendar() {
    const base = today();
    const targets = exams
      .filter((e) => state.stars.has(e.id) && !isPast(e, base))
      .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));
    if (targets.length === 0) return;
    const ics = window.calendarExport.toIcs(targets.map(toCalendarEvent), "受ける模試（立命館仮面浪人サークル）");
    window.calendarExport.download("mock-exams.ics", ics);
  }

  function renderList(base) {
    const list = byId("mxList");
    const months = byId("mxMonths");
    list.innerHTML = "";
    months.innerHTML = "";

    const filtered = exams
      .filter((e) => matches(e, base))
      .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date) || a.order - b.order);

    const upcomingCount = filtered.filter((e) => !isPast(e, base)).length;
    const starCount = exams.filter((e) => state.stars.has(e.id)).length;
    byId("mxCount").textContent = `${filtered.length}件表示${state.showPast ? `（うち今後 ${upcomingCount}件）` : ""}・★ ${starCount}件`;

    const dirty = state.query || state.provider !== "all" || state.category !== "all" || state.starOnly || state.showPast;
    byId("mxReset").hidden = !dirty;

    if (filtered.length === 0) {
      const empty = el("div", "mx-empty");
      empty.append(el("strong", "", "該当する模試がありません"));
      empty.append(
        el("p", "", state.starOnly ? "一覧の☆をタップすると★になり、ここに表示されます。" : "検索語や絞り込み条件を変えてみてください。"),
      );
      list.append(empty);
      return;
    }

    // 月 → 日付 の2段でグループ化
    const monthGroups = [];
    filtered.forEach((exam) => {
      const d = parseLocalDate(exam.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      let month = monthGroups[monthGroups.length - 1];
      if (!month || month.key !== key) {
        month = { key, year: d.getFullYear(), month: d.getMonth() + 1, days: [] };
        monthGroups.push(month);
      }
      let day = month.days[month.days.length - 1];
      if (!day || day.date !== exam.date) {
        day = { date: exam.date, exams: [] };
        month.days.push(day);
      }
      day.exams.push(exam);
    });

    const showYear = new Set(monthGroups.map((m) => m.year)).size > 1;

    monthGroups.forEach((month) => {
      const total = month.days.reduce((sum, d) => sum + d.exams.length, 0);
      const anchor = `mx-${month.key}`;
      const label = `${showYear && month.month === 1 ? `${month.year}年` : ""}${month.month}月`;

      const jump = el("a", "", label);
      jump.href = `#${anchor}`;
      jump.addEventListener("click", (event) => {
        event.preventDefault();
        byId(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      months.append(jump);

      const section = el("section", "mx-month");
      section.id = anchor;
      const head = el("h2", "mx-month__head");
      head.append(el("span", "", label), el("small", "", `${total}件`));
      section.append(head);

      month.days.forEach((day) => {
        const first = day.exams[0];
        const past = isPast(first, base);
        const row = el("article", `exam-group mx-day${past ? " is-past" : ""}${isToday(first, base) ? " is-today" : ""}`);

        const when = el("div", "mx-day__when");
        const time = el("time", "", dateLabel(first));
        time.dateTime = day.date;
        when.append(time);
        const days = daysUntil(first, base);
        let badge = "";
        if (isToday(first, base)) badge = "今日";
        else if (past) badge = "終了";
        else if (days <= 60) badge = `あと${days}日`;
        if (badge) when.append(el("span", `mx-badge${isToday(first, base) ? " is-today" : past ? " is-past" : ""}`, badge));

        const items = el("div", "exam-group__items");
        day.exams.forEach((exam) => {
          const item = el("div", "exam-item mx-item");
          const body = el("div", "mx-item__body");
          body.append(el("h3", "", exam.name));
          const meta = el("p", "mx-item__meta");
          meta.append(el("span", `mx-tag ${providerClass(exam.provider)}`, exam.provider));
          meta.append(el("span", `mx-tag mx-tag--cat${exam.category === "共テ" ? " is-kyote" : ""}`, exam.category));
          if (exam.fee) meta.append(el("span", "mx-fee", exam.fee.replace(/\s+/g, "")));
          body.append(meta);

          const starred = state.stars.has(exam.id);
          const star = el("button", `mx-star${starred ? " is-on" : ""}`, starred ? "★" : "☆");
          star.type = "button";
          star.setAttribute("aria-pressed", String(starred));
          star.setAttribute("aria-label", `${exam.name}を${starred ? "受験予定から外す" : "受験予定に追加"}`);
          star.addEventListener("click", () => {
            if (state.stars.has(exam.id)) state.stars.delete(exam.id);
            else state.stars.add(exam.id);
            saveStars();
            update(false);
          });

          item.append(body, star);
          items.append(item);
        });

        row.append(when, items);
        section.append(row);
      });

      list.append(section);
    });
  }

  function update(syncHash = true) {
    const base = today();
    if (syncHash) writeHash();
    renderNext(base);
    renderCalendar(base);
    renderList(base);
  }

  const search = byId("mxSearch");
  search.value = state.query;
  let timer = null;
  search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.query = search.value.trim();
      update();
    }, 120);
  });

  const starOnly = byId("mxStarOnly");
  const showPast = byId("mxShowPast");
  starOnly.checked = state.starOnly;
  showPast.checked = state.showPast;
  starOnly.addEventListener("change", () => {
    state.starOnly = starOnly.checked;
    update();
  });
  showPast.addEventListener("change", () => {
    state.showPast = showPast.checked;
    update();
  });

  byId("mxReset").addEventListener("click", () => {
    Object.assign(state, { query: "", provider: "all", category: "all", starOnly: false, showPast: false });
    search.value = "";
    starOnly.checked = false;
    showPast.checked = false;
    renderChips("mxProvider", PROVIDERS, "provider");
    renderChips("mxCategory", CATEGORIES, "category");
    update();
  });

  byId("mxCalDownload")?.addEventListener("click", downloadCalendar);

  renderChips("mxProvider", PROVIDERS, "provider");
  renderChips("mxCategory", CATEGORIES, "category");
  update(false);
})();
