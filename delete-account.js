import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgMZNv0rJe7ho36I0_DmjSlgNQm_HN10E",
  authDomain: "heavyar-app.firebaseapp.com",
  projectId: "heavyar-app",
  storageBucket: "heavyar-app.firebasestorage.app",
  messagingSenderId: "894313164992",
  appId: "1:894313164992:web:ec7ecdea9fa4630d96fd25"
};
const deletionEndpoint = "https://heavyar-api.heavyar-official.workers.dev/api/account/deletion-request";
const confirmationPhrase = "DELETE_MY_ACCOUNT";
const auth = getAuth(initializeApp(firebaseConfig));
const signInForm = document.querySelector("#sign-in-form");
const deleteForm = document.querySelector("#delete-form");
const signedInPanel = document.querySelector("#signed-in-panel");
const signedInEmail = document.querySelector("#signed-in-email");
const status = document.querySelector("#status");
const email = document.querySelector("#email");
const password = document.querySelector("#password");
const confirmation = document.querySelector("#confirmation");

function setStatus(message, kind = "info") {
  status.hidden = !message;
  status.className = `account-status ${kind}`;
  status.textContent = message;
}

function genericError() {
  setStatus(
    "تعذر إكمال العملية الآن. تحقق من البيانات وحاول مرة أخرى. / We could not complete this request. Check your details and try again.",
    "error"
  );
}

function setBusy(form, busy) {
  form.querySelectorAll("button").forEach((button) => {
    button.disabled = busy;
  });
}

onAuthStateChanged(auth, (user) => {
  signInForm.hidden = Boolean(user);
  signedInPanel.hidden = !user;
  signedInEmail.textContent = user?.email || "";
  if (!user) {
    confirmation.value = "";
    document.querySelector("#confirm-understood").checked = false;
  }
});

signInForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");
  setBusy(signInForm, true);
  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
    password.value = "";
    setStatus("تم تسجيل الدخول بأمان. راجع تفاصيل الحذف قبل التأكيد. / You are signed in securely. Review the deletion details before confirming.", "success");
  } catch {
    genericError();
  } finally {
    setBusy(signInForm, false);
  }
});

document.querySelector("#reset-password").addEventListener("click", async () => {
  const address = email.value.trim();
  if (!address) {
    setStatus("أدخل بريدك الإلكتروني أولاً. / Enter your email address first.", "error");
    email.focus();
    return;
  }
  setBusy(signInForm, true);
  try {
    await sendPasswordResetEmail(auth, address);
  } catch {
    // Deliberately keep the same message for known and unknown accounts.
  } finally {
    setStatus("إذا كان الحساب مؤهلاً، فستصلك تعليمات إعادة التعيين على البريد المدخل. / If eligible, password-reset instructions will be sent to the address provided.", "success");
    setBusy(signInForm, false);
  }
});

deleteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = auth.currentUser;
  if (!user || confirmation.value.trim() !== confirmationPhrase || !document.querySelector("#confirm-understood").checked) {
    setStatus("أكمل التأكيد واكتب العبارة المطلوبة. / Complete the confirmation and type the required phrase.", "error");
    return;
  }
  setStatus("جارٍ إرسال الطلب بأمان… / Sending your request securely…");
  setBusy(deleteForm, true);
  try {
    const token = await user.getIdToken();
    const response = await fetch(deletionEndpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: confirmationPhrase })
    });
    if (!response.ok) throw new Error("deletion request failed");
    setStatus("تم استلام طلبك وسيبدأ قفل الحساب ومعالجة الحذف. / Your request was accepted; account locking and deletion processing will begin.", "success");
    await signOut(auth);
  } catch {
    genericError();
  } finally {
    setBusy(deleteForm, false);
  }
});

document.querySelector("#sign-out").addEventListener("click", () => signOut(auth).catch(() => setStatus("تعذر تسجيل الخروج الآن. / We could not sign you out right now.", "error")));