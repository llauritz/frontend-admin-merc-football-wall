// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // <-- Import the Realtime DB module
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC4TXOH-D6NBIDnZwIsVnW2xpHlv7toBrU",
    authDomain: "merc-football-wall.firebaseapp.com",
    databaseURL: "https://merc-football-wall-default-rtdb.firebaseio.com",
    projectId: "merc-football-wall",
    storageBucket: "merc-football-wall.firebasestorage.app",
    messagingSenderId: "673754557671",
    appId: "1:673754557671:web:915412c3be745dda464642"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);