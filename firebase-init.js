// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDCoYAF4QYFCtORfpelKp8lBuMvAhFXTAI",
  authDomain: "testwebpage-45e76.firebaseapp.com",
  projectId: "testwebpage-45e76",
  storageBucket: "testwebpage-45e76.firebasestorage.app",
  messagingSenderId: "915947230536",
  appId: "1:915947230536:web:6bbc647cfd3319388c0f7d",
  measurementId: "G-HSEFFQXV1K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 初始化服务
const db = firebase.firestore();
const auth = firebase.auth();

// 导出这些对象以便在其他文件中使用
window.firebaseServices = {
    db,
    auth
};