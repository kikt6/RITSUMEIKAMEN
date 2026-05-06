# 立命館仮面浪人サークル

## 更新方法

基本的には `content.js` だけ編集します。

- ページ上部の文章: `siteName`, `pageTitle`, `lead`, `updatedAt`
- 共通テストカウントダウン: `commonTest`
- 重要なお知らせ: `importantNotice`
- 次回模試日程の表示設定: `mockExam`
- 図書館カレンダー: `libraries`
- 学食・生協営業時間: `coop`
- ボタンリンク: `quickLinks`
- お知らせ: `notices`
- 予定: `schedule`
- 教材・資料: `resources`
- 連絡先: `contacts`

## 共通テストカウントダウン

ページ最上部のカウントダウンは `content.js` の `commonTest.targetAt` を変更します。

```js
commonTest: {
  title: "共通テスト1日目開始まで",
  targetAt: "2027-01-16T09:30:00+09:00",
  targetLabel: "2027年1月16日（土）9:30開始想定",
  sourceUrl: "https://www.dnc.ac.jp/kyotsu/shiken_jouhou/r9/",
},
```

令和9年度の本試験日は大学入試センター公式ページに従っています。時間割が正式公表されたら `targetAt` と `targetLabel` を必要に応じて更新してください。

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

立命館生協の公式ページに従って、`coop-hours.js` に2026年5月・6月分の営業時間を保存しています。

ページ上では、今日の営業時間だけ表示します。表示日数を変える場合は、`content.js` の `coop.displayDays` を変更します。

各店舗の「詳しく見る」から、立命館生協の公式営業時間ページ内の該当キャンパスへ移動できます。

## 会員ログイン

`firebase-config.js` にFirebaseの設定値を入れると、ログイン画面と会員登録画面が有効になります。設定値が空の間は、今まで通りページを表示します。

Firebase側で先にやること:

- Firebase Authenticationで「メール/パスワード」を有効にする
- Firestore Databaseを作成する
- GitHub PagesのURLをAuthenticationの承認済みドメインに追加する
- Appleでサインインを使う場合は、Apple Developer側の設定後にFirebase AuthenticationでAppleを有効にする

Firestoreのルール例:

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /members/{userId} {
      allow create, read, update: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

登録画面を使えるようにするかは、`firebase-config.js` の `enableRegistration` で切り替えます。

```js
window.authSettings = {
  requireLogin: true,
  enableRegistration: true,
  enableAppleSignIn: false,
  memberProfileCollection: "members",
  registrationCode: "",
};
```

`registrationCode` に文字を入れると、登録画面に登録コード欄が出ます。ただしこれは簡易的な制限なので、本気で会員だけにする場合はFirebase側で会員を管理してください。

## 項目の追加例

お知らせや予定を増やすときは、同じ形の `{ ... }` をコピーして追加してください。

```js
{
  tag: "6/1",
  title: "新しいお知らせのタイトル",
  body: "本文をここに書きます。",
}
```

リンク先が決まったら `url: "#"` を実際のURLに置き換えます。

```js
{ label: "共有ドライブ", url: "https://example.com" }
```

## ファイル構成

- `index.html`: ページの骨組み
- `styles.css`: 見た目
- `content.js`: 更新する内容
- `exam-schedule.js`: PDFから作った模試一覧
- `library-hours.js`: 立命館大学図書館公式カレンダーから取得した開館時間
- `coop-hours.js`: 立命館生協公式ページから取得した営業時間
- `script.js`: `content.js` の内容をHTMLに表示する処理
- `firebase-config.js`: Firebaseの設定
- `auth.js`: ログイン・会員登録処理
- `assets/ritsumeikan-kamen-logo.png`: サークルロゴ

## 注意

Firebase設定値を入れるまではログイン機能は有効になりません。パスワードを自分でFirestoreへ保存しないでください。パスワード管理はFirebase Authenticationに任せます。
