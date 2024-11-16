import { doc } from "firebase/firestore";
import { useDocument } from "react-firebase-hooks/firestore";
import { db } from "src/utils/firebase";

export default function useRoom(roomId, userId) {
  const isUserRoom = roomId.includes(userId);
  const docId = isUserRoom ? roomId?.replace(userId, "") : roomId;
  const collectionId = isUserRoom ? "users" : "rooms";
  const [snapshot] = useDocument(
    docId ? doc(db, `${collectionId}/${docId}`) : null
  );

  if (!snapshot?.exists()) return null;

  return {
    id: snapshot.id,
    photoURL:
      snapshot.photoURL || `https://api.dicebear.com/9.x/${snapshot.id}/svg`,
    ...snapshot.data(),
  };
}
