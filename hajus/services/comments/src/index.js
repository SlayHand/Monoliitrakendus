import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";

const app = express();
app.use(cors());
app.use(express.json());

const comments = []; // { id, postId, body, createdAt }
const EVENT_BUS = process.env.EVENT_BUS || "http://localhost:5005";

/** Loetle kommentaarid postile */
app.get("/api/posts/:id/comments", (req, res) => {
  const list = comments
    .filter((c) => c.postId === req.params.id)
    .sort((a, b) => a.createdAt - b.createdAt);
  res.json(list);
});

/** Loo kommentaar + publish CommentCreated */
app.post("/api/posts/:id/comments", async (req, res) => {
  const { body } = req.body || {};
  if (!body) return res.status(400).json({ error: "comment body required" });
  const c = {
    id: nanoid(),
    postId: req.params.id,
    body,
    createdAt: Date.now(),
  };
  comments.push(c);

  const event = { type: "CommentCreated", data: { ...c } };
  try {
    await fetch(`${EVENT_BUS}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (e) {
    console.error("[comments] publish CommentCreated failed:", e.message);
  }

  res.status(201).json(c);
});

/** (valikuline) Kustuta kommentaar + publish CommentDeleted */
app.delete("/api/comments/:id", async (req, res) => {
  const i = comments.findIndex((c) => c.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: "Comment not found" });
  const [deleted] = comments.splice(i, 1);

  const event = {
    type: "CommentDeleted",
    data: { id: deleted.id, postId: deleted.postId },
  };
  try {
    await fetch(`${EVENT_BUS}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (e) {
    console.error("[comments] publish CommentDeleted failed:", e.message);
  }

  res.json({ ok: true, deletedId: deleted.id });
});

/** Event handler – CONSUME (nt PostCreated, kui tahad cache’i vms) */
app.post("/events", (req, res) => {
  const { type, data } = req.body || {};
  if (type === "PostDeleted") {
    // puhasta seotud kommentaarid (kui tahad tugevamat kooskõla)
    const { id: postId } = data || {};
    const before = comments.length;
    for (let i = comments.length - 1; i >= 0; i--) {
      if (comments[i].postId === postId) comments.splice(i, 1);
    }
    const after = comments.length;
    console.log("[comments] PostDeleted → removed", before - after, "comments");
  }
  res.json({ ok: true });
});

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.listen(5001, () => console.log("comments-svc on :5001"));
