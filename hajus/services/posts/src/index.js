import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";

const app = express();
app.use(cors());
app.use(express.json());

/** In-memory nagu monolis */
const posts = []; // { id, title, body, createdAt, commentsCount }

/** Teenuste aadressid */
const COMMENTS_BASE = process.env.COMMENTS_BASE || "http://localhost:5001";
const EVENT_BUS = process.env.EVENT_BUS || "http://localhost:5005";

/** Kõik postid */
app.get("/api/posts", (req, res) => {
  res.json(posts.map((p) => ({ ...p, commentsCount: p.commentsCount ?? 0 })));
});

/** Üks post (võid jätta ilma kommentaarideta, sest commentsCount tuleb eventidest) */
app.get("/api/posts/:id", async (req, res) => {
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  // Kui tahad _ka_ kommentaarid kaasa (agregatsioon), jäta alles see blokk:
  try {
    const r = await fetch(`${COMMENTS_BASE}/api/posts/${post.id}/comments`);
    const comments = r.ok ? await r.json() : [];
    post.commentsCount = Array.isArray(comments)
      ? comments.length
      : post.commentsCount ?? 0;
    return res.json({ ...post, comments });
  } catch {
    return res.json({ ...post, comments: [] });
  }
});

/** Loo post + publish PostCreated */
app.post("/api/posts", async (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !body)
    return res.status(400).json({ error: "title and body required" });

  const p = {
    id: nanoid(),
    title,
    body,
    createdAt: Date.now(),
    commentsCount: 0,
  };
  posts.unshift(p);

  // Publish event
  const event = { type: "PostCreated", data: { ...p } };
  try {
    await fetch(`${EVENT_BUS}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (e) {
    console.error("[posts] publish PostCreated failed:", e.message);
  }

  res.status(201).json(p);
});

/** Kustuta post + (soovi korral) publish PostDeleted */
app.delete("/api/posts/:id", async (req, res) => {
  const i = posts.findIndex((p) => p.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: "Post not found" });
  const [deleted] = posts.splice(i, 1);

  const event = { type: "PostDeleted", data: { id: deleted.id } };
  try {
    await fetch(`${EVENT_BUS}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (e) {
    console.error("[posts] publish PostDeleted failed:", e.message);
  }

  res.json({ ok: true, deletedId: deleted.id });
});

/** Event handler – CONSUME (nt CommentCreated → uuenda loendurit) */
app.post("/events", (req, res) => {
  const { type, data } = req.body || {};
  if (type === "CommentCreated") {
    const { postId } = data || {};
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.commentsCount = (post.commentsCount ?? 0) + 1;
      console.log("[posts] CommentCreated → ++commentsCount for", postId);
    }
  }
  if (type === "CommentDeleted") {
    const { postId } = data || {};
    const post = posts.find((p) => p.id === postId);
    if (post) {
      post.commentsCount = Math.max(0, (post.commentsCount ?? 0) - 1);
      console.log("[posts] CommentDeleted → --commentsCount for", postId);
    }
  }
  res.json({ ok: true });
});

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.listen(5000, () => console.log("posts-svc on :5000"));
