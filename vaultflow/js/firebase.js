import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

const firebaseConfig = {
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  apiKey: "AIzaSyAv2Ne1QRShFpil6nT3iJu1dTOaFf4aaW4",
  authDomain: "store-data-36ad0.firebaseapp.com",
  projectId: "store-data-36ad0",
  storageBucket: "store-data-36ad0.firebasestorage.app",
  messagingSenderId: "539442910060",
  appId: "1:539442910060:web:03e17319cf6484bdcd5949",
  measurementId: "G-VE4C600LWS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
