// Firebase ConsoleでWebアプリを追加したあと、表示されるfirebaseConfigをここに貼り付けます。
// パスワードはこのファイルにもFirestoreにも保存しません。Firebase Authenticationが管理します。
window.firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

window.authSettings = {
  requireLogin: true,
  enableRegistration: true,
  enableAppleSignIn: false,
  memberProfileCollection: "members",
  registrationCode: "",
};
