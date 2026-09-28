import { useState, type FormEvent } from "react";
import { Creds, DEFAULT_API_URL, getStateInstance } from "./api";

export default function Login({ onLogin }: { onLogin: (c: Creds) => void }) {
  const [idInstance, setId] = useState("");
  const [apiTokenInstance, setToken] = useState("");
  const [apiUrl, setUrl] = useState(DEFAULT_API_URL);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const creds = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: apiUrl.trim(),
    };
    setBusy(true);
    setError("");
    try {
      const r = await getStateInstance(creds);
      if (r && r.stateInstance !== "authorized")
        throw new Error(`Инстанс не авторизован (${r.stateInstance})`);
      onLogin(creds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось подключиться");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="card" onSubmit={submit}>
        <h1>Вход в MAX Chat</h1>
        <p className="muted">
          Введите данные инстанса из личного кабинета GREEN-API
        </p>
        <input
          placeholder="idInstance"
          value={idInstance}
          onChange={(e) => setId(e.target.value)}
          required
          inputMode="numeric"
        />
        <input
          placeholder="apiTokenInstance"
          type="password"
          value={apiTokenInstance}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <details>
          <summary>Дополнительно</summary>
          <input
            placeholder="apiUrl"
            value={apiUrl}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </details>
        {error && <div className="error">{error}</div>}
        <button disabled={busy}>{busy ? "Проверка…" : "Войти"}</button>
      </form>
    </div>
  );
}
