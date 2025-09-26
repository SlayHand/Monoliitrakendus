import { useEffect, useState } from "react";
import { fetchPosts, createPost, fetchPost } from "./api";
import CommentsList from "./components/CommentsList";
import CommentForm from "./components/CommentForm";

export default function App() {
  const [posts, setPosts] = useState([]);
  const [expanded, setExpanded] = useState({}); // { [postId]: { ...post, comments: [] } }
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const data = await fetchPosts();
      setPosts(data);
    } catch (e) {
      setErr(e.message || "Load error");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function onSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const created = await createPost({ title, body });
    setTitle(""); setBody("");
    setPosts(prev => [{ ...created, commentsCount: 0 }, ...prev]);
  }

  async function toggle(postId) {
    if (expanded[postId]) {
      setExpanded(prev => {
        const copy = { ...prev }; delete copy[postId]; return copy;
      });
    } else {
      const full = await fetchPost(postId); // {id,title,body,createdAt,comments:[]}
      setExpanded(prev => ({ ...prev, [postId]: full }));
    }
  }

  function onCommentCreated(postId, comment) {
    // uuenda lahtise posti kommentaaride listi
    setExpanded(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        comments: [...(prev[postId]?.comments || []), comment]
      }
    }));
    // uuenda ka ülevaate loendurit
    setPosts(prev =>
      prev.map(p => p.id === postId
        ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
        : p
      )
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Postid</h1>

      <form onSubmit={onSubmit} style={{ marginBottom: 24 }}>
        <input
          placeholder="Pealkiri"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
        />
        <textarea
          placeholder="Sisu"
          value={body}
          onChange={e => setBody(e.target.value)}
          style={{ display: "block", width: "100%", height: 80, marginBottom: 8 }}
        />
        <button type="submit">Lisa postitus</button>
      </form>

      {loading && <p>Laen…</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {!loading && posts.map(p => (
        <div key={p.id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
            <h3 style={{ margin: 0 }}>{p.title}</h3>
            <small>
              {new Date(p.createdAt).toLocaleString()} • kommentaare: {p.commentsCount ?? 0}
            </small>
          </div>
          <p style={{ whiteSpace: "pre-wrap" }}>{p.body}</p>

          <button onClick={() => toggle(p.id)}>
            {expanded[p.id] ? "Peida kommentaarid" : "Näita kommentaare"}
          </button>

          {expanded[p.id] && (
            <div style={{ marginTop: 12 }}>
              <CommentsList comments={expanded[p.id].comments || []} />
              <CommentForm postId={p.id} onCreated={(c) => onCommentCreated(p.id, c)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}