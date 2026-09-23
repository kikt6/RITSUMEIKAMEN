const content = window.siteContent || {};
const examSchedule = window.examSchedule || [];
const libraryHours = window.libraryHours || null;
const coopHours = window.coopHours || null;

const campusOptions = [
  { label: "KIC", value: "kic", names: ["衣笠", "KIC"] },
  { label: "BKC", value: "bkc", names: ["BKC"] },
  { label: "OIC", value: "oic", names: ["OIC"] },
];

const libraryCampusStorageKey = "ritsumeikamen-library-campus";
const coopCampusStorageKey = "ritsumeikamen-coop-campus";

let activeLibraryMonthOffset = 0;
let activeLibraryCampus = getSavedCampus(libraryCampusStorageKey);
let activeCoopCampus = getSavedCampus(coopCampusStorageKey);

const byId = (id) => document.getElementById(id);

function setText(id, value) {
  const element = byId(id);
  if (!element) return;
  element.textContent = value || "";
  element.hidden = !value;
}

function setLink(element, item) {
  element.href = item.url || "#";
  element.textContent = item.label || item.title || "開く";

  if (item.url && item.url.startsWith("http")) {
    element.target = "_blank";
    element.rel = "noopener noreferrer";
  }
}

function formatUpdatedAt(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return `更新日: ${value}`;
  return `更新日: ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function renderImportantNotice() {
  const notice = content.importantNotice;
  const root = byId("importantNotice");
  if (!root || !notice) return;

  root.innerHTML = "";

  const label = document.createElement("div");
  label.className = "alert__label";
  label.textContent = notice.label || "重要";

  const body = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = notice.title || "";
  const text = document.createElement("p");
  text.textContent = notice.body || "";

  body.append(title, text);
  root.append(label, body);
}

function renderMockExam() {
  const settings = content.mockExam || {};
  const root = byId("mockExam");
  if (!root) return;

  root.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section__header section__header--stack";

  const headerText = document.createElement("div");

  const title = document.createElement("h2");
  title.textContent = settings.title || "次回模試日程";

  const lead = document.createElement("p");
  lead.textContent = settings.lead || "";

  headerText.append(title, lead);
  header.append(headerText);

  const list = document.createElement("div");
  list.className = "exam-list";

  const today = getToday(settings.previewDate);
  const limit = addMonths(today, Number(settings.windowMonths) || 2);
  const visibleExams = examSchedule
    .filter((exam) => {
      const start = parseLocalDate(exam.date);
      const end = parseLocalDate(exam.endDate || exam.date);
      return end >= today && start <= limit;
    })
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));

  const initialCount = Math.max(1, Number(settings.initialCount) || 6);
  let hiddenCount = 0;
  let toggle = null;

  if (visibleExams.length === 0) {
    renderEmpty(list, "2か月以内に掲載対象の模試はありません。");
  } else {
    const groups = [];
    visibleExams.forEach((exam) => {
      const last = groups[groups.length - 1];
      if (last && last.date === exam.date) {
        last.exams.push(exam);
      } else {
        groups.push({ date: exam.date, displayDate: exam.displayDate, exams: [exam] });
      }
    });

    let shown = 0;
    groups.forEach((group) => {
      const row = document.createElement("article");
      row.className = "exam-group";
      if (shown >= initialCount) {
        row.hidden = true;
        row.classList.add("exam-group--extra");
        hiddenCount += group.exams.length;
      }
      shown += group.exams.length;

      const date = document.createElement("time");
      date.dateTime = group.date;
      date.textContent = group.displayDate || formatDateLabel(parseLocalDate(group.date));

      const items = document.createElement("div");
      items.className = "exam-group__items";
      group.exams.forEach((exam) => {
        const item = document.createElement("div");
        item.className = "exam-item";

        const name = document.createElement("h3");
        name.textContent = exam.name || "";

        const meta = document.createElement("p");
        meta.textContent = [exam.provider, exam.category, exam.fee].filter(Boolean).join(" / ");

        item.append(name, meta);
        items.append(item);
      });

      row.append(date, items);
      list.append(row);
    });

    if (hiddenCount > 0) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "exam-list__toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = `残り${hiddenCount}件をすべて表示`;
      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        list.querySelectorAll(".exam-group--extra").forEach((row) => {
          row.hidden = expanded;
        });
        toggle.setAttribute("aria-expanded", String(!expanded));
        toggle.textContent = expanded ? `残り${hiddenCount}件をすべて表示` : "直近だけ表示に戻す";
      });
    }
  }

  const count = document.createElement("p");
  count.className = "mock-exam__count";
  count.textContent = `${formatDateLabel(today)}から${Number(settings.windowMonths) || 2}か月以内: ${visibleExams.length}件`;

  const allLink = document.createElement("a");
  allLink.className = "mock-exam__all";
  allLink.href = "./mock-exams.html";
  allLink.textContent = "模試をすべて見る（年間一覧・検索）";

  root.append(header, count, list);
  if (toggle) root.append(toggle);
  root.append(allLink);
}

function parseLocalDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getToday(previewDate) {
  const base = previewDate ? parseLocalDate(previewDate) : new Date();
  return new Date(base.getFullYear(), base.getMonth(), base.getDate());
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateLabel(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getSavedCampus(key) {
  try {
    const saved = window.localStorage?.getItem(key);
    return campusOptions.some((option) => option.value === saved) ? saved : "kic";
  } catch {
    return "kic";
  }
}

function saveCampus(key, value) {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // localStorage may be unavailable in some private browsing modes.
  }
}

function getCampusOption(value) {
  return campusOptions.find((option) => option.value === value) || campusOptions[0];
}

function campusMatches(campus, value) {
  const option = getCampusOption(value);
  return option.names.includes(String(campus || ""));
}

function renderCampusControls(rootId, activeValue, onSelect) {
  const root = byId(rootId);
  if (!root) return;
  root.innerHTML = "";

  campusOptions.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option.label;
    button.className = option.value === activeValue ? "is-active" : "";
    button.addEventListener("click", () => onSelect(option.value));
    root.append(button);
  });
}

function renderCommonTestCountdown() {
  const root = byId("commonTestCountdown");
  if (!root) return;

  const settings = content.commonTest || {};
  const target = new Date(settings.targetAt || "2027-01-16T09:30:00+09:00");
  if (Number.isNaN(target.getTime())) {
    root.hidden = true;
    return;
  }

  setText("commonTestTitle", settings.title || "共通テスト開始まで");
  setText("commonTestTarget", settings.targetLabel || "");

  const update = () => {
    const totalSeconds = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    setText("countdownDays", String(days));
    setText("countdownHours", String(hours).padStart(2, "0"));
    setText("countdownMinutes", String(minutes).padStart(2, "0"));
    setText("countdownSeconds", String(seconds).padStart(2, "0"));

    if (totalSeconds === 0) {
      setText("commonTestTarget", "開始時刻になりました。");
    }
  };

  update();
  window.setInterval(update, 1000);
}

function daysFromToday(value) {
  return Math.round((parseLocalDate(value) - getToday()) / 86400000);
}

function renderMilestones() {
  const root = byId("heroMilestones");
  if (root) {
    const items = ((content.commonTest || {}).milestones || []).filter((m) => m?.date && daysFromToday(m.date) >= 0);
    root.textContent = items.map((m) => `${m.label}まで あと${daysFromToday(m.date)}日`).join("　/　");
    root.hidden = items.length === 0;
  }

  document.querySelectorAll(".entrance-date-card[data-date]").forEach((card) => {
    card.querySelector(".entrance-date-card__days")?.remove();
    const days = daysFromToday(card.dataset.date);
    if (days < 0) {
      card.classList.add("is-past");
      return;
    }
    const badge = document.createElement("em");
    badge.className = "entrance-date-card__days";
    badge.textContent = days === 0 ? "今日" : `あと${days}日`;
    card.append(badge);
  });
}

const mockStarStorageKey = "ritsumeikamen-mock-stars";

function loadMockStars() {
  try {
    const raw = window.localStorage?.getItem(mockStarStorageKey);
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

function renderStarredMockCountdown() {
  const root = byId("heroMockCountdown");
  if (!root) return;

  const stars = loadMockStars();
  const today = getToday();
  const upcoming = examSchedule
    .filter((exam) => stars.has(`${exam.date}|${exam.provider}|${exam.name}`))
    .filter((exam) => parseLocalDate(exam.endDate || exam.date) >= today)
    .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date));

  root.innerHTML = "";
  root.hidden = false;

  if (upcoming.length === 0) {
    root.className = "hero-mock hero-mock--hint";
    root.href = "./mock-exams.html";
    root.textContent = "★ 受ける模試を設定すると、ここに模試までの日数が出ます →";
    return;
  }

  root.className = "hero-mock";
  root.href = "./mock-exams.html#star=1";

  const daysUntil = (exam) => Math.round((parseLocalDate(exam.date) - today) / 86400000);
  const dayLabel = (exam) => exam.displayDate || formatDateLabel(parseLocalDate(exam.date));

  const [next, ...rest] = upcoming;
  const main = document.createElement("div");
  main.className = "hero-mock__main";

  const text = document.createElement("div");
  text.className = "hero-mock__text";
  const label = document.createElement("span");
  label.className = "hero-mock__label";
  label.textContent = "★ 次に受ける模試";
  const name = document.createElement("strong");
  name.className = "hero-mock__name";
  name.textContent = next.name || "";
  const meta = document.createElement("span");
  meta.className = "hero-mock__meta";
  meta.textContent = [dayLabel(next), next.provider].filter(Boolean).join(" / ");
  text.append(label, name, meta);

  const count = document.createElement("div");
  count.className = "hero-mock__count";
  const days = daysUntil(next);
  if (days <= 0) {
    const strong = document.createElement("strong");
    strong.textContent = "今日";
    count.append(strong);
  } else {
    const pre = document.createElement("small");
    pre.textContent = "あと";
    const strong = document.createElement("strong");
    strong.textContent = String(days);
    const post = document.createElement("small");
    post.textContent = "日";
    count.append(pre, strong, post);
  }

  main.append(text, count);
  root.append(main);

  if (rest.length > 0) {
    const list = document.createElement("ul");
    list.className = "hero-mock__list";
    rest.slice(0, 2).forEach((exam) => {
      const item = document.createElement("li");
      const itemName = document.createElement("span");
      itemName.textContent = `${dayLabel(exam)} ${exam.name}`;
      const itemDays = document.createElement("b");
      itemDays.textContent = `あと${daysUntil(exam)}日`;
      item.append(itemName, itemDays);
      list.append(item);
    });
    if (rest.length > 2) {
      const more = document.createElement("li");
      more.className = "hero-mock__more";
      more.textContent = `ほか${rest.length - 2}件`;
      list.append(more);
    }
    root.append(list);
  }
}

function initStarredMockCountdown() {
  renderStarredMockCountdown();
  window.addEventListener("pageshow", renderStarredMockCountdown);
  window.addEventListener("storage", (event) => {
    if (event.key === mockStarStorageKey) renderStarredMockCountdown();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") renderStarredMockCountdown();
  });
  window.setInterval(renderStarredMockCountdown, 60 * 1000);
}

function renderLibraryCalendars(monthOffset = activeLibraryMonthOffset, campusValue = activeLibraryCampus) {
  const settings = content.libraries || {};
  const calendars = libraryHours?.libraries || settings.calendars || [];
  activeLibraryMonthOffset = monthOffset;
  activeLibraryCampus = getCampusOption(campusValue).value;
  saveCampus(libraryCampusStorageKey, activeLibraryCampus);

  setText("libraryTitle", settings.title || "立命館大学 図書館開館時間");
  setText("libraryLead", settings.lead || "");

  const sourceLink = byId("librarySourceLink");
  if (sourceLink) {
    sourceLink.href = settings.sourceUrl || "https://www.ritsumei.ac.jp/lib/a03/010/";
  }

  renderLibraryMonthControls(activeLibraryMonthOffset);
  renderCampusControls("libraryCampusControls", activeLibraryCampus, (value) => {
    renderLibraryCalendars(activeLibraryMonthOffset, value);
    renderTodayLibrary(value);
  });

  const root = byId("libraryCalendars");
  if (!root) return;
  root.innerHTML = "";

  const visibleCalendars = calendars.filter((calendar) => campusMatches(calendar.campus, activeLibraryCampus));

  const compact = root.dataset.expandAll !== "true" && window.matchMedia?.("(max-width: 620px)").matches;

  visibleCalendars.forEach((calendar, index) => {
    const card = document.createElement("details");
    card.className = "library-card";
    card.open = !compact || index === 0;

    const header = document.createElement("summary");
    header.className = "library-card__header";

    const title = document.createElement("h3");
    title.textContent = calendar.name;

    const campus = document.createElement("span");
    campus.textContent = calendar.campus;

    const calendarBody = document.createElement("div");
    calendarBody.className = "library-month";

    const weekdayHeader = document.createElement("div");
    weekdayHeader.className = "library-weekdays";
    ["日", "月", "火", "水", "木", "金", "土"].forEach((day) => {
      const item = document.createElement("span");
      item.textContent = day;
      weekdayHeader.append(item);
    });

    const grid = document.createElement("div");
    grid.className = "library-days";

    const monthData = calendar.months?.[activeLibraryMonthOffset];
    const days = monthData?.days || [];
    const firstDay = days[0] ? parseLocalDate(days[0].date).getDay() : 0;
    const todayKey = toDateKey(getToday());

    for (let i = 0; i < firstDay; i += 1) {
      const blank = document.createElement("div");
      blank.className = "library-day library-day--blank";
      grid.append(blank);
    }

    days.forEach((day) => {
      const cellDate = parseLocalDate(day.date);
      const cell = document.createElement("div");
      cell.className = day.closed ? "library-day is-closed" : "library-day";
      if (cellDate.getDay() === 0) cell.classList.add("is-sunday");
      if (day.date === todayKey) cell.classList.add("is-today");
      cell.style.setProperty("--day-bg", cellDate.getDay() === 0 ? "var(--cal-sun)" : normalizeCalendarColor(day.bgcolor));

      const date = document.createElement("span");
      date.className = "library-day__date";
      date.textContent = String(cellDate.getDate());

      const hours = document.createElement("span");
      hours.className = "library-day__hours";
      hours.textContent = simplifyHours(day.hours);

      cell.append(date, hours);
      grid.append(cell);
    });

    if (days.length === 0) {
      renderEmpty(grid, "開館時間データを取得できませんでした。");
    }

    calendarBody.append(weekdayHeader, grid);

    header.append(title, campus);
    card.append(header, calendarBody);
    root.append(card);
  });

  renderEmpty(root, `${getCampusOption(activeLibraryCampus).label}の図書館カレンダーはまだありません。`);
}

function renderTodayLibrary(campusValue = activeLibraryCampus) {
  const settings = content.libraries || {};
  const calendars = libraryHours?.libraries || settings.calendars || [];
  const root = byId("todayLibrary");
  if (!root) return;

  activeLibraryCampus = getCampusOption(campusValue).value;
  saveCampus(libraryCampusStorageKey, activeLibraryCampus);
  renderCampusControls("todayLibraryCampusControls", activeLibraryCampus, (value) => {
    renderTodayLibrary(value);
    renderLibraryCalendars(activeLibraryMonthOffset, value);
  });

  const today = getToday(settings.previewDate);
  const todayKey = toDateKey(today);
  const tomorrowKey = toDateKey(addDays(today, 1));
  const campusLabel = getCampusOption(activeLibraryCampus).label;
  setText("todayLibraryLead", `${formatFullDateLabel(today)} / ${campusLabel}`);

  root.innerHTML = "";
  calendars
    .filter((calendar) => campusMatches(calendar.campus, activeLibraryCampus))
    .forEach((calendar) => {
      const day = (calendar.months || [])
        .flatMap((month) => month.days || [])
        .find((item) => item.date === todayKey);
      const tomorrow = (calendar.months || [])
        .flatMap((month) => month.days || [])
        .find((item) => item.date === tomorrowKey);

      const card = document.createElement("article");
      card.className = `today-library-card ${day?.closed ? "is-closed" : ""}`;

      const main = document.createElement("div");
      main.className = "today-library-card__main";

      const name = document.createElement("h3");
      name.textContent = calendar.name;

      const hours = document.createElement("p");
      hours.textContent = day ? simplifyHours(day.hours) : "未掲載";

      const tomorrowBlock = document.createElement("div");
      tomorrowBlock.className = `today-library-card__tomorrow ${tomorrow?.closed ? "is-closed" : ""}`;

      const tomorrowLabel = document.createElement("span");
      tomorrowLabel.textContent = "明日";

      const tomorrowHours = document.createElement("strong");
      tomorrowHours.textContent = tomorrow ? simplifyHours(tomorrow.hours) : "未掲載";

      main.append(name, hours);
      tomorrowBlock.append(tomorrowLabel, tomorrowHours);
      card.append(main, tomorrowBlock);
      root.append(card);
    });

  renderEmpty(root, `${campusLabel}の今日の図書館情報はありません。`);
}

function renderCoopHours(campusValue = activeCoopCampus) {
  const settings = content.coop || {};
  const root = byId("coopHours");
  if (!root) return;
  activeCoopCampus = getCampusOption(campusValue).value;
  saveCampus(coopCampusStorageKey, activeCoopCampus);

  setText("coopTitle", settings.title || "学食・生協営業時間");
  setText("coopLead", settings.lead || "");

  const sourceLink = byId("coopSourceLink");
  if (sourceLink) {
    sourceLink.href = settings.sourceUrl || coopHours?.sourceUrl || "https://www.ritsco-op.jp/schedule/schedule_202605.html";
  }

  const today = getToday(settings.previewDate);
  const dayCount = Number(settings.displayDays) || 14;
  const days = Array.from({ length: dayCount }, (_, index) => addDays(today, index));
  const campusLabel = getCampusOption(activeCoopCampus).label;
  const rows = collectCoopRows(days).filter((row) => campusMatches(row.campus, activeCoopCampus));

  renderCampusControls("coopCampusControls", activeCoopCampus, renderCoopHours);

  const rangeText =
    dayCount === 1
      ? `今日（${formatFullDateLabel(days[0])}）の営業時間 / ${campusLabel} / ${rows.length}店舗`
      : `${formatFullDateLabel(days[0])}から${dayCount}日間 / ${campusLabel} / ${rows.length}店舗`;
  setText("coopRange", rangeText);

  root.innerHTML = "";
  if (!coopHours || rows.length === 0) {
    renderEmpty(root, "営業時間データを表示できませんでした。");
    return;
  }

  if (dayCount === 1) {
    const cards = document.createElement("div");
    cards.className = "coop-cards";

    const key = toDateKey(days[0]);
    const openRows = rows.filter((row) => getCoopDayClass(row.days.get(key)) !== "is-closed");
    const closedRows = rows.filter((row) => getCoopDayClass(row.days.get(key)) === "is-closed");

    const summary = document.createElement("p");
    summary.className = `coop-summary${openRows.length === 0 ? " is-all-closed" : ""}`;
    summary.textContent =
      openRows.length === 0
        ? `今日は${campusLabel}の学食・生協はすべてお休みです。`
        : `営業中の予定 ${openRows.length}店舗${closedRows.length ? ` / お休み ${closedRows.length}店舗` : ""}`;
    root.append(summary);

    openRows.forEach((row) => {
      const info = row.days.get(key);
      const card = document.createElement("article");
      card.className = `coop-card ${getCoopDayClass(info)}`;

      const heading = document.createElement("div");
      heading.className = "coop-card__heading";
      const name = document.createElement("h3");
      name.textContent = row.name;
      const meta = document.createElement("span");
      meta.textContent = row.building || "";
      heading.append(name);
      if (row.building) heading.append(meta);

      const hours = document.createElement("p");
      hours.className = "coop-card__hours";
      hours.textContent = info ? simplifyCoopHours(info.hours) : "未掲載";

      card.append(heading, hours);
      cards.append(card);
    });

    if (openRows.length) root.append(cards);

    if (closedRows.length) {
      const closed = document.createElement("details");
      closed.className = "coop-closed";
      const title = document.createElement("summary");
      title.textContent = `今日お休みの店舗（${closedRows.length}）`;
      const list = document.createElement("p");
      list.textContent = closedRows.map((row) => (row.building ? `${row.name}（${row.building}）` : row.name)).join("、");
      closed.append(title, list);
      root.append(closed);
    }
    return;
  }

  const table = document.createElement("table");
  table.className = "coop-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const shopHead = document.createElement("th");
  shopHead.scope = "col";
  shopHead.textContent = "店舗";
  headerRow.append(shopHead);

  days.forEach((day) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.innerHTML = `<span>${formatDateLabel(day)}</span><small>${weekdayLabel(day)}</small>`;
    headerRow.append(th);
  });

  thead.append(headerRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");

    const shopCell = document.createElement("th");
    shopCell.scope = "row";
    const shopName = document.createElement("strong");
    shopName.textContent = row.name;
    const meta = document.createElement("span");
    meta.textContent = row.building || "";
    shopCell.append(shopName);
    if (row.building) shopCell.append(meta);
    tr.append(shopCell);

    days.forEach((day) => {
      const key = toDateKey(day);
      const info = row.days.get(key);
      const td = document.createElement("td");
      td.className = getCoopDayClass(info);

      const status = document.createElement("span");
      status.className = "coop-status";
      status.textContent = info?.status || "-";

      const hours = document.createElement("span");
      hours.className = "coop-hours-text";
      hours.textContent = info ? simplifyCoopHours(info.hours) : "未掲載";

      td.append(status, hours);
      tr.append(td);
    });

    tbody.append(tr);
  });

  table.append(tbody);
  root.append(table);

}

function collectCoopRows(days) {
  if (!coopHours?.months) return [];

  const targetKeys = new Set(days.map(toDateKey));
  const rows = new Map();

  coopHours.months.forEach((month) => {
    (month.shops || []).forEach((shop) => {
      const key = [shop.campus, shop.building, shop.name].join("|");
      if (!rows.has(key)) {
        rows.set(key, {
          campus: shop.campus,
          building: shop.building,
          name: shop.name,
          detailUrl: shop.detailUrl,
          days: new Map(),
        });
      }

      shop.days.forEach((day) => {
        if (!targetKeys.has(day.date)) return;
        rows.get(key).days.set(day.date, day);
      });
    });
  });

  return Array.from(rows.values())
    .filter((row) => row.days.size > 0)
    .sort((a, b) => {
      const campus = a.campus.localeCompare(b.campus, "ja");
      if (campus !== 0) return campus;
      const building = a.building.localeCompare(b.building, "ja");
      if (building !== 0) return building;
      return a.name.localeCompare(b.name, "ja");
    });
}

function renderLibraryMonthControls(activeOffset) {
  const root = byId("libraryMonthControls");
  if (!root) return;
  root.innerHTML = "";

  const months = libraryHours?.months?.length ? libraryHours.months : [getMonthQuery(0), getMonthQuery(1)];
  months.slice(0, 2).forEach((month, offset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = offset === 0 ? `今月 ${month.label}` : `来月 ${month.label}`;
    button.className = offset === activeOffset ? "is-active" : "";
    button.addEventListener("click", () => renderLibraryCalendars(offset, activeLibraryCampus));
    root.append(button);
  });
}

function getMonthQuery(offset) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return {
    query: `${year}-${month}`,
    label: `${year}/${month}`,
  };
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatFullDateLabel(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function weekdayLabel(date) {
  return ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
}

function normalizeCalendarColor(color) {
  const value = String(color || "").toLowerCase();
  if (value === "#ff6666") return "var(--cal-holiday)";
  if (value === "#99ffff") return "var(--cal-special)";
  if (value === "#ffff00") return "var(--cal-short)";
  return "var(--surface)";
}

function simplifyHours(hours) {
  const value = String(hours || "不明");
  if (value.includes("閉館")) return "閉館";
  return value.replace(" / Closed", "");
}

function simplifyCoopHours(hours) {
  const value = String(hours || "未掲載");
  if (value.toUpperCase() === "CLOSED") return "CLOSED";
  return value;
}

function getCoopDayClass(info) {
  if (!info) return "is-missing";
  if (info.closed) return "is-closed";
  if (info.status === "○") return "is-open";
  return "is-special";
}

function renderQuickLinks() {
  const root = byId("quickLinks");
  if (!root) return;
  root.innerHTML = "";

  (content.quickLinks || []).forEach((item) => {
    const link = document.createElement("a");
    link.className = "quick-link";
    setLink(link, item);
    root.append(link);
  });

  renderEmpty(root, "リンクはまだありません。");
}

function renderOfficialLinks() {
  const root = byId("officialLinks");
  if (!root) return;
  root.innerHTML = "";

  (content.officialLinks || []).forEach((item) => {
    const link = document.createElement("a");
    link.className = "official-link";
    setLink(link, item);
    root.append(link);
  });

  renderEmpty(root, "公式リンクはまだありません。");
}

function isVisibleItem(item) {
  if (!item?.expiresAt) return true;
  return parseLocalDate(item.expiresAt) >= getToday();
}

function getVisibleItems(items) {
  return (items || []).filter(isVisibleItem);
}

function renderCards(id, items, emptyMessage = "表示する項目はまだありません。") {
  const root = byId(id);
  if (!root) return;
  root.innerHTML = "";

  getVisibleItems(items).forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    const tag = document.createElement("span");
    tag.className = "card__tag";
    tag.textContent = item.tag || "";

    const title = document.createElement("h3");
    title.textContent = item.title || "";

    const head = document.createElement("div");
    head.className = "card__head";
    head.append(tag);

    if (item.expiresAt && id === "notices") {
      const days = daysFromToday(item.expiresAt);
      const date = parseLocalDate(item.expiresAt);
      const due = document.createElement("span");
      due.className = `card__due${days <= 7 ? " is-soon" : ""}`;
      due.textContent = `${date.getMonth() + 1}/${date.getDate()}(${weekdayLabel(date)})まで${days === 0 ? "・今日" : `・あと${days}日`}`;
      head.append(due);
    }

    const body = document.createElement("p");
    body.textContent = item.body || "";

    card.append(head, title, body);

    if (id === "notices" && (item.body || "").length > 80) {
      body.classList.add("card__body--clamp");
      const more = document.createElement("button");
      more.type = "button";
      more.className = "card__more";
      more.textContent = "続きを読む";
      more.setAttribute("aria-expanded", "false");
      more.addEventListener("click", () => {
        const open = body.classList.toggle("is-open");
        more.textContent = open ? "閉じる" : "続きを読む";
        more.setAttribute("aria-expanded", String(open));
      });
      card.append(more);
    }

    if (item.url) {
      const link = document.createElement("a");
      setLink(link, { ...item, label: "開く" });
      card.append(link);
    }

    root.append(card);
  });

  renderEmpty(root, emptyMessage);
}

function renderSchedule() {
  const root = byId("schedule");
  if (!root) return;
  root.innerHTML = "";

  (content.schedule || []).forEach((item) => {
    const event = document.createElement("article");
    event.className = "event";

    const time = document.createElement("time");
    time.dateTime = item.date || "";
    time.textContent = item.displayDate || item.date || "";

    const body = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.title || "";
    const text = document.createElement("p");
    text.textContent = item.body || "";
    body.append(title, text);

    if (item.place) {
      const place = document.createElement("span");
      place.className = "event__place";
      place.textContent = item.place;
      body.append(place);
    }

    event.append(time, body);
    root.append(event);
  });

  renderEmpty(root, "予定はまだありません。");
}

function renderEmpty(root, text) {
  if (root.children.length > 0) return;
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = text;
  root.append(empty);
}

function initSideTabs() {
  const tabs = byId("sideTabs");
  const toggle = byId("sideTabsToggle");
  if (!tabs || !toggle) return;

  const setExpanded = (expanded) => {
    tabs.classList.toggle("is-collapsed", !expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-label", expanded ? "タブを隠す" : "タブを開く");
  };

  toggle.addEventListener("click", () => {
    setExpanded(tabs.classList.contains("is-collapsed"));
  });

  tabs.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setExpanded(false));
  });
}

function canUseServiceWorker() {
  if (!("serviceWorker" in navigator)) return false;
  return location.protocol === "https:" || location.hostname === "localhost";
}

function registerServiceWorker() {
  if (!canUseServiceWorker()) return;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

function getPushSettings() {
  const settings = content.pushNotifications || {};
  const appId = String(settings.oneSignalAppId || "").trim();
  return { ...settings, appId };
}

function isIosDevice() {
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandaloneApp() {
  return window.navigator.standalone === true || window.matchMedia?.("(display-mode: standalone)").matches;
}

function initPushNotifications() {
  const settings = getPushSettings();
  const section = byId("pushSection");
  if (!section) return;
  if (!settings.appId || !canUseServiceWorker()) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  setText("pushTitle", settings.title || "更新通知を受け取る");
  setText("pushLead", settings.lead || "");

  const button = byId("pushButton");
  const status = byId("pushStatus");
  button.textContent = settings.buttonLabel || "通知をオンにする";

  const setStatus = (text, state = "") => {
    status.textContent = text;
    status.dataset.state = state;
  };

  if (isIosDevice() && !isStandaloneApp()) {
    button.disabled = true;
    setStatus("iPhone では、Safari の共有メニューから「ホーム画面に追加」したアプリで開くと登録できます。", "hint");
    return;
  }

  if (typeof Notification !== "undefined" && Notification.permission === "denied") {
    button.disabled = true;
    setStatus("このブラウザで通知がブロックされています。サイト設定から通知を許可すると登録できます。", "blocked");
    return;
  }

  // OneSignal SDK は App ID が設定されているときだけ読み込む。
  // Service Worker は OneSignal 側が同じ service-worker.js を登録するので、二重登録を避けて任せる。
  const base = location.pathname.replace(/[^/]*$/, "");
  let sdkReady = false;
  setStatus("通知サービスを読み込み中…", "hint");

  // SDK の準備が終わる前にタップされたときの案内（準備後に本来のハンドラへ置き換わる）
  const earlyClick = () => {
    if (sdkReady) return;
    setStatus("通知サービスを読み込み中です。数秒待ってからもう一度押してください。", "hint");
  };
  button.addEventListener("click", earlyClick);

  const loadTimer = window.setTimeout(() => {
    if (sdkReady) return;
    setStatus(
      "通知サービスの読み込みに時間がかかっています。アプリを一度閉じて開き直すか、ホーム画面のアイコンを削除して「ホーム画面に追加」をやり直してください。",
      "error",
    );
  }, 15000);

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.init({
        appId: settings.appId,
        safari_web_id: settings.safariWebId || undefined,
        serviceWorkerPath: `${base.replace(/^\//, "")}service-worker.js`,
        serviceWorkerParam: { scope: base },
        allowLocalhostAsSecureOrigin: location.hostname === "localhost",
      });
    } catch (error) {
      window.clearTimeout(loadTimer);
      sdkReady = true;
      button.removeEventListener("click", earlyClick);
      const detail = error && error.message ? `（${error.message}）` : "";
      setStatus(`通知サービスに接続できませんでした。時間をおいて再度お試しください。${detail}`, "error");
      button.disabled = true;
      return;
    }
    window.clearTimeout(loadTimer);
    sdkReady = true;
    button.removeEventListener("click", earlyClick);

    if (!OneSignal.Notifications.isPushSupported()) {
      button.disabled = true;
      setStatus("このブラウザは通知に対応していません。", "blocked");
      return;
    }

    const refresh = () => {
      const optedIn = OneSignal.User.PushSubscription.optedIn === true;
      const granted = OneSignal.Notifications.permission === true;
      if (optedIn && granted) {
        button.textContent = "通知をオフにする";
        button.disabled = false;
        setStatus("この端末で更新通知を受け取ります。", "on");
      } else if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        button.disabled = true;
        setStatus("このブラウザで通知がブロックされています。サイト設定から通知を許可すると登録できます。", "blocked");
      } else {
        button.textContent = settings.buttonLabel || "通知をオンにする";
        button.disabled = false;
        setStatus("まだ登録されていません。", "off");
      }
    };

    OneSignal.Notifications.addEventListener("permissionChange", refresh);
    OneSignal.User.PushSubscription.addEventListener("change", refresh);

    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        if (OneSignal.User.PushSubscription.optedIn === true) {
          await OneSignal.User.PushSubscription.optOut();
        } else {
          await OneSignal.Notifications.requestPermission();
          if (OneSignal.Notifications.permission === true) {
            await OneSignal.User.PushSubscription.optIn();
          }
        }
      } catch (error) {
        const detail = error && error.message ? `（${error.message}）` : "";
        setStatus(`登録に失敗しました。もう一度お試しください。${detail}`, "error");
      }
      refresh();
    });

    refresh();
  });

  const sdk = document.createElement("script");
  sdk.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
  sdk.defer = true;
  sdk.addEventListener("error", () => {
    window.clearTimeout(loadTimer);
    sdkReady = true;
    button.removeEventListener("click", earlyClick);
    button.disabled = true;
    setStatus("通知サービスを読み込めませんでした（広告ブロッカー等）。", "error");
    registerServiceWorker();
  });
  document.head.append(sdk);

  // SDK 側の登録が何らかの理由で行われなかった場合の保険
  window.setTimeout(() => {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) registerServiceWorker();
    });
  }, 10000);
}

setText("siteName", content.siteName);
setText("pageTitle", content.pageTitle);
setText("pageLead", content.lead);
setText("updatedAt", formatUpdatedAt(content.updatedAt));
setText("noticeCount", `${getVisibleItems(content.notices).length}件`);
setText("scheduleMonth", content.scheduleMonth);

if (getPushSettings().appId) {
  initPushNotifications();
} else {
  registerServiceWorker();
  initPushNotifications();
}
initSideTabs();
renderCommonTestCountdown();
renderMilestones();
initStarredMockCountdown();
renderMockExam();
renderTodayLibrary();
renderLibraryCalendars();
renderCoopHours();
renderQuickLinks();
renderOfficialLinks();
renderCards("notices", content.notices, "現在お知らせはありません。");
renderCards("resources", content.resources);
renderCards("contacts", content.contacts);
renderSchedule();
