// Import dari Firebase SDK
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Konfigurasi Firebase kamu — ganti dengan info dari Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyD8TpoXzmeSJ98IRsS5qUwDE0nPqYBQTl4",
  authDomain: "manda-a4da0.firebaseapp.com",
  projectId: "manda-a4da0",
  storageBucket:  "manda-a4da0.firebasestorage.app",
  messagingSenderId:  "1051563910231",
  appId: "1:1051563910231:web:eb566c25227a70bb612f12",
  measurementId:  "G-PP9T4W3WW0"
};

// Inisialisasi Firebase app
const app = initializeApp(firebaseConfig);

// Inisialisasi Firestore
const db = getFirestore(app);

// Export db supaya bisa dipakai di file lain
export { db };