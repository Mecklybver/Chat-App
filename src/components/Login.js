import { Button } from "@mui/material";
import { useSignInWithGoogle } from "react-firebase-hooks/auth";
import { auth } from "src/utils/firebase";

export default function Login() {
  const [signInWithGoogle] = useSignInWithGoogle(auth);

  return (
    <div className="app">
      <div className="login">
        <div className="login__background" />
        <div className="login__container">
          <img src="/logo.png" alt="Logo" />
          <div className="login__text">
            <h1>Sign in to EpicChat</h1>
          </div>
          <Button onClick={() => signInWithGoogle()}>
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
