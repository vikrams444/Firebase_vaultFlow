import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const authError = document.getElementById("authError");

const authCard = document.getElementById("authCard");
const verifyCard = document.getElementById("verifyCard");
const verifyText = document.getElementById("verifyText");
const resendBtn = document.getElementById("resendBtn");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const backToLoginBtn = document.getElementById("backToLoginBtn");

function showAuth() {
  authCard.classList.remove("hidden");
  verifyCard.classList.add("hidden");
}

function showVerifyScreen(email) {
  authCard.classList.add("hidden");
  verifyCard.classList.remove("hidden");
  verifyText.innerText =
    `We have sent you a verification email to ${email}. Please verify it and log in.`;
}

function setError(msg) {
  authError.innerText = msg;
}

loginBtn.addEventListener("click", async () => {
  setError("");
  const email = emailInput.value.trim();
  const password = passInput.value.trim();

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // ✅ Block unverified users
    if (!user.emailVerified) {
      await signOut(auth);
      showVerifyScreen(email);
      return;
    }

    window.location.href = "dashboard.html";
  } catch (err) {
    setError("Email or password is incorrect");
  }
});

signupBtn.addEventListener("click", async () => {
  setError("");

  const email = emailInput.value.trim();
  const password = passInput.value.trim();

  // ✅ basic validation
  if (!email || !email.includes("@")) {
    setError("Please enter a valid email");
    return;
  }

  if (!password || password.length < 6) {
    setError("Password must be at least 6 characters");
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    await sendEmailVerification(userCred.user, {
      url: window.location.origin + "/index.html"
    });


    // ✅ Do NOT auto login
    await signOut(auth);

    showVerifyScreen(email);
  } catch (err) {
    console.log("Signup error:", err.code, err.message);

    if (err.code === "auth/email-already-in-use") {
      setError("User already exists. Please sign in");
      return;
    }

    if (err.code === "auth/invalid-email") {
      setError("Please enter a valid email");
      return;
    }

    if (err.code === "auth/weak-password") {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("Something went wrong. Try again");
    console.log("Verification email sent to:", userCred.user.email);

  }
});

resendBtn.addEventListener("click", async () => {
  setError("");

  const email = emailInput.value.trim();
  const password = passInput.value.trim();

  if (!email || !password) {
    setError("Enter email & password to resend verification");
    return;
  }

  try {
    // login temporarily to resend
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCred.user);
    await signOut(auth);

    alert("Verification email resent! Check spam/promotions."); // ✅ if you don’t want alert, I’ll make inline msg
  } catch (err) {
    console.log(err.code, err.message);
    setError("Could not resend email. Try again.");
  }
});

backToLoginBtn.addEventListener("click", () => {
  showAuth();
});
