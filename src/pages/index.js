import Chat from "src/components/Chat";
import Login from "src/components/Login";
import Sidebar from "src/components/Sidebar";
import useAuthUser from "src/hooks/useAuthUser";

export default function IndexPage() {
  const user = useAuthUser();

  if (!user) return <Login />;

  return (
    <div className="app">
      <div className="app__body">
        <Sidebar user={user} />
        <Chat user={user} />
      </div>
    </div>
  );
}
