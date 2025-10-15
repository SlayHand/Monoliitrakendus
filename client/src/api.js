const API = import.meta.env.VITE_API_URL || "http://localhost:4001";

export async function fetchPosts() {
  const res = await fetch(`${API}/api/posts`);
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

export async function createPost(data) {
  const res = await fetch(`${API}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
}

// UUS: üksiku posti detail (koos kommentaaridega)
export async function fetchPost(id) {
  const res = await fetch(`${API}/api/posts/${id}`);
  if (!res.ok) throw new Error("Failed to fetch post");
  return res.json();
}

// UUS: kommentaari lisamine
export async function createComment(postId, data) {
  const res = await fetch(`${API}/api/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create comment");
  return res.json();
}

export async function deletePost(id) {
  const res = await fetch(`${API}/api/posts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete post");
  return res.json();
}
