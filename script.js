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

  const source = document.createElement("span");
  source.className = "source-pill";
  source.textContent = settings.sourceLabel || "模擬試験PDF";

  headerText.append(title, lead);
  header.append(headerText, source);

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

  if (visibleExams.length === 0) {
    renderEmpty(list, "2か月以内に掲載対象の模試はありません。");
  } else {
    visibleExams.forEach((exam) => {
      const row = document.createElement("article");
      row.className = "exam-row";

      const date = document.createElement("time");
      date.dateTime = exam.date;
      date.textContent = exam.displayDate || formatDateLabel(parseLocalDate(exam.date));

      const body = document.createElement("div");
      const name = document.createElement("h3");
      name.textContent = exam.name || "";

      const meta = document.createElement("p");
      meta.textContent = [exam.provider, exam.category, exam.fee].filter(Boolean).join(" / ");

      body.append(name, meta);
      row.append(date, body);
      list.append(row);
    });
  }

  const count = document.createElement("p");
  count.className = "mock-exam__count";
  count.textContent = `${formatDateLabel(today)}から${Number(settings.windowMonths) || 2}か月以内: ${visibleExams.length}件`;

  root.append(header, count, list);
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

  visibleCalendars.forEach((calendar) => {
    const card = document.createElement("article");
    card.className = "library-card";

    const header = document.createElement("div");
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
      const cell = document.createElement("div");
      cell.className = day.closed ? "library-day is-closed" : "library-day";
      if (day.date === todayKey) cell.classList.add("is-today");
      cell.style.setProperty("--day-bg", normalizeCalendarColor(day.bgcolor));

      const date = document.createElement("span");
      date.className = "library-day__date";
      date.textContent = String(parseLocalDate(day.date).getDate());

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
  const campusLabel = getCampusOption(activeLibraryCampus).label;
  setText("todayLibraryLead", `${formatFullDateLabel(today)} / ${campusLabel}`);

  root.innerHTML = "";
  calendars
    .filter((calendar) => campusMatches(calendar.campus, activeLibraryCampus))
    .forEach((calendar) => {
      const day = (calendar.months || [])
        .flatMap((month) => month.days || [])
        .find((item) => item.date === todayKey);

      const card = document.createElement("article");
      card.className = `today-library-card ${day?.closed ? "is-closed" : ""}`;

      const name = document.createElement("h3");
      name.textContent = calendar.name;

      const hours = document.createElement("p");
      hours.textContent = day ? simplifyHours(day.hours) : "未掲載";

      card.append(name, hours);
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

    rows.forEach((row) => {
      const key = toDateKey(days[0]);
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

    root.append(cards);
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
  if (value === "#ff6666") return "#ffe7e3";
  if (value === "#99ffff") return "#e1f5f5";
  if (value === "#ffff00") return "#fff5b8";
  return "#ffffff";
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

    const body = document.createElement("p");
    body.textContent = item.body || "";

    card.append(tag, title, body);

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

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

setText("siteName", content.siteName);
setText("pageTitle", content.pageTitle);
setText("pageLead", content.lead);
setText("updatedAt", formatUpdatedAt(content.updatedAt));
setText("noticeCount", `${getVisibleItems(content.notices).length}件`);
setText("scheduleMonth", content.scheduleMonth);

registerServiceWorker();
initSideTabs();
renderCommonTestCountdown();
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
