# 立命館仮面浪人サークル

## 更新方法

基本的には `content.js` だけ編集します。

- ページ上部の文章: `siteName`, `pageTitle`, `lead`, `updatedAt`
- 共通テストカウントダウン: `commonTest`
- 重要なお知らせ: `importantNotice`
- 次回模試日程の表示設定: `mockExam`
- 図書館カレンダー: `libraries`
- 学食・生協営業時間: `coop`
- 公式リンク: `officialLinks`
- ボタンリンク: `quickLinks`
- お知らせ: `notices`
- 予定: `schedule`
- 教材・資料: `resources`
- 連絡先: `contacts`

## 共通テストカウントダウン

サークル名の下に出るカウントダウンは `content.js` の `commonTest.targetAt` を変更します。

```js
commonTest: {
  title: "共通テスト開始まで",
  targetAt: "2027-01-16T09:30:00+09:00",
  targetLabel: "",
},
```

令和9年度の本試験日は大学入試センター公式ページに従っています。時間割が正式公表されたら `targetAt` と `targetLabel` を必要に応じて更新してください。

## 今日の図書館

ページ上部に、今日の図書館開館時間だけをキャンパス別に表示します。KIC/BKC/OICの選択はブラウザに保存されるので、次回も同じキャンパスで開きます。

## 次回模試日程

模試一覧は `exam-schedule.js` に入っています。ページでは、実施日が「今日から2か月以内」に入った未実施の模試だけを自動表示します。

会場は表示していません。PDFに従って、日程・予備校・模試名・区分・受験料だけを出します。

表示期間を変える場合は、`content.js` の `mockExam.windowMonths` を変更します。

```js
mockExam: {
  title: "次回模試日程",
  lead: "模擬試験PDFの一覧から、今日から2か月以内に入った未実施の模試だけを自動表示します。",
  windowMonths: 2,
  sourceLabel: "模擬試験.pdf",
  previewDate: "",
},
```

表示確認用に日付を固定したい場合だけ、`previewDate` に `"2026-08-01"` のように入れます。通常は空欄で大丈夫です。

## 図書館開館時間

立命館大学図書館の公式ページに従って、全7館の開館時間を表示しています。

- 平井嘉一郎記念図書館
- 修学館リサーチライブラリー
- 人文系文献資料室
- 朱雀リサーチライブラリー
- メディアセンター
- メディアライブラリー
- OICライブラリー

サイト上では「今月」「来月」を切り替えられるので、一か月先まで確認できます。

公式カレンダーは外部サイトからの iframe 埋め込みを拒否するため、`library-hours.js` に取得済みデータを保存してページ内で表示しています。

## 学食・生協営業時間

立命館生協の公式ページに従って、`coop-hours.js` に2026年7月・8月分の営業時間を保存しています。

ページ上では、今日の営業時間だけ表示します。表示日数を変える場合は、`content.js` の `coop.displayDays` を変更します。

各店舗の「詳しく見る」から、立命館生協の公式営業時間ページ内の該当キャンパスへ移動できます。

## 公式リンク

ページ最下部に、`content.js` の `officialLinks` を表示します。いったん `CAMPUS WEB` と `Moodle` のみ入れています。

## 空き教室一覧

`rooms.html` に空き教室ページがあります。オンラインシラバスや時間割から取得した教室データをCSVで貼り付けると、キャンパス・曜日・時限ごとの空き教室を表示します。

CSVは次の形で読み込めます。

```csv
type,campus,building,room,day,period,course
room,KIC,存心館,ZS101,,,
room,KIC,存心館,ZS102,,,
class,KIC,存心館,ZS101,月,1,英語
class,KIC,存心館,ZS102,月,2,法学入門
```

教室マスタ行は `type=room`、授業行は `type=class` です。全教室マスタがない場合は、授業データに出てきた教室だけを候補として判定します。

## よくある質問

`faq.html` にFAQページがあります。トップページの一番下から移動できます。

## 項目の追加例

お知らせや予定を増やすときは、同じ形の `{ ... }` をコピーして追加してください。

```js
{
  tag: "6/1",
  title: "新しいお知らせのタイトル",
  body: "本文をここに書きます。",
  expiresAt: "2026-06-01",
}
```

`expiresAt` を空欄にすると自動では消えません。日付を入れると、その日を過ぎたお知らせは表示されません。

リンク先が決まったら `url: "#"` を実際のURLに置き換えます。

```js
{ label: "共有ドライブ", url: "https://example.com" }
```

## ファイル構成

- `index.html`: ページの骨組み
- `faq.html`: よくある質問ページ
- `rooms.html`: 空き教室一覧ページ
- `styles.css`: 見た目
- `content.js`: 更新する内容
- `classroom-data.js`: 空き教室一覧の初期データ
- `exam-schedule.js`: PDFから作った模試一覧
- `library-hours.js`: 立命館大学図書館公式カレンダーから取得した開館時間
- `coop-hours.js`: 立命館生協公式ページから取得した営業時間
- `script.js`: `content.js` の内容をHTMLに表示する処理
- `rooms.js`: 空き教室一覧の表示・CSV読み込み処理
- `site.webmanifest`: スマホのホーム画面追加用設定
- `service-worker.js`: ホーム画面追加と簡易キャッシュ用
- `assets/ritsumeikan-kamen-logo.png`: サークルロゴ

## 注意

このページはログインなしの静的HTMLです。URLを知っている人は閲覧できます。
