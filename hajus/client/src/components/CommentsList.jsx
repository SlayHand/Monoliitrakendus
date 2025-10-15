export default function CommentsList({ comments }) {
  if (!comments?.length) return <p>Kommentaare veel pole.</p>;
  return (
    <ul style={{ paddingLeft: 18 }}>
      {comments.map(c => (
        <li key={c.id} style={{ marginBottom: 6 }}>
          <div>{c.body}</div>
          <small>{new Date(c.createdAt).toLocaleString()}</small>
        </li>
      ))}
    </ul>
  );
}