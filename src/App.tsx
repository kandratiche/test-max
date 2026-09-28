import { useState } from "react";
import type { Creds } from "./api";
import Login from "./Login";
import ChatView from "./ChatView";

const KEY = "max-chat-creds";
const load = (): Creds | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
};

export default function App() {
  const [creds, setCreds] = useState<Creds | null>(load);
  if (!creds)
    return (
      <Login
        onLogin={(c) => {
          localStorage.setItem(KEY, JSON.stringify(c));
          setCreds(c);
        }}
      />
    );
  return (
    <ChatView
      creds={creds}
      onLogout={() => {
        localStorage.removeItem(KEY);
        setCreds(null);
      }}
    />
  );
}
