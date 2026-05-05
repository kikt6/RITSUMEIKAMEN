const content = window.siteContent || {};
const examSchedule = window.examSchedule || [];
const libraryHours = window.libraryHours || null;
const coopHours = window.coopHours || null;

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

function renderLibraryCalendars(monthOffset = 0) {
  const settings = content.libraries || {};
  const calendars = libraryHours?.libraries || settings.calendars || [];

  setText("libraryTitle", settings.title || "立命館大学 図書館開館時間");
  setText("libraryLead", settings.lead || "");

  const sourceLink = byId("librarySourceLink");
  if (sourceLink) {
    sourceLink.href = settings.sourceUrl || "https://www.ritsumei.ac.jp/lib/a03/010/";
  }

  renderLibraryMonthControls(monthOffset);

  const root = byId("libraryCalendars");
  if (!root) return;
  root.innerHTML = "";

  const month = libraryHours?.months?.[monthOffset] || getMonthQuery(monthOffset);
  calendars.forEach((calendar) => {
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

    const monthData = calendar.months?.[monthOffset];
    const days = monthData?.days || [];
    const firstDay = days[0] ? parseLocalDate(days[0].date).getDay() : 0;

    for (let i = 0; i < firstDay; i += 1) {
      const blank = document.createElement("div");
      blank.className = "library-day library-day--blank";
      grid.append(blank);
    }

    days.forEach((day) => {
      const cell = document.createElement("div");
      cell.className = day.closed ? "library-day is-closed" : "library-day";
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

  renderEmpty(root, "図書館カレンダーはまだありません。");
}

function renderCoopHours() {
  const settings = content.coop || {};
  const root = byId("coopHours");
  if (!root) return;

  setText("coopTitle", settings.title || "学食・生協営業時間");
  setText("coopLead", settings.lead || "");

  const sourceLink = byId("coopSourceLink");
  if (sourceLink) {
    sourceLink.href = settings.sourceUrl || coopHours?.sourceUrl || "https://www.ritsco-op.jp/schedule/schedule_202605.html";
  }

  const today = getToday(settings.previewDate);
  const dayCount = Number(settings.displayDays) || 14;
  const days = Array.from({ length: dayCount }, (_, index) => addDays(today, index));
  const rows = collectCoopRows(days);

  setText("coopRange", `${formatFullDateLabel(days[0])}から${dayCount}日間 / ${rows.length}店舗`);

  root.innerHTML = "";
  if (!coopHours || rows.length === 0) {
    renderEmpty(root, "営業時間データを表示できませんでした。");
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
    meta.textContent = [row.campus, row.building].filter(Boolean).join(" / ");
    const detail = document.createElement("a");
    detail.className = "detail-link";
    detail.href = row.detailUrl || coopHours?.sourceUrl || "#";
    detail.target = "_blank";
    detail.rel = "noopener noreferrer";
    detail.textContent = "詳しく見る";
    shopCell.append(shopName, meta, detail);
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
    button.addEventListener("click", () => renderLibraryCalendars(offset));
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

function renderCards(id, items, emptyMessage = "表示する項目はまだありません。") {
  const root = byId(id);
  if (!root) return;
  root.innerHTML = "";

  (items || []).forEach((item) => {
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

setText("siteName", content.siteName);
setText("pageTitle", content.pageTitle);
setText("pageLead", content.lead);
setText("updatedAt", formatUpdatedAt(content.updatedAt));
setText("noticeCount", `${(content.notices || []).length}件`);
setText("scheduleMonth", content.scheduleMonth);

const primaryLink = byId("primaryLink");
if (primaryLink && content.primaryLink) {
  setLink(primaryLink, content.primaryLink);
}

renderMockExam();
renderLibraryCalendars();
renderCoopHours();
renderQuickLinks();
renderCards("notices", content.notices, "現在お知らせはありません。");
renderCards("resources", content.resources);
renderCards("contacts", content.contacts);
renderSchedule();
