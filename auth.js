(function () {
  const firebaseConfig = window.firebaseConfig || {};
  const settings = {
    requireLogin: true,
    enableRegistration: true,
    enableAppleSignIn: false,
    memberProfileCollection: "members",
    registrationCode: "",
    ...(window.authSettings || {}),
  };

  const byId = (id) => document.getElementById(id);
  const page = document.querySelector(".page");
  const authGate = byId("authGate");
  const authMessage = byId("authMessage");
  const loginTab = byId("loginTab");
  const registerTab = byId("registerTab");
  const loginForm = byId("loginForm");
  const registerForm = byId("registerForm");
  const appleButton = byId("appleSignInButton");
  const passwordResetButton = byId("passwordResetButton");
  const logoutButton = byId("logoutButton");
  const authStatus = byId("authStatus");
  const authUserLabel = byId("authUserLabel");
  const registrationCodeWrap = byId("registrationCodeWrap");

  let auth = null;
  let db = null;

  function hasFirebaseConfig() {
    return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
  }

  function setMessage(text, tone = "") {
    if (!authMessage) return;
    authMessage.textContent = text || "";
    authMessage.dataset.tone = tone;
    authMessage.hidden = !text;
  }

  function setBusy(form, busy) {
    if (!form) return;
    form.querySelectorAll("button, input").forEach((element) => {
      element.disabled = busy;
    });
  }

  function setAuthVisible(visible) {
    if (authGate) authGate.hidden = !visible;
    if (page) page.hidden = visible;
  }

  function setRegisterVisible(visible) {
    if (loginForm) loginForm.hidden = visible;
    if (registerForm) registerForm.hidden = !visible;
    if (loginTab) loginTab.classList.toggle("is-active", !visible);
    if (registerTab) registerTab.classList.toggle("is-active", visible);
    setMessage("");
  }

  function formatAuthError(error) {
    const code = error?.code || "";
    if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
      return "ログインIDまたはパスワードが違います。";
    }
    if (code.includes("email-already-in-use")) return "このログインIDはすでに登録されています。";
    if (code.includes("weak-password")) return "パスワードは6文字以上にしてください。";
    if (code.includes("invalid-email")) return "ログインIDの形式を確認してください。";
    if (code.includes("popup-closed-by-user")) return "サインインがキャンセルされました。";
    if (code.includes("operation-not-allowed")) return "Firebase側でこのログイン方法を有効にしてください。";
    return "処理に失敗しました。少し時間を置いてもう一度試してください。";
  }

  function getProfileData(user, extra = {}) {
    return {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || extra.displayName || "",
      providerId: user.providerData?.[0]?.providerId || "password",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      ...extra,
    };
  }

  async function saveMemberProfile(user, extra = {}) {
    if (!db || !settings.memberProfileCollection) return;
    const ref = db.collection(settings.memberProfileCollection).doc(user.uid);
    await ref.set(getProfileData(user, extra), { merge: true });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(loginForm, true);
    setMessage("ログインしています。");

    try {
      const email = byId("loginEmail").value.trim();
      const password = byId("loginPassword").value;
      const credential = await auth.signInWithEmailAndPassword(email, password);
      await saveMemberProfile(credential.user, {
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {});
      setMessage("");
    } catch (error) {
      setMessage(formatAuthError(error), "error");
    } finally {
      setBusy(loginForm, false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setBusy(registerForm, true);
    setMessage("登録しています。");

    try {
      const name = byId("registerName").value.trim();
      const email = byId("registerEmail").value.trim();
      const password = byId("registerPassword").value;
      const passwordConfirm = byId("registerPasswordConfirm").value;
      const code = byId("registrationCode").value.trim();

      if (settings.registrationCode && code !== settings.registrationCode) {
        throw new Error("registration-code-mismatch");
      }

      if (password !== passwordConfirm) {
        throw new Error("password-confirm-mismatch");
      }

      const credential = await auth.createUserWithEmailAndPassword(email, password);
      if (name) await credential.user.updateProfile({ displayName: name });

      await saveMemberProfile(credential.user, {
        displayName: name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {});

      setMessage("");
    } catch (error) {
      if (error.message === "password-confirm-mismatch") {
        setMessage("確認用パスワードが一致していません。", "error");
      } else if (error.message === "registration-code-mismatch") {
        setMessage("登録コードが違います。", "error");
      } else {
        setMessage(formatAuthError(error), "error");
      }
    } finally {
      setBusy(registerForm, false);
    }
  }

  async function handleAppleSignIn() {
    setMessage("Appleでサインインしています。");

    try {
      const provider = new firebase.auth.OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      if (window.matchMedia("(max-width: 700px)").matches) {
        await auth.signInWithRedirect(provider);
      } else {
        await auth.signInWithPopup(provider);
      }
    } catch (error) {
      setMessage(formatAuthError(error), "error");
    }
  }

  async function handlePasswordReset() {
    const email = byId("loginEmail").value.trim();
    if (!email) {
      setMessage("ログインIDを入力してから再設定してください。", "error");
      return;
    }

    try {
      await auth.sendPasswordResetEmail(email);
      setMessage("再設定メールを送信しました。", "success");
    } catch (error) {
      setMessage(formatAuthError(error), "error");
    }
  }

  function bindEvents() {
    if (loginTab) loginTab.addEventListener("click", () => setRegisterVisible(false));
    if (registerTab) registerTab.addEventListener("click", () => setRegisterVisible(true));
    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    if (registerForm) registerForm.addEventListener("submit", handleRegister);
    if (passwordResetButton) passwordResetButton.addEventListener("click", handlePasswordReset);
    if (appleButton) appleButton.addEventListener("click", handleAppleSignIn);
    if (logoutButton) logoutButton.addEventListener("click", () => auth?.signOut());
  }

  function init() {
    if (!hasFirebaseConfig()) {
      setAuthVisible(false);
      return;
    }

    if (!window.firebase) {
      setAuthVisible(true);
      setMessage("Firebaseを読み込めませんでした。", "error");
      return;
    }

    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore ? firebase.firestore() : null;
    auth.getRedirectResult().then((result) => {
      if (result?.user) {
        saveMemberProfile(result.user, {
          lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {});
      }
    }).catch((error) => {
      setMessage(formatAuthError(error), "error");
    });

    if (registrationCodeWrap) registrationCodeWrap.hidden = !settings.registrationCode;
    if (registerTab) registerTab.hidden = !settings.enableRegistration;
    if (appleButton) appleButton.hidden = !settings.enableAppleSignIn;
    bindEvents();

    auth.onAuthStateChanged((user) => {
      if (!settings.requireLogin) {
        setAuthVisible(false);
        return;
      }

      if (user) {
        setAuthVisible(false);
        if (authStatus) authStatus.hidden = false;
        if (authUserLabel) authUserLabel.textContent = user.displayName || user.email || "ログイン中";
        saveMemberProfile(user, {
          lastSeenAt: firebase.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {});
      } else {
        if (authStatus) authStatus.hidden = true;
        if (authUserLabel) authUserLabel.textContent = "";
        setRegisterVisible(false);
        setAuthVisible(true);
      }
    });
  }

  init();
})();
