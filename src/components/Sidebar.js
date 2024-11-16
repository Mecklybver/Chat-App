import {
  Add,
  ExitToApp,
  Home,
  Message,
  PeopleAlt,
  SearchOutlined,
} from "@mui/icons-material";
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
} from "@mui/material";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useRouter } from "next/router";
import { useState } from "react";
import SidebarList from "src/components/SidebarList";
import SidebarTab from "src/components/SidebarTab";
import useChats from "src/hooks/useChats";
import useRooms from "src/hooks/useRooms";
import useUsers from "src/hooks/useUsers";
import { auth, db } from "src/utils/firebase";

const tabs = [
  {
    id: 1,
    icon: <Home />,
  },
  {
    id: 2,
    icon: <Message />,
  },
  {
    id: 3,
    icon: <PeopleAlt />,
  },
];

export default function Sidebar({ user }) {
  const rooms = useRooms();
  const users = useUsers(user);
  const chats = useChats(user);
  const [isCreatingRoom, setCreatingRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [menu, setMenu] = useState(1);
  const router = useRouter();

  async function createRoom() {
    if (roomName?.trim()) {
      const newDoc = await addDoc(collection(db, "rooms"), {
        name: roomName,
        timestamp: serverTimestamp(),
      });
      setCreatingRoom(false);
      setRoomName("");
      setMenu(2);
      router.push(`/?roomId=${newDoc.id}`);
    }
  }

  async function searchUsersAndRooms(event) {
    event.preventDefault();
    const searchValue = event.target.elements.search.value;
    const userQuery = query(
      collection(db, "users"),
      where("name", "==", searchValue)
    );
    const userSnapshot = await getDocs(userQuery);
    const roomQuery = query(
      collection(db, "rooms"),
      where("name", "==", searchValue)
    );
    const roomSnapshot = await getDocs(roomQuery);
    const userResults = userSnapshot.docs.map((doc) => {
      const id =
        doc.id > user.uid ? `${doc.id}${user.uid}` : `${user.uid}${doc.id}`;
      return {
        id,
        ...doc.data(),
      };
    });
    const roomResults = roomSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const searchResults = [...userResults, ...roomResults];
    setMenu(4);
    setSearchResults(searchResults);
  }

  return (
    <div className="sidebar">
      <div className="sidebar__header">
        <div className="sidebar__header--left">
          <Avatar src={user?.photoURL} />
          <h4>{user?.displayName}</h4>
        </div>
        <div className="sidebar__header--right">
          <IconButton onClick={() => auth.signOut()}>
            <ExitToApp />
          </IconButton>
        </div>
      </div>

      <div className="sidebar__search">
        <form
          onSubmit={searchUsersAndRooms}
          className="sidebar__search--container"
        >
          <SearchOutlined />
          <input
            placeholder="Search for users or rooms"
            type="text"
            id="search"
          />
        </form>
      </div>

      <div className="sidebar__menu">
        {tabs.map((tab) => (
          <SidebarTab
            key={tab.id}
            onClick={() => setMenu(tab.id)}
            isActive={menu === tab.id}
          >
            <div className="sidebar__menu--home">
              {tab.icon}
              <div className="sidebar__menu--line" />
            </div>
          </SidebarTab>
        ))}
      </div>

      {menu === 1 ? (
        <SidebarList title="Chats" data={chats} />
      ) : menu === 2 ? (
        <SidebarList title="Rooms" data={rooms} />
      ) : menu === 3 ? (
        <SidebarList title="Users" data={users} />
      ) : menu === 4 ? (
        <SidebarList title="Search Results" data={searchResults} />
      ) : null}

      <div className="sidebar__chat--addRoom">
        <IconButton onClick={() => setCreatingRoom(true)}>
          <Add />
        </IconButton>
      </div>

      <Dialog
        maxWidth="sm"
        open={isCreatingRoom}
        onClose={() => setCreatingRoom(false)}
      >
        <DialogTitle>Create New Room</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Type the name of your public room. Every user will be able to join
            this room.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Room Name"
            type="email"
            fullWidth
            style={{ marginTop: 20 }}
            onChange={(event) => setRoomName(event.target.value)}
            value={roomName}
            variant="filled"
          />
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setCreatingRoom(false)}>
            Cancel
          </Button>
          <Button color="success" onClick={createRoom}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
