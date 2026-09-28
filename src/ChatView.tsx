import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import {
  Creds,
  deleteNotification,
  digits,
  receiveNotification,
  sendMessage,
  toChatId,
} from "./api";
import { initial, reducer } from "./store";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const time = (ts: number) =>
  new Date(ts).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });

export default function ChatView({
  creds,
  onLogout,
}: {
  creds: Creds;
  onLogout: () => void;
}) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [netError, setNetError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const chat = state.active ? state.chats[state.active] : null;

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      while (!ac.signal.aborted) {
        try {
          const n = await receiveNotification(creds, ac.signal);
          setNetError("");
          if (!n) continue;
          const { body } = n;
          const md = body.messageData;
          const sender = body.senderData;
          if (
            body.typeWebhook === "incomingMessageReceived" &&
            sender &&
            md?.typeMessage === "textMessage"
          ) {
            dispatch({
              type: "add",
              key: digits(sender.chatId),
              chatId: sender.chatId,
              title: sender.senderName || digits(sender.chatId),
              msg: {
                id: body.idMessage ?? `in-${n.receiptId}`,
                out: false,
                text:
                  md.textMessageData?.textMessage ??
                  md.extendedTextMessageData?.text ??
                  "",
                ts: (body.timestamp ?? Date.now() / 1000) * 1000,
              },
            });
          }
          await deleteNotification(creds, n.receiptId);
        } catch (e) {
          if (ac.signal.aborted) return;
          setNetError(e instanceof Error ? e.message : "Ошибка сети");
          await sleep(3000);
        }
      }
    })();
    return () => ac.abort();
  }, [creds]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages.length, state.active]);

  function newChat(e: FormEvent) {
    e.preventDefault();
    const key = digits(phone);
    if (key.length < 5) return;
    dispatch({ type: "open", key, chatId: toChatId(phone), title: key });
    setPhone("");
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!chat || !message) return;
    const id = `local-${Date.now()}`;
    setText("");
    dispatch({
      type: "add",
      key: chat.key,
      chatId: chat.chatId,
      title: chat.title,
      msg: { id, text: message, out: true, ts: Date.now(), status: "sending" },
    });
    try {
      await sendMessage(creds, chat.chatId, message);
      dispatch({
        type: "update",
        key: chat.key,
        id,
        patch: { status: "sent" },
      });
    } catch {
      dispatch({
        type: "update",
        key: chat.key,
        id,
        patch: { status: "error" },
      });
    }
  }

  return (
    <div className="app">
      <aside className="side">
        <div className="side-head">
          <b>Чаты</b>
          <button className="link" onClick={onLogout}>
            Выйти
          </button>
        </div>
        <form className="new" onSubmit={newChat}>
          <input
            placeholder="Номер, напр. 79001234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
          />
          <button title="Новый чат">＋</button>
        </form>
        <div className="list">
          {state.order.length === 0 && (
            <p className="muted pad">Введите номер, чтобы начать чат</p>
          )}
          {state.order.map((k) => {
            const c = state.chats[k];
            const last = c.messages[c.messages.length - 1];
            return (
              <button
                key={k}
                className={"item" + (k === state.active ? " active" : "")}
                onClick={() => dispatch({ type: "select", key: k })}
              >
                <span className="avatar">{c.title[0]?.toUpperCase()}</span>
                <span className="meta">
                  <b>{c.title}</b>
                  <small>{last?.text ?? "Нет сообщений"}</small>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
      <main className="main">
        {netError && (
          <div className="error bar">{netError} — повторная попытка…</div>
        )}
        {chat ? (
          <>
            <header className="head">
              <span className="avatar">{chat.title[0]?.toUpperCase()}</span>
              <b>{chat.title}</b>
            </header>
            <div className="msgs">
              {chat.messages.map((m) => (
                <div key={m.id} className={"bubble " + (m.out ? "out" : "in")}>
                  <span>{m.text}</span>
                  <small>
                    {time(m.ts)}
                    {m.out &&
                      (m.status === "sending"
                        ? " ·  …"
                        : m.status === "error"
                          ? " · ошибка"
                          : " ✓")}
                  </small>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form className="composer" onSubmit={send}>
              <input
                placeholder="Сообщение"
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
              />
              <button disabled={!text.trim()}>➤</button>
            </form>
          </>
        ) : (
          <div className="empty muted">Выберите чат или создайте новый</div>
        )}
      </main>
    </div>
  );
}
