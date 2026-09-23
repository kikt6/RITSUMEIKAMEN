// カレンダー書き出し（.ics / Googleカレンダー）の共通処理
// 予定の形: { uid, title, date: "YYYY-MM-DD", endDate?, start?: "HH:MM", end?: "HH:MM", location?, description?, url?, alarmMinutesBefore? }
// start がなければ終日予定として書き出す。時刻は日本時間。
(() => {
  const pad = (n) => String(n).padStart(2, "0");

  function parseDate(value) {
    const [y, m, d] = String(value).split("-").map(Number);
    return { y, m, d };
  }

  function ymd(value) {
    const { y, m, d } = parseDate(value);
    return `${y}${pad(m)}${pad(d)}`;
  }

  function nextDay(value) {
    const { y, m, d } = parseDate(value);
    const date = new Date(Date.UTC(y, m - 1, d + 1));
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
  }

  // 日本時間 → UTC の "YYYYMMDDTHHMMSSZ"
  function jstToUtc(dateValue, time) {
    const { y, m, d } = parseDate(dateValue);
    const [hh, mm] = String(time).split(":").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, hh - 9, mm || 0));
    return (
      `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
      `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
    );
  }

  function escapeText(text) {
    return String(text || "")
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/([,;])/g, "\\$1");
  }

  // 1行75オクテットで折り返す（UTF-8 の文字を途中で切らない）
  function fold(line) {
    const encoder = new TextEncoder();
    const out = [];
    let current = "";
    let bytes = 0;
    for (const ch of line) {
      const size = encoder.encode(ch).length;
      const limit = out.length === 0 ? 75 : 74;
      if (bytes + size > limit) {
        out.push(current);
        current = "";
        bytes = 0;
      }
      current += ch;
      bytes += size;
    }
    out.push(current);
    return out.join("\r\n ");
  }

  function hashUid(text) {
    let h = 2166136261;
    for (const ch of String(text)) {
      h ^= ch.codePointAt(0);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function stamp() {
    const now = new Date();
    return (
      `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
      `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
    );
  }

  function eventLines(event) {
    const lines = [
      "BEGIN:VEVENT",
      `UID:${hashUid(event.uid || `${event.date}|${event.title}`)}@ritsumeikamen`,
      `DTSTAMP:${stamp()}`,
    ];
    if (event.start) {
      lines.push(`DTSTART:${jstToUtc(event.date, event.start)}`);
      lines.push(`DTEND:${jstToUtc(event.endDate || event.date, event.end || event.start)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${ymd(event.date)}`);
      lines.push(`DTEND;VALUE=DATE:${nextDay(event.endDate || event.date)}`);
    }
    lines.push(`SUMMARY:${escapeText(event.title)}`);
    if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
    const description = [event.description, event.url].filter(Boolean).join("\n");
    if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
    if (event.url) lines.push(`URL:${event.url}`);
    if (event.alarmMinutesBefore) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(event.title)}`,
        `TRIGGER:-PT${Math.round(event.alarmMinutesBefore)}M`,
        "END:VALARM",
      );
    }
    lines.push("END:VEVENT");
    return lines;
  }

  function toIcs(events, calendarName = "立命館仮面浪人サークル") {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//RITSUMEIKAMEN//Calendar Export//JA",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapeText(calendarName)}`,
      "X-WR-TIMEZONE:Asia/Tokyo",
    ];
    events.forEach((event) => lines.push(...eventLines(event)));
    lines.push("END:VCALENDAR");
    return lines.map(fold).join("\r\n") + "\r\n";
  }

  function download(filename, ics) {
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
  }

  function googleUrl(event) {
    const dates = event.start
      ? `${jstToUtc(event.date, event.start)}/${jstToUtc(event.endDate || event.date, event.end || event.start)}`
      : `${ymd(event.date)}/${nextDay(event.endDate || event.date)}`;
    const params = new URLSearchParams({ action: "TEMPLATE", text: event.title || "", dates, ctz: "Asia/Tokyo" });
    const details = [event.description, event.url].filter(Boolean).join("\n");
    if (details) params.set("details", details);
    if (event.location) params.set("location", event.location);
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  window.calendarExport = { toIcs, download, googleUrl };
})();
