// 表示設定: ダークモード / 文字サイズ。<head> で読み込み、描画前に反映する。
(function () {
  var KEY = "ritsumeikamen-display";
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var settings = { theme: "auto", font: "m" };

  try {
    var saved = JSON.parse(window.localStorage.getItem(KEY) || "{}");
    if (["auto", "light", "dark"].indexOf(saved.theme) >= 0) settings.theme = saved.theme;
    if (["s", "m", "l", "xl"].indexOf(saved.font) >= 0) settings.font = saved.font;
  } catch (e) {}

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) {}
  }

  function apply() {
    var dark = settings.theme === "dark" || (settings.theme === "auto" && media && media.matches);
    root.setAttribute("data-theme", dark ? "dark" : "light");
    if (settings.font === "m") root.removeAttribute("data-font");
    else root.setAttribute("data-font", settings.font);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#5e1010" : "#9d1717");
  }

  apply();
  if (media) {
    var onChange = function () { if (settings.theme === "auto") apply(); };
    if (media.addEventListener) media.addEventListener("change", onChange);
    else if (media.addListener) media.addListener(onChange);
  }

  var THEMES = [["auto", "自動"], ["light", "ライト"], ["dark", "ダーク"]];
  var FONTS = [["s", "小"], ["m", "標準"], ["l", "大"], ["xl", "特大"]];

  function segment(name, label, items, extraClass) {
    var html = '<fieldset><legend>' + label + '</legend><div class="display-seg ' + extraClass + '">';
    items.forEach(function (item) {
      html += '<button type="button" data-' + name + '="' + item[0] + '" aria-pressed="false">' + item[1] + "</button>";
    });
    return html + "</div></fieldset>";
  }

  function buildUi() {
    if (document.getElementById("displayFab")) return;
    var fab = document.createElement("button");
    fab.type = "button";
    fab.id = "displayFab";
    fab.className = "display-fab";
    fab.setAttribute("aria-label", "表示設定（ダークモード・文字サイズ）");
    fab.setAttribute("aria-expanded", "false");
    fab.setAttribute("aria-controls", "displayPanel");
    fab.textContent = "Aa";

    var panel = document.createElement("section");
    panel.id = "displayPanel";
    panel.className = "display-panel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "表示設定");
    panel.innerHTML = "<h2>表示設定</h2>" +
      segment("theme", "テーマ（自動＝端末の設定に合わせる）", THEMES, "display-seg--theme") +
      segment("font", "文字の大きさ", FONTS, "display-seg--size");

    function sync() {
      panel.querySelectorAll("[data-theme]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-theme") === settings.theme));
      });
      panel.querySelectorAll("[data-font]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-font") === settings.font));
      });
    }

    function setOpen(open) {
      panel.hidden = !open;
      fab.setAttribute("aria-expanded", String(open));
    }

    fab.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(panel.hidden);
    });
    panel.addEventListener("click", function (e) {
      e.stopPropagation();
      var btn = e.target.closest("button");
      if (!btn) return;
      if (btn.hasAttribute("data-theme")) settings.theme = btn.getAttribute("data-theme");
      if (btn.hasAttribute("data-font")) settings.font = btn.getAttribute("data-font");
      save();
      apply();
      sync();
    });
    document.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { setOpen(false); fab.focus(); }
    });

    sync();
    document.body.appendChild(panel);
    document.body.appendChild(fab);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildUi);
  else buildUi();
})();
