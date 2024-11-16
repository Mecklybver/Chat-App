import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "src/utils/firebase";

export default function useAuthUser() {
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, `users/${user.uid}`)).then((doc) => {
        if (!doc.exists()) {
          setDoc(doc.ref, {
            name: user.displayName,
            photoURL: user.photoURL,
            timestamp: serverTimestamp(),
          });
        }
      });
    }
  }, [user]);

  return user;
}
