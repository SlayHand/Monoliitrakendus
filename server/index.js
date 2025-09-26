const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");

const app = express();
app.use(cors());
app.use(express.json());

const posts = [
  { id: "p1", title: "Esimene post", body: "Tere, monoliit!", createdAt: Date.now() },
  { id: "p2", title: "Teine post", body: "Kommentaarid tulekul.", createdAt: Date.now() }
];

const comments = [
  { id: "c1", postId: "p1", body: "Mõnus algus!", createdAt: Date.now() },
  { id: "c2", postId: "p1", body: "+1", createdAt: Date.now() }
];
// ---- POSTS ----
// GET kõik postid koos kommentaaride arvuga
app.get("/api/posts", (req, res) => {
  const withCounts = posts.map(p => ({
    ...p,
    commentsCount: comments.filter(c => c.postId === p.id).length
  }));
  res.json(withCounts);
});

// GET üks post + tema kommentaarid
app.get("/api/posts/:id", (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const postComments = comments
    .filter(c => c.postId === post.id)
    .sort((a, b) => a.createdAt - b.createdAt);
  res.json({ ...post, comments: postComments });
});

// POST uus post
app.post("/api/posts", (req, res) => {
  const { title, body } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "title and body required" });
  const newPost = { id: nanoid(), title, body, createdAt: Date.now() };
  posts.unshift(newPost);
  res.status(201).json(newPost);
});

// ---- COMMENTS ----
// GET kommentaarid postile
app.get("/api/posts/:id/comments", (req, res) => {
  const list = comments
    .filter(c => c.postId === req.params.id)
    .sort((a, b) => a.createdAt - b.createdAt);
  res.json(list);
});

// POST lisa kommentaar
app.post("/api/posts/:id/comments", (req, res) => {
  const { body } = req.body || {};
  if (!body) return res.status(400).json({ error: "comment body required" });
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const newComment = { id: nanoid(), postId: post.id, body, createdAt: Date.now() };
  comments.push(newComment);
  res.status(201).json(newComment);
});

// DELETE post + tema kommentaarid
app.delete("/api/posts/:id", (req, res) => {
  const { id } = req.params;
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Post not found" });

  // eemalda post
  const [deleted] = posts.splice(idx, 1);
  // eemalda seotud kommentaarid
  const before = comments.length;
  for (let i = comments.length - 1; i >= 0; i--) {
    if (comments[i].postId === id) comments.splice(i, 1);
  }
  const removedComments = before - comments.length;

  res.json({ ok: true, deletedId: id, removedComments, post: deleted });
});

// Healthcheck
app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server töötab http://localhost:${PORT}`);
});