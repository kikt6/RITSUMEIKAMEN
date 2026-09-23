// このファイルを編集すると、ページの表示内容を更新できます。
// 文章は "..." の中を書き換え、項目を増やす時は { ... } をコピーして追加してください。
window.siteContent = {
  siteName: "立命館仮面浪人サークル",
  pageTitle: "立命館仮面浪人サークル",
  lead: "",
  updatedAt: "2026-09-23",
  commonTest: {
    title: "共通テスト開始まで",
    targetAt: "2027-01-16T09:30:00+09:00",
    targetLabel: "",
    // カウントダウンの下に小さく出す日程（label: 表示名 / date: "YYYY-MM-DD"）
    milestones: [{ label: "国公立二次（前期）", date: "2027-02-25" }],
  },
  mockExam: {
    title: "次回模試日程",
    lead: "これから2か月以内の模試です。受ける模試は「模試をすべて見る」で★を付けると、カウントダウンとカレンダー追加ができます。",
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
    sourceUrl: "https://www.ritsco-op.jp/schedule/schedule_202609.html",
    displayDays: 1,
    previewDate: "",
  },
  pushNotifications: {
    // OneSignal の App ID を貼ると「更新通知を受け取る」欄が表示されます。空のままなら非表示。
    oneSignalAppId: "15a6bacb-69f5-42ce-a574-a4059c289cf7",
    safariWebId: "web.onesignal.auto.2c5a7aa8-83b4-45ba-8e8f-e5cd6a2881a0",
    title: "更新通知を受け取る",
    lead: "お知らせが追加されたときにスマホ・PCへ通知します。iPhone は Safari の共有メニューから「ホーム画面に追加」したアプリで開いてから登録してください。",
    buttonLabel: "通知をオンにする",
  },
  quickLinks: [
    { label: "共有ドライブ", url: "#" },
    { label: "模試記録シート", url: "#" },
    { label: "年間カレンダー", url: "#" },
  ],
  officialLinks: [
    { label: "CAMPUS WEB", url: "https://cw.ritsumei.ac.jp/campusweb/sv/main" },
    { label: "Moodle", url: "https://www.ritsumei.ac.jp/pathways-future/course/moodle.html" },
  ],
  notices: [
    {
      tag: "勉強会",
      title: "9/22（火）BKCで終日勉強会を開催します",
      body: "後期が始まる前に、BKCで大きな部屋を貸し切って終日勉強会を行います。日時は9月22日（火）9:00〜21:00、場所はBKC アクロスウィング1階 Academic Seminar Room。全員で共通テスト演習をした後、通常の勉強会をします。来たい方は、リアクションか代表宛のDMをお願いします。初めましてでも大丈夫です。途中参加・途中退出可能です。全員で士気上げていきましょう！",
      url: "https://www.ritsumei.ac.jp/campusmap/bkc/",
      expiresAt: "2026-09-22",
    },
    {
      tag: "重要",
      title: "共通テストの出願受付が始まりました",
      body: "2027年1月実施の大学入学共通テストは、9月15日(火)10:00から出願内容の登録と検定料の支払いが始まっています。締切は10月2日(金)で、出願内容登録は17:00、検定料支払いは23:59まで。郵送出願はなく、全員が共通テスト出願サイトからのWeb出願です。大学在学中でも出願できるので、受験案内で出願資格と必要書類を確認して早めに済ませてください。",
      url: "https://www.dnc.ac.jp/kyotsu/web_syutugan.html",
      expiresAt: "2026-10-02",
    },
    {
      tag: "模試",
      title: "駿台 冠模試の申し込み開始",
      body: "駿台の大学別入試実戦模試は、九大・名大・阪大・北大・神戸大・第2回東大・東北大・第2回京大などの申し込みが9月上旬から始まっています。受験予定者は締切を早めに確認してください。",
      url: "https://www2.sundai.ac.jp/yobi/sv/sundai/moshi_P/moshi_grade_PD/1337364908752.html",
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
