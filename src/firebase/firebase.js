import {initializeApp} from "firebase/app";
import {getFirestore} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-YNOtvBC8Bd4W0uQFx--iwi4qewyrPrs",
  authDomain: "mama-kugler.firebaseapp.com",
  projectId: "mama-kugler",
  storageBucket: "mama-kugler.firebasestorage.app",
  messagingSenderId: "690244559631",
  appId: "1:690244559631:web:b9bd850fe62f43e781d47a",
  measurementId: "G-KCSEPP6F5X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);