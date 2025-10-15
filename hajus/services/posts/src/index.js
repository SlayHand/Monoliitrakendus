import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";

const app = express();
app.use(cors());
app.use(express.json());

/** In-memory nagu monolis */
const posts = []; // {id,title,body,createdAt,commentsCount}

app.get("/api/posts", (req, res) => {
  res.json(posts.map((p) => ({ ...p, commentsCount: p.commentsCount ?? 0 })));
});

app.get("/api/posts/:id", (req, res) => {
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  // NB: comment’e ei hoia siin teenuses; klient küsib need comments-teenuselt
  res.json({ ...post, comments: [] });
});

app.post("/api/posts", (req, res) => {
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
  res.status(201).json(p);
});

app.delete("/api/posts/:id", (req, res) => {
  const i = posts.findIndex((p) => p.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: "Post not found" });
  const [deleted] = posts.splice(i, 1);
  // (hiljem: emiteeri sündmus "post.deleted" comments-teenusele)
  res.json({ ok: true, deletedId: deleted.id });
});

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.listen(5000, () => console.log("posts-svc on :5000"));
