import { AddPhotoAlternate, MoreVert } from "@mui/icons-material";
import {
  Avatar,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import Compressor from "compressorjs";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { nanoid } from "nanoid";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import ChatFooter from "src/components/ChatFooter";
import ChatMessages from "src/components/ChatMessages";
import MediaPreview from "src/components/MediaPreview";
import useChatMessages from "src/hooks/useChatMessages";
import useRoom from "src/hooks/useRoom";
import { db, storage } from "src/utils/firebase";

export default function Chat({ user }) {
  const router = useRouter();
  const roomId = router.query.roomId ?? "";
  const userId = user.uid;
  const [image, setImage] = useState(null);
  const [input, setInput] = useState("");
  const [isDeleting, setDeleting] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [audioId, setAudioId] = useState("");
  const [previewSrc, setPreviewSrc] = useState("");
  const messages = useChatMessages(roomId);
  const room = useRoom(roomId, userId);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      setTimeout(() => {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }, 0);
    }
  }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();

    const canSendMessage = input.trim() || (input === "" && image);

    if (canSendMessage) {
      setInput("");
      if (image) closePreview();
      const imageName = nanoid();
      const newMessage = {
        name: user.displayName,
        message: input,
        uid: user.uid,
        timestamp: serverTimestamp(),
        time: new Date().toUTCString(),
        ...(image ? { imageUrl: "uploading", imageName } : {}),
      };
      await setDoc(doc(db, `users/${userId}/chats/${roomId}`), {
        name: room.name,
        photoURL: room.photoURL || null,
        timestamp: serverTimestamp(),
      });

      const newDoc = await addDoc(
        collection(db, `rooms/${roomId}/messages`),
        newMessage
      );

      if (image) {
        new Compressor(image, {
          quality: 0.8,
          maxWidth: 1920,
          async success(result) {
            setImage(null);
            await uploadBytes(ref(storage, `images/${imageName}`), result);
            const url = await getDownloadURL(
              ref(storage, `images/${imageName}`)
            );
            updateDoc(doc(db, `rooms/${roomId}/messages/${newDoc.id}`), {
              imageUrl: url,
            });
          },
        });
      }
    }
  }

  function showPreview(event) {
    const file = event.target.files[0];

    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setPreviewSrc(reader.result);
      };
    }
  }

  function closePreview() {
    setPreviewSrc("");
    setImage(null);
  }

  async function deleteRoom() {
    setOpenMenu(false);
    setDeleting(true);

    try {
      const userChatsRef = doc(db, `users/${userId}/chats/${roomId}`);
      const roomRef = doc(db, `rooms/${roomId}`);
      const roomMessagesRef = collection(db, `rooms/${roomId}/messages`);
      const roomMessages = await getDocs(query(roomMessagesRef));
      const audioFiles = [];
      const imageFiles = [];
      roomMessages.docs.forEach((doc) => {
        if (doc.data().audioName) {
          audioFiles.push(doc.data().audioName);
        } else if (doc.data().imageName) {
          imageFiles.push(doc.data().imageName);
        }
      });

      await Promise.all([
        deleteDoc(userChatsRef),
        deleteDoc(roomRef),
        ...roomMessages.docs.map((doc) => deleteDoc(doc.ref)),
        ...imageFiles.map((image) =>
          deleteObject(ref(storage, `images/${image}`))
        ),
        ...audioFiles.map((audio) =>
          deleteObject(ref(storage, `audio/${audio}`))
        ),
      ]);
    } catch (error) {
      console.error("Error deleting room: ", error.message);
    } finally {
      setDeleting(false);
    }
  }

  if (!room) return null;

  return (
    <div className="chat">
      <div className="chat__background" />

      <div className="chat__header">
        <div className="avatar__container">
          <Avatar src={room?.photoURL} />
        </div>

        <div className="chat__header--info">
          <h3>{room?.name}</h3>
        </div>

        <div className="chat__header--right">
          <input
            id="image"
            style={{ display: "none" }}
            accept="image/*"
            type="file"
            onChange={showPreview}
          />
          <IconButton>
            <label style={{ cursor: "pointer", height: 24 }} htmlFor="image">
              <AddPhotoAlternate />
            </label>
          </IconButton>
          <IconButton onClick={(event) => setOpenMenu(event.currentTarget)}>
            <MoreVert />
          </IconButton>
          <Menu
            id="menu"
            anchorEl={openMenu}
            open={Boolean(openMenu)}
            onClose={() => setOpenMenu(null)}
            keepMounted
          >
            <MenuItem onClick={deleteRoom}>Delete Room</MenuItem>
          </Menu>
        </div>
      </div>

      <div className="chat__body--container" ref={chatBodyRef}>
        <div className="chat__body">
          <ChatMessages
            messages={messages}
            user={user}
            roomId={roomId}
            audioId={audioId}
            setAudioId={setAudioId}
            setPreviewSrc={setPreviewSrc}
          />
        </div>
      </div>

      {previewSrc && (
        <MediaPreview src={previewSrc} closePreview={closePreview} />
      )}

      <ChatFooter
        input={input}
        onChange={(event) => setInput(event.target.value)}
        sendMessage={sendMessage}
        image={image}
        user={user}
        room={room}
        roomId={roomId}
        setAudioId={setAudioId}
      />

      {isDeleting && (
        <div className="chat__deleting">
          <CircularProgress />
        </div>
      )}
    </div>
  );
}
