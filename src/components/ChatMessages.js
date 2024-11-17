import { useState } from "react";
import { CircularProgress, IconButton, TextField, Button } from "@mui/material";
import { CloseRounded, CheckCircle, Cancel } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import AudioPlayer from "src/components/AudioPlayer";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "src/utils/firebase";
import { deleteObject, ref } from "firebase/storage";
import { Translate } from "@mui/icons-material";
import { GOOGLE_API_KEY } from "../../google";

function deleteMessage(id, roomId) {
  return async () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      const messageRef = doc(db, "rooms", roomId, "messages", id);
      const messageSnap = await getDoc(messageRef);
      const messageData = messageSnap.data();

      if (messageData.imageUrl) {
        await deleteObject(ref(storage, `images/${messageData.imageName}`));
      }

      if (messageData.audioName) {
        await deleteObject(ref(storage, `audio/${messageData.audioName}`));
      }

      await deleteDoc(messageRef);
    }
  };
}

async function editMessage(id, roomId, newMessage, oldMessage) {
  const messageRef = doc(db, "rooms", roomId, "messages", id);

  // Add the corrected message while keeping the original message
  await updateDoc(messageRef, {
    correctedMessage: newMessage,
    originalMessage: oldMessage,
    edited: true,
  });
}

const getDiffText = (original, edited) => {
  const originalWords = original.split(" ");
  const editedWords = edited.split(" ");

  return originalWords.map((word, idx) =>
    word !== editedWords[idx] ? (
      <span
        key={idx}
        style={{ textDecoration: "line-through", color: "red" }}
      >
        {word + " "}
      </span>
    ) : (
      word + " "
    )
  );
};


export default function ChatMessages({
  messages,
  user,
  roomId,
  audioId,
  setAudioId,
  setPreviewSrc,
}) {
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState("es");
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [editedMessage, setEditedMessage] = useState("");

  const translateMessage = async (messageId, text) => {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: text,
            target: selectedLanguage,
          }),
        }
      );

      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;

      setTranslatedMessages((prev) => ({
        ...prev,
        [messageId]: translatedText,
      }));
    } catch (error) {
      console.error("Translation error:", error);
    }
  };

  const handleAcceptEdit = async (messageId, roomId, oldMessage) => {
    await editMessage(messageId, roomId, editedMessage, oldMessage);
    setIsEditing(null); // End editing
  };

  const handleRejectEdit = () => {
    setIsEditing(null); // Cancel editing
    setEditedMessage(""); // Clear the edit field
  };

  const getDiffText = (original, edited) => {
    const originalWords = original.split(" ");
    const editedWords = edited.split(" ");

    return originalWords.map((word, idx) =>
      word !== editedWords[idx] ? (
        <span
          key={idx}
          style={{ textDecoration: "line-through", color: "red" }}
        >
          {word + " "}
        </span>
      ) : (
        word + " "
      )
    );
  };

  if (!messages) return null;

  return (
    <>
      {messages.map((message) => {
        const isSender = message.uid === user.uid;
        const isHovered = hoveredMessageId === message.id;
        const hasTranslation = translatedMessages[message.id];

        const handleEditButtonClick = (message) => {
          setIsEditing(message.id);
          setEditedMessage(message.message); // Save the current message to edit
        };

        return (
          <div
            key={message.id}
            className={`chat__message ${
              isSender ? "chat__message--sender" : ""
            }`}
            onMouseEnter={() => setHoveredMessageId(message.id)}
            onMouseLeave={() => setHoveredMessageId(null)}
          >
            <CloseRounded
              style={{
                cursor: "pointer",
                width: 14,
                height: 14,
                position: "absolute",
                top: 4,
                right: 4,
              }}
              onClick={deleteMessage(message.id, roomId)}
            />
            <span className="chat__name">{message.name}</span>

            {message.imageUrl === "uploading" ? (
              <div className="image-container">
                <div className="image__container--loader">
                  <CircularProgress style={{ width: 40, height: 40 }} />
                </div>
              </div>
            ) : message.imageUrl ? (
              <div className="image-container">
                <img
                  src={message.imageUrl}
                  alt={message.name}
                  onClick={() => setPreviewSrc(message.imageUrl)}
                  style={{ cursor: "pointer" }}
                />
              </div>
            ) : null}

            {message.audioName ? (
              <AudioPlayer
                sender={isSender}
                roomId={roomId}
                id={message.id}
                audioUrl={message.audioUrl}
                audioId={audioId}
                setAudioId={setAudioId}
              />
            ) : (
              <>
                <span className="chat__message--message">
                  {message.edited
                    ? getDiffText(
                        message.originalMessage,
                        message.correctedMessage
                      )
                    : message.originalMessage || message.message}
                </span>
                {message.edited && (
                  <div className="chat__message--correction">
                    {message.correctedMessage}
                  </div>
                )}

                {isHovered && !isEditing && !message.edited && (
                  <IconButton onClick={() => handleEditButtonClick(message)}>
                    <EditIcon style={{ width: 15, height: 15 }} />
                  </IconButton>
                )}

                {isEditing === message.id && (
                  <>
                    <div style={{ display: "flex", alignItems: "flex-start" }}>
                      <TextField
                        style={{ width: "80%", height: "20%" }}
                        value={editedMessage}
                        onChange={(e) => setEditedMessage(e.target.value)}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          marginLeft: "10px",
                        }}
                      >
                        <IconButton
                          onClick={() =>
                            handleAcceptEdit(
                              message.id,
                              roomId,
                              message.message
                            )
                          }
                          style={{ width: 20, height: 20 }}
                        >
                          <CheckCircle style={{ fontSize: 20 }} />
                        </IconButton>
                        <IconButton
                          onClick={handleRejectEdit}
                          style={{ width: 20, height: 20 }}
                        >
                          <Cancel style={{ fontSize: 20 }} />
                        </IconButton>
                      </div>
                    </div>
                  </>
                )}

                <br />
                {hasTranslation && (
                  <span className="chat__message--translation">
                    {translatedMessages[message.id]}
                    <CloseRounded
                      style={{
                        cursor: "pointer",
                        width: 10,
                        height: 14,
                        left: 2,
                        position: "relative",
                        top: 2,
                      }}
                      onClick={() =>
                        setTranslatedMessages((prev) => ({
                          ...prev,
                          [message.id]: null,
                        }))
                      }
                    />
                    <br />
                  </span>
                )}

                {isHovered && !hasTranslation && (
                  <div>
                    <select
                      value={selectedLanguage}
                      style={{ width: 35, height: 20 }}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                    >
                      <option value="es">🇪🇸</option>
                      <option value="en">🇬🇧</option>
                    </select>
                    <button
                      onClick={() =>
                        translateMessage(message.id, message.message)
                      }
                    >
                      <Translate style={{ width: 20, height: 10 }} />
                    </button>
                  </div>
                )}
              </>
            )}
            <span className="chat__timestamp">{message.time}</span>
          </div>
        );
      })}
    </>
  );
}
