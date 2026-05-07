// このファイルを編集すると、ページの表示内容を更新できます。
// 文章は "..." の中を書き換え、項目を増やす時は { ... } をコピーして追加してください。
window.siteContent = {
  siteName: "立命館仮面浪人サークル",
  pageTitle: "立命館仮面浪人サークル",
  lead: "",
  updatedAt: "2026-05-07",
  commonTest: {
    title: "共通テスト開始まで",
    targetAt: "2027-01-16T09:30:00+09:00",
    targetLabel: "",
  },
  mockExam: {
    title: "次回模試日程",
    lead: "模擬試験PDFの一覧から、今日から2か月以内に入った未実施の模試だけを自動表示します。",
    windowMonths: 2,
    sourceLabel: "模擬試験.pdf",
    previewDate: "",
  },
  libraries: {
    title: "立命館大学 図書館開館時間",
    lead: "立命館大学図書館の公式カレンダーに従って、KIC・BKC・OICごとに開館時間を確認できます。",
    sourceUrl: "https://www.ritsumei.ac.jp/lib/a03/010/",
    calendars: [
      { name: "平井嘉一郎記念図書館", campus: "衣笠", countercd: "101001" },
      { name: "修学館リサーチライブラリー", campus: "衣笠", countercd: "101002" },
      { name: "人文系文献資料室", campus: "衣笠", countercd: "101004" },
      { name: "朱雀リサーチライブラリー", campus: "朱雀", countercd: "101201" },
      { name: "メディアセンター", campus: "BKC", countercd: "101302" },
      { name: "メディアライブラリー", campus: "BKC", countercd: "101301" },
      { name: "OICライブラリー", campus: "OIC", countercd: "101601" },
    ],
  },
  coop: {
    title: "今日の学食・生協営業時間",
    lead: "立命館生協の公式営業時間ページに従って、今日の営業時間をKIC・BKC・OICごとに表示します。他の日程は公式ページで確認してください。",
    sourceUrl: "https://www.ritsco-op.jp/schedule/schedule_202605.html",
    displayDays: 1,
    previewDate: "",
  },
  quickLinks: [
    { label: "共有ドライブ", url: "#" },
    { label: "模試記録シート", url: "#" },
    { label: "年間カレンダー", url: "#" },
  ],
  officialLinks: [
    { label: "CAMPUS WEB", url: "https://www.ritsumei.ac.jp/rsp/" },
    { label: "Moodle", url: "https://www.ritsumei.ac.jp/pathways-future/course/moodle.html" },
  ],
  notices: [
    {
      tag: "お知らせ",
      title: "もう少しでリリースやで",
      body: "",
      expiresAt: "",
    },
  ],
  scheduleMonth: "2026年5月",
  schedule: [
    {
      date: "2026-05-10",
      displayDate: "5/10 Sun",
      title: "共通テスト演習会",
      body: "午前は英語、午後は数学。終了後に30分だけ振り返りをします。",
      place: "オンライン",
    },
    {
      date: "2026-05-14",
      displayDate: "5/14 Thu",
      title: "月例ミーティング",
      body: "志望校別の計画調整と、前月の反省を共有します。",
      place: "衣笠周辺",
    },
    {
      date: "2026-05-24",
      displayDate: "5/24 Sun",
      title: "過去問レビュー",
      body: "各自1年分を持参。解けなかった問題を中心に相談します。",
      place: "未定",
    },
  ],
  resources: [
    {
      tag: "EN",
      title: "英語 長文ルート",
      body: "基礎解釈から過去問までの週次メニュー。",
      url: "#",
    },
    {
      tag: "MA",
      title: "数学 復習リスト",
      body: "解法暗記に寄せすぎないためのチェック表。",
      url: "#",
    },
    {
      tag: "JP",
      title: "国語 記述メモ",
      body: "設問タイプ別に見直すための共有ノート。",
      url: "#",
    },
  ],
  contacts: [
    {
      tag: "連絡",
      title: "代表への連絡",
      body: "急ぎの連絡はこちらから送ってください。",
      url: "#",
    },
    {
      tag: "記録",
      title: "模試・学習記録",
      body: "各自の記録用シートです。共有範囲に注意してください。",
      url: "#",
    },
  ],
};
