export type Status = "sending" | "sent" | "error";
export interface Msg {
  id: string;
  text: string;
  out: boolean;
  ts: number;
  status?: Status;
}
export interface Chat {
  key: string;
  chatId: string;
  title: string;
  messages: Msg[];
}
export interface State {
  chats: Record<string, Chat>;
  order: string[];
  active: string | null;
}

export type Action =
  | { type: "open"; key: string; chatId: string; title: string }
  | { type: "add"; key: string; chatId: string; title: string; msg: Msg }
  | { type: "update"; key: string; id: string; patch: Partial<Msg> }
  | { type: "select"; key: string };

export const initial: State = { chats: {}, order: [], active: null };

function ensure(s: State, key: string, chatId: string, title: string): State {
  if (s.chats[key]) return s;
  return {
    ...s,
    chats: { ...s.chats, [key]: { key, chatId, title, messages: [] } },
    order: [key, ...s.order],
  };
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "open":
      return { ...ensure(s, a.key, a.chatId, a.title), active: a.key };
    case "select":
      return { ...s, active: a.key };
    case "add": {
      const n = ensure(s, a.key, a.chatId, a.title);
      const chat = n.chats[a.key];
      if (chat.messages.some((m) => m.id === a.msg.id)) return n;
      const title =
        !a.msg.out && chat.title === a.key && a.title ? a.title : chat.title;
      return {
        ...n,
        chats: {
          ...n.chats,
          [a.key]: { ...chat, title, messages: [...chat.messages, a.msg] },
        },
        order: [a.key, ...n.order.filter((k) => k !== a.key)],
      };
    }
    case "update": {
      const chat = s.chats[a.key];
      if (!chat) return s;
      const messages = chat.messages.map((m) =>
        m.id === a.id ? { ...m, ...a.patch } : m,
      );
      return { ...s, chats: { ...s.chats, [a.key]: { ...chat, messages } } };
    }
  }
}
