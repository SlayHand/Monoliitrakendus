import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";

const app = express();
app.use(cors());
app.use(express.json());

/** Event-bus aadress (vaikimisi lokaalis) */
const EVENT_BUS = process.env.EVENT_BUS || "http://localhost:5005";

/** In-memory kommentaarid (arenduseks) */
const comments = []; // { id, postId, body, status, createdAt }

/** Healthcheck */
app.get("/api/health", (_, res) => res.json({ ok: true }));

/** Tagasta konkreetne kommentaar id järgi (pollimiseks) */
app.get("/api/comments/:id", (req, res) => {
  const c = comments.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Comment not found" });
  res.json(c);
});

/** Tagasta postile kuuluvad kommentaarid (kronoloogilises järjekorras) */
app.get("/api/posts/:id/comments", (req, res) => {
  const list = comments
    .filter((c) => c.postId === req.params.id)
    .sort((a, b) => a.createdAt - b.createdAt);
  res.json(list);
});

/** Loo kommentaar → status: "pending" → publish CommentCreated */
app.post("/api/posts/:id/comments", async (req, res) => {
  const { body } = req.body || {};
  if (!body) return res.status(400).json({ error: "comment body required" });

  const c = {
    id: nanoid(),
    postId: req.params.id,
    body,
    status: "pending",
    createdAt: Date.now(),
  };
  comments.push(c);

  // Publish CommentCreated (pending)
  try {
    await fetch(`${EVENT_BUS}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "CommentCreated", data: { ...c } }),
    });
  } catch (e) {
    console.error("[comments] publish CommentCreated failed:", e.message);
  }

  res.status(201).json(c);
});

/** (Valikuline) Kustuta kommentaar → publish CommentDeleted */
app.delete("/api/comments/:id", async (req, res) => {
  const i = comments.findIndex((c) => c.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: "Comment not found" });
  const [deleted] = comments.splice(i, 1);

  try {
    await fetch(`${EVENT_BUS}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "CommentDeleted",
        data: { id: deleted.id, postId: deleted.postId },
      }),
    });
  } catch (e) {
    console.error("[comments] publish CommentDeleted failed:", e.message);
  }

  res.json({ ok: true, deletedId: deleted.id });
});

/** Kuula sündmusi (nt moderation-svc → CommentModerated) */
app.post("/events", async (req, res) => {
  const { type, data } = req.body || {};

  if (type === "CommentModerated") {
    const { id, postId, status } = data || {};
    const c = comments.find((x) => x.id === id && x.postId === postId);
    if (c) {
      c.status = status; // "approved" | "rejected"

      // Teavita teisi teenuseid muutusest
      try {
        await fetch(`${EVENT_BUS}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "CommentUpdated", data: { ...c } }),
        });
      } catch (e) {
        console.error("[comments] publish CommentUpdated failed:", e.message);
      }
    }
  }

  // (Valikuline) puhasta, kui post kustutati
  if (type === "PostDeleted") {
    const { id: postId } = data || {};
    for (let i = comments.length - 1; i >= 0; i--) {
      if (comments[i].postId === postId) comments.splice(i, 1);
    }
  }

  res.json({ ok: true });
});

app.listen(5001, () => console.log("comments-svc on :5001"));
