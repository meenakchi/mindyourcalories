// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAIX9KupLOlYC2eZwUqCccXIFPW3I-hh_Y",
  authDomain: "mindyourcalories.firebaseapp.com",
  projectId: "mindyourcalories",
  storageBucket: "mindyourcalories.firebasestorage.app",
  messagingSenderId: "231284270032",
  appId: "1:231284270032:web:387935cf8dbee814270fd5",
  measurementId: "G-8K70P6M1N3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);