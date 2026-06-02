const classroomData = window.classroomAvailabilityData || {};

const roomCampuses = [
  { label: "KIC", value: "KIC", names: ["KIC", "衣笠", "kinugasa"] },
  { label: "BKC", value: "BKC", names: ["BKC", "びわこ", "biwako"] },
  { label: "OIC", value: "OIC", names: ["OIC", "大阪いばらき", "osaka"] },
];
const roomDays = ["月", "火", "水", "木", "金", "土"];
const roomPeriods = ["1", "2", "3", "4", "5", "6", "7"];
const roomStorageKey = "ritsumeikamen-classroom-availability-v1";

let roomState = loadRoomState();

const roomById = (id) => document.getElementById(id);

function loadRoomState() {
  const saved = loadSavedRoomData();
  const source = saved || classroomData;
  return {
    source: saved ? "local" : "default",
    updatedAt: source.updatedAt || classroomData.updatedAt || "",
    note: source.note || classroomData.note || "",
    rooms: normalizeRooms(source.rooms || []),
    classes: normalizeClasses(source.classes || []),
    campus: getSavedValue("ritsumeikamen-room-campus", "KIC", roomCampuses.map((item) => item.value)),
    day: getSavedValue("ritsumeikamen-room-day", getTodayDay(), roomDays),
    period: getSavedValue("ritsumeikamen-room-period", getCurrentPeriod(), roomPeriods),
  };
}

function loadSavedRoomData() {
  try {
    const raw = window.localStorage?.getItem(roomStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveRoomData(nextData) {
  try {
    window.localStorage?.setItem(roomStorageKey, JSON.stringify(nextData));
  } catch {
    // localStorage may be unavailable in some private browsing modes.
  }
}

function getSavedValue(key, fallback, allowed) {
  try {
    const value = window.localStorage?.getItem(key);
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function saveRoomSetting(key, value) {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // localStorage may be unavailable in some private browsing modes.
  }
}

function getTodayDay() {
  const index = new Date().getDay();
  return roomDays[index === 0 ? 0 : Math.min(index - 1, roomDays.length - 1)];
}

function getCurrentPeriod() {
  const hour = new Date().getHours();
  if (hour < 10) return "1";
  if (hour < 12) return "2";
  if (hour < 14) return "3";
  if (hour < 16) return "4";
  if (hour < 18) return "5";
  if (hour < 20) return "6";
  return "7";
}

function normalizeRooms(items) {
  const map = new Map();
  items.forEach((item) => {
    const campus = normalizeCampus(item.campus);
    const room = normalizeText(item.room || item.name || item.classroom);
    if (!campus || !room) return;
    const building = normalizeText(item.building || item.place || "");
    const key = roomKey(campus, building, room);
    map.set(key, { campus, building, room });
  });
  return Array.from(map.values()).sort(sortRooms);
}

function normalizeClasses(items) {
  return items
    .map((item) => {
      const campus = normalizeCampus(item.campus);
      const room = normalizeText(item.room || item.name || item.classroom);
      const day = normalizeDay(item.day || item.weekday);
      const period = normalizePeriod(item.period || item.time || item.slot);
      if (!campus || !room || !day || !period) return null;
      return {
        campus,
        building: normalizeText(item.building || item.place || ""),
        room,
        day,
        period,
        course: normalizeText(item.course || item.title || item.subject || ""),
      };
    })
    .filter(Boolean)
    .sort(sortClasses);
}

function normalizeCampus(value) {
  const text = normalizeText(value).toLowerCase();
  if (!text) return "";
  const campus = roomCampuses.find((item) => item.names.some((name) => text.includes(name.toLowerCase())));
  return campus?.value || "";
}

function normalizeDay(value) {
  const text = normalizeText(value).toLowerCase();
  if (!text) return "";
  const aliases = {
    月: ["月", "月曜", "monday", "mon", "1"],
    火: ["火", "火曜", "tuesday", "tue", "2"],
    水: ["水", "水曜", "wednesday", "wed", "3"],
    木: ["木", "木曜", "thursday", "thu", "4"],
    金: ["金", "金曜", "friday", "fri", "5"],
    土: ["土", "土曜", "saturday", "sat", "6"],
  };
  return roomDays.find((day) => aliases[day].some((alias) => text.includes(alias))) || "";
}

function normalizePeriod(value) {
  const match = normalizeText(value).match(/[1-7]/);
  return match ? match[0] : "";
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function roomKey(campus, building, room) {
  return [campus, building, room].join("|");
}

function sortRooms(a, b) {
  return (
    a.campus.localeCompare(b.campus, "ja") ||
    a.building.localeCompare(b.building, "ja", { numeric: true }) ||
    a.room.localeCompare(b.room, "ja", { numeric: true })
  );
}

function sortClasses(a, b) {
  return (
    a.campus.localeCompare(b.campus, "ja") ||
    a.day.localeCompare(b.day, "ja") ||
    Number(a.period) - Number(b.period) ||
    a.room.localeCompare(b.room, "ja", { numeric: true })
  );
}

function renderRoomPage() {
  renderControls();
  renderDataStatus();
  renderRooms();
}

function renderControls() {
  renderButtonGroup("roomCampusControls", roomCampuses, roomState.campus, (value) => {
    roomState.campus = value;
    saveRoomSetting("ritsumeikamen-room-campus", value);
    renderRoomPage();
  });
  renderButtonGroup(
    "roomDayControls",
    roomDays.map((day) => ({ label: day, value: day })),
    roomState.day,
    (value) => {
      roomState.day = value;
      saveRoomSetting("ritsumeikamen-room-day", value);
      renderRoomPage();
    },
  );
  renderButtonGroup(
    "roomPeriodControls",
    roomPeriods.map((period) => ({ label: `${period}限`, value: period })),
    roomState.period,
    (value) => {
      roomState.period = value;
      saveRoomSetting("ritsumeikamen-room-period", value);
      renderRoomPage();
    },
  );
}

function renderButtonGroup(rootId, items, activeValue, onSelect) {
  const root = roomById(rootId);
  if (!root) return;
  root.innerHTML = "";
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.label;
    button.className = item.value === activeValue ? "is-active" : "";
    button.addEventListener("click", () => onSelect(item.value));
    root.append(button);
  });
}

function renderDataStatus() {
  const roomCount = collectAllRooms().length;
  const classCount = roomState.classes.length;
  const status = roomState.source === "local" ? "保存データ使用中" : "初期データ";
  setRoomText("roomUpdatedAt", `${status} / 教室${roomCount}件 / 授業${classCount}件`);
  setRoomText("roomDataNote", roomState.note || "CSVを読み込むと空き教室を判定できます。");
}

function renderRooms() {
  const campus = roomState.campus;
  const day = roomState.day;
  const period = roomState.period;
  const rooms = collectAllRooms().filter((room) => room.campus === campus);
  const occupied = roomState.classes.filter((item) => item.campus === campus && item.day === day && item.period === period);
  const occupiedKeys = new Set(occupied.map((item) => roomKey(item.campus, item.building, item.room)));
  const available = rooms.filter((room) => !occupiedKeys.has(roomKey(room.campus, room.building, room.room)));

  setRoomText("roomResultTitle", `${campus} ${formatWeekdayLabel(day)} ${period}限の空き教室`);
  setRoomText("roomResultLead", "教室マスタに登録された教室から、同じ曜日・時限で授業登録がある教室を除いて表示しています。");
  setRoomText("roomResultCount", `${available.length}教室`);
  setRoomText("occupiedRoomCount", `${occupied.length}教室`);

  renderSummary(rooms, occupied, available);
  renderAvailableRooms(available, rooms.length);
  renderOccupiedRooms(occupied);
}

function formatWeekdayLabel(day) {
  return `${day}曜`;
}

function collectAllRooms() {
  const map = new Map();
  roomState.rooms.forEach((room) => map.set(roomKey(room.campus, room.building, room.room), room));
  roomState.classes.forEach((item) => {
    const key = roomKey(item.campus, item.building, item.room);
    if (!map.has(key)) map.set(key, { campus: item.campus, building: item.building, room: item.room });
  });
  return Array.from(map.values()).sort(sortRooms);
}

function renderSummary(rooms, occupied, available) {
  const root = roomById("roomSummary");
  if (!root) return;
  root.innerHTML = "";
  [
    { label: "登録教室", value: `${rooms.length}室` },
    { label: "使用中", value: `${occupied.length}室` },
    { label: "空き", value: `${available.length}室` },
  ].forEach((item) => {
    const card = document.createElement("article");
    card.className = "room-summary-card";
    const label = document.createElement("span");
    label.textContent = item.label;
    const value = document.createElement("strong");
    value.textContent = item.value;
    card.append(label, value);
    root.append(card);
  });
}

function renderAvailableRooms(available, totalRooms) {
  const root = roomById("availableRooms");
  if (!root) return;
  root.innerHTML = "";
  if (totalRooms === 0) {
    renderRoomEmpty(root, "まだ教室データがありません。下のCSV欄にログイン後のデータを貼り付けてください。");
    return;
  }
  if (available.length === 0) {
    renderRoomEmpty(root, "この条件で空き教室は登録されていません。");
    return;
  }

  groupByBuilding(available).forEach((group) => {
    const card = document.createElement("article");
    card.className = "room-building-card";
    const title = document.createElement("h3");
    title.textContent = group.building || "建物未設定";
    const list = document.createElement("div");
    list.className = "room-chip-list";
    group.rooms.forEach((room) => {
      const chip = document.createElement("span");
      chip.textContent = room.room;
      list.append(chip);
    });
    card.append(title, list);
    root.append(card);
  });
}

function renderOccupiedRooms(occupied) {
  const root = roomById("occupiedRooms");
  if (!root) return;
  root.innerHTML = "";
  if (occupied.length === 0) {
    renderRoomEmpty(root, "この条件で使用中の教室はありません。");
    return;
  }
  occupied.forEach((item) => {
    const row = document.createElement("article");
    row.className = "occupied-room-row";
    const room = document.createElement("strong");
    room.textContent = [item.building, item.room].filter(Boolean).join(" ");
    const course = document.createElement("span");
    course.textContent = item.course || "授業名未設定";
    row.append(room, course);
    root.append(row);
  });
}

function groupByBuilding(rooms) {
  const groups = new Map();
  rooms.forEach((room) => {
    const key = room.building || "";
    if (!groups.has(key)) groups.set(key, { building: key, rooms: [] });
    groups.get(key).rooms.push(room);
  });
  return Array.from(groups.values()).sort((a, b) => a.building.localeCompare(b.building, "ja"));
}

function renderRoomEmpty(root, text) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = text;
  root.append(empty);
}

function setRoomText(id, value) {
  const element = roomById(id);
  if (!element) return;
  element.textContent = value || "";
  element.hidden = !value;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((item) => item.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((item) => item.trim())) rows.push(row);
  return rows;
}

function parseRoomCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { rooms: [], classes: [] };
  const headers = rows[0].map((item) => item.trim());
  const records = rows.slice(1).map((row) => toRecord(headers, row));
  const rooms = [];
  const classes = [];

  records.forEach((record) => {
    const type = readField(record, ["type", "種別", "区分"]).toLowerCase();
    const entry = {
      campus: readField(record, ["campus", "キャンパス"]),
      building: readField(record, ["building", "建物", "校舎", "施設"]),
      room: readField(record, ["room", "classroom", "教室", "教室名"]),
      day: readField(record, ["day", "weekday", "曜日"]),
      period: readField(record, ["period", "time", "slot", "時限", "講時"]),
      course: readField(record, ["course", "subject", "title", "科目", "授業名"]),
    };

    if (type.includes("room") || type.includes("教室") || (!entry.day && !entry.period)) {
      rooms.push(entry);
      return;
    }
    classes.push(entry);
  });

  return {
    rooms: normalizeRooms(rooms),
    classes: normalizeClasses(classes),
  };
}

function toRecord(headers, row) {
  return headers.reduce((record, header, index) => {
    record[header] = row[index] || "";
    return record;
  }, {});
}

function readField(record, names) {
  const match = names.find((name) => Object.prototype.hasOwnProperty.call(record, name));
  return match ? record[match] : "";
}

function initRoomImport() {
  const input = roomById("roomCsvInput");
  const apply = roomById("roomCsvApply");
  const reset = roomById("roomCsvReset");
  if (!input || !apply || !reset) return;

  apply.addEventListener("click", () => {
    const parsed = parseRoomCsv(input.value);
    const nextData = {
      updatedAt: new Date().toISOString().slice(0, 10),
      note: "この端末に保存したCSVデータで表示しています。",
      rooms: parsed.rooms,
      classes: parsed.classes,
    };
    saveRoomData(nextData);
    roomState = loadRoomState();
    input.value = "";
    renderRoomPage();
  });

  reset.addEventListener("click", () => {
    try {
      window.localStorage?.removeItem(roomStorageKey);
    } catch {
      // localStorage may be unavailable in some private browsing modes.
    }
    roomState = loadRoomState();
    renderRoomPage();
  });
}

initRoomImport();
renderRoomPage();
