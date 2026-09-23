// サークルの勉強会・イベント（古い順でも新しい順でもOK。表示時に日付で並べ替えます）
// 新しいイベントは { ... } を1つコピーして追加してください。
// id: 重複しない英数字 / date: "YYYY-MM-DD" / start・end: "HH:MM"（省略すると終日）
// campus: "KIC" | "BKC" | "OIC" | "オンライン" など / place: 部屋名 / mapUrl: 地図のURL（省略可）
// body: 説明 / join: 参加方法（省略可）
// 参加表明（「行く」ボタン）の送信先。代表の Google フォーム「勉強会 参加表明（サイト用・代表のみ閲覧）」。
// 回答は代表の Google スプレッドシートにだけ保存され、サイト上には人数も名前も出ません。
// 空にすると「行く」ボタンが消えます。イベントごとに止めたいときは、そのイベントに rsvp: false を付けます。
window.circleEventsRsvp = {
  formAction: "https://docs.google.com/forms/d/e/1FAIpQLSdZzuIQifASvgS14A5Sc8OwGFHwY4mKNyQgg9ikb_k7c-7CZg/formResponse",
  fields: {
    eventId: "entry.733817673",
    eventTitle: "entry.616275667",
    name: "entry.759776115",
    action: "entry.418157998",
    deviceId: "entry.798702741",
  },
};

window.circleEvents = [
  {
    id: "2026-09-22-bkc-allday",
    tag: "勉強会",
    title: "BKC 終日勉強会",
    date: "2026-09-22",
    start: "09:00",
    end: "21:00",
    campus: "BKC",
    place: "アクロスウィング1階 Academic Seminar Room",
    mapUrl: "https://www.ritsumei.ac.jp/campusmap/bkc/",
    body: "後期が始まる前に、大きな部屋を貸し切って終日勉強会。全員で共通テスト演習をした後、通常の勉強会をしました。",
    join: "リアクションか代表宛のDMで参加表明。途中参加・途中退出OK。",
  },
];
