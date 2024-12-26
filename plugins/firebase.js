import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth'; // Import GoogleAuthProvider
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCyIB_82NDxwvJd7qYqEzYe1JG_5_Qrfns",
    authDomain: "fire-cclient.firebaseapp.com",
    projectId: "fire-cclient",
    storageBucket: "fire-cclient.appspot.com",
    messagingSenderId: "963564192836",
    appId: "1:963564192836:web:8608c28b38e4b9bff26811"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider(); // Define the googleProvider

// Export Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
