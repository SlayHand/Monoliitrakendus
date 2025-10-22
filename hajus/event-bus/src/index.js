import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const TARGETS = [
  process.env.POSTS_ENDPOINT || "http://localhost:5000/events",
  process.env.COMMENTS_ENDPOINT || "http://localhost:5001/events",
  process.env.QUERY_ENDPOINT || "http://localhost:5002/events",
  process.env.MODERATION_ENDPOINT || "http://localhost:5003/events",
];

app.post("/events", async (req, res) => {
  const event = req.body; // { type, data, ... }
  console.log("[bus] ←", event?.type, event?.data?.id ?? "");

  const results = await Promise.allSettled(
    TARGETS.map(async (url) => {
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });
        if (!r.ok) throw new Error(`status ${r.status}`);
        console.log(`[bus] → ${url} OK`);
      } catch (e) {
        console.error(`[bus] → ${url} FAIL:`, e.message);
      }
    })
  );

  res.json({ ok: true, delivered: results.length });
});

app.get("/health", (_, res) => res.json({ ok: true }));
app.listen(5005, () => console.log("event-bus on :5005"));
