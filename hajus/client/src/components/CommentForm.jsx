import { useState, useRef } from "react";
import { createComment, getCommentById } from "../api";

export default function CommentForm({ postId, onCreated }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef(null);

  // Pollimise seaded (vajadusel timmi)
  const POLL_INTERVAL_MS = 1000; // 1s
  const POLL_MAX_TRIES = 10; // kuni ~10s

  async function waitForModeration(id) {
    let last;
    for (let i = 0; i < POLL_MAX_TRIES; i++) {
      try {
        last = await getCommentById(id);
        if (last.status !== "pending") return last; // approved/rejected
      } catch {}
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    return last; // kui jäi pending, tagastame viimase seisu
  }

  async function submit(e) {
    e?.preventDefault?.();
    if (busy) return;
    const text = body.trim();
    if (!text) return;

    setBusy(true);
    setError("");
    try {
      // 1) Loo kommentaar (saad "pending" vastuse)
      const created = await createComment(postId, { body: text });

      // 2) Oota, kuni moderation otsustab (poll)
      const final = await waitForModeration(created.id);

      if (!final || final.status === "pending") {
        setError("Modereerimine võtab oodatust kauem. Proovi hiljem uuesti.");
        return;
      }

      if (final.status === "approved") {
        // 3) Lisa UI-sse alles nüüd
        onCreated?.(final);
        setBody("");
        formRef.current?.querySelector("textarea")?.focus();
      } else {
        // rejected
        setError("Kommentaar lükati tagasi.");
      }
    } catch (err) {
      setError(err?.message || "Kommentaari saatmine ebaõnnestus.");
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit(e);
  }

  return (
    <form onSubmit={submit} ref={formRef} aria-busy={busy}>
      <label htmlFor="comment-body" className="sr-only">
        Lisa kommentaar
      </label>
      <textarea
        id="comment-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Lisa kommentaar…"
        style={{
          width: "100%",
          marginBottom: 8,
          minHeight: 80,
          resize: "vertical",
        }}
        aria-invalid={!!error}
        aria-describedby={error ? "comment-error" : undefined}
        disabled={busy}
      />
      {error && (
        <div
          id="comment-error"
          role="alert"
          style={{ color: "crimson", marginBottom: 8 }}
        >
          {error}
        </div>
      )}
      <button type="submit" disabled={busy || !body.trim()}>
        {busy ? "Ootan modereerimist…" : "Saada"}
      </button>
    </form>
  );
}
