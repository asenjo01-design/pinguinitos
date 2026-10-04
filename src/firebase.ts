import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyAlRDlsZ506fRwNq6fQrB7qpk9eFkFE2ro",
  authDomain: "pinguinitos.firebaseapp.com",
  projectId: "pinguinitos",
  storageBucket: "pinguinitos.firebasestorage.app",
  messagingSenderId: "834695937042",
  appId: "1:834695937042:web:cc0eb9b94b0124bf2c6ccb",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
