import express from "express";
import cors from "cors";
import { containsBlacklisted } from "./blacklist.js";

const app = express();
app.use(cors());
app.use(express.json());

const EVENT_BUS = process.env.EVENT_BUS || "http://localhost:5005";

app.post("/events", async (req, res) => {
  const { type, data } = req.body || {};
  if (type === "CommentCreated") {
    const { id, postId, body } = data || {};
    const rejected = containsBlacklisted(body);
    const status = rejected ? "rejected" : "approved";

    const evt = { type: "CommentModerated", data: { id, postId, status } };
    try {
      await fetch(`${EVENT_BUS}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evt),
      });
      console.log(`[moderation] ${id} → ${status}`);
    } catch (e) {
      console.error("[moderation] publish failed:", e.message);
    }
  }
  res.json({ ok: true });
});

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.listen(5003, () => console.log("moderation-svc on :5003"));
