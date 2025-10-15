import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";

const app = express();
app.use(cors());
app.use(express.json());

/** In-memory nagu monolis */
const comments = []; // {id,postId,body,createdAt}

app.get("/api/posts/:id/comments", (req, res) => {
  const list = comments
    .filter((c) => c.postId === req.params.id)
    .sort((a, b) => a.createdAt - b.createdAt);
  res.json(list);
});

app.post("/api/posts/:id/comments", (req, res) => {
  const { body } = req.body || {};
  if (!body) return res.status(400).json({ error: "comment body required" });
  const c = {
    id: nanoid(),
    postId: req.params.id,
    body,
    createdAt: Date.now(),
  };
  comments.push(c);
  res.status(201).json(c);
});

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.listen(5001, () => console.log("comments-svc on :5001"));
