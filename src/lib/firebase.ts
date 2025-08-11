// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "indian-community-chat-app-usa",
  "appId": "1:694021236161:web:2ea3b20e625eca42a2bb40",
  "storageBucket": "indian-community-chat-app-usa.firebasestorage.app",
  "apiKey": "AIzaSyBs8RnlN0dpbea1c1iB9nq_KaUh8QvynJo",
  "authDomain": "indian-community-chat-app-usa.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "694021236161"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
