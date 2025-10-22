const POSTS_BASE = import.meta.env.VITE_POSTS_API || "http://localhost:5000";
const COMMENTS_BASE =
  import.meta.env.VITE_COMMENTS_API || "http://localhost:5001";

// POSTID
export async function getPosts() {
  const r = await fetch(`${POSTS_BASE}/api/posts`);
  if (!r.ok) throw new Error("Failed to load posts");
  return r.json();
}
export async function getPost(id) {
  const r = await fetch(`${POSTS_BASE}/api/posts/${id}`);
  if (!r.ok) throw new Error("Post not found");
  return r.json();
}
export async function createPost({ title, body }) {
  const r = await fetch(`${POSTS_BASE}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body }),
  });
  if (!r.ok) throw new Error("Create failed");
  return r.json();
}
export async function deletePost(id) {
  const r = await fetch(`${POSTS_BASE}/api/posts/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error("Delete failed");
  return r.json();
}

// KOMMENTAARID
export async function getComments(postId) {
  const r = await fetch(`${COMMENTS_BASE}/api/posts/${postId}/comments`);
  if (!r.ok) throw new Error("Failed to load comments");
  return r.json();
}
export async function createComment(postId, { body }) {
  const r = await fetch(`${COMMENTS_BASE}/api/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!r.ok) throw new Error("Failed to create comment");
  return r.json();
}
export async function getCommentById(id) {
  const r = await fetch(`${COMMENTS_BASE}/api/comments/${id}`);
  if (!r.ok) throw new Error("Failed to load comment");
  return r.json();
}

// alias, kui App.jsx ootab endiselt neid nimesid
export { getPosts as fetchPosts, getPost as fetchPost };
