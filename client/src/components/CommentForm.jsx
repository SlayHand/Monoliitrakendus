import { useState } from "react";
import { createComment } from "../api";

export default function CommentForm({ postId, onCreated }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      const newC = await createComment(postId, { body });
      setBody("");
      onCreated?.(newC);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 12 }}>
      <input
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Lisa kommentaar…"
        style={{ width: "100%", marginBottom: 8 }}
      />
      <button type="submit" disabled={busy}>
        {busy ? "Saadan…" : "Saada"}
      </button>
    </form>
  );
}
