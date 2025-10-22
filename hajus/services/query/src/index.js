import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Query teenus hoiab koondvaadet:
 * posts = {
 *   [postId]: { id, title, body, createdAt, comments: [ {id, postId, body, createdAt}, ... ] }
 * }
 */
const posts = Object.create(null);

// Võta koondvaade (listina või ühekaupa)
app.get("/api/query/posts", (req, res) => {
  // tagasta massiivina (Object.values), nagu juhendis soovitatud Reacti kasutamiseks
  res.json(Object.values(posts));
});

app.get("/api/query/posts/:id", (req, res) => {
  const post = posts[req.params.id];
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

// Võta sündmused vastu (event-bus → siia)
app.post("/events", (req, res) => {
  const { type, data } = req.body || {};

  if (type === "PostCreated") {
    const { id, title, body, createdAt } = data;
    posts[id] = posts[id] || { id, title, body, createdAt, comments: [] };
  }

  if (type === "PostDeleted") {
    const { id } = data || {};
    if (id && posts[id]) delete posts[id];
  }

  if (type === "CommentCreated") {
    const { id, postId, body, createdAt } = data;
    if (!posts[postId]) {
      // kui post sündmus polnud veel saabunud, tee skeleton
      posts[postId] = {
        id: postId,
        title: "",
        body: "",
        createdAt: null,
        comments: [],
      };
    }
    posts[postId].comments.push({ id, postId, body, createdAt });
  }

  if (type === "CommentDeleted") {
    const { id, postId } = data || {};
    const p = posts[postId];
    if (p) {
      p.comments = p.comments.filter((c) => c.id !== id);
    }
  }

  res.json({ ok: true });
});

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.listen(5002, () => console.log("query-svc on :5002"));
