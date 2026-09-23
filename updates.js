// 更新履歴ページ（updates.html）とトップの「更新履歴」欄の共通描画
(() => {
  const NEW_DAYS = 7;

  function parseLocalDate(value) {
    const [y, m, d] = String(value).split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function isNew(entry) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((today - parseLocalDate(entry.date)) / 86400000);
    return diff >= 0 && diff < NEW_DAYS;
  }

  function buildItem(entry, { withBody }) {
    const item = document.createElement("li");
    item.className = "changelog-item";

    const d = parseLocalDate(entry.date);
    const time = document.createElement("time");
    time.dateTime = entry.date;
    time.textContent = `${d.getMonth() + 1}/${d.getDate()}`;

    const body = document.createElement("div");
    body.className = "changelog-item__body";

    const title = document.createElement(entry.url ? "a" : "strong");
    title.className = "changelog-item__title";
    title.textContent = entry.title || "";
    if (entry.url) title.href = entry.url;
    body.append(title);

    if (isNew(entry)) {
      const badge = document.createElement("span");
      badge.className = "changelog-new";
      badge.textContent = "NEW";
      title.append(badge);
    }

    if (withBody && entry.body) {
      const text = document.createElement("p");
      text.textContent = entry.body;
      body.append(text);
    }

    item.append(time, body);
    return item;
  }

  function sorted() {
    return (window.siteChangelog || [])
      .map((entry, index) => ({ ...entry, index }))
      .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date) || a.index - b.index);
  }

  window.renderChangelogPreview = (rootId, count = 3) => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const entries = sorted().slice(0, count);
    root.innerHTML = "";
    const list = document.createElement("ol");
    list.className = "changelog-list";
    entries.forEach((entry) => list.append(buildItem(entry, { withBody: false })));
    root.append(list);
  };

  if (document.getElementById("changelogPreview")) {
    window.renderChangelogPreview("changelogPreview", 3);
  }

  const full = document.getElementById("changelogFull");
  if (full) {
    const groups = [];
    sorted().forEach((entry) => {
      const d = parseLocalDate(entry.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        group = { key, label: `${d.getFullYear()}年${d.getMonth() + 1}月`, entries: [] };
        groups.push(group);
      }
      group.entries.push(entry);
    });

    groups.forEach((group) => {
      const heading = document.createElement("h2");
      heading.className = "changelog-month";
      heading.textContent = group.label;
      const list = document.createElement("ol");
      list.className = "changelog-list";
      group.entries.forEach((entry) => list.append(buildItem(entry, { withBody: true })));
      full.append(heading, list);
    });
  }
})();
