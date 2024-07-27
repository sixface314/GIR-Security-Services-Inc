// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlSWJBr9qEnv6pTY3SfvmA8WrioyH3x3E",
  authDomain: "gir-security-services-inc.firebaseapp.com",
  projectId: "gir-security-services-inc",
  storageBucket: "gir-security-services-inc.appspot.com",
  messagingSenderId: "581428069444",
  appId: "1:581428069444:web:bb4aa15ae43c65c512e811",
  measurementId: "G-0EQ1MS3LZN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };
