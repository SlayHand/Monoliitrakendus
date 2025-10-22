export const BLACKLIST = ["fuck", "shit"].map((w) => w.toLowerCase());

export function containsBlacklisted(text) {
  const lower = (text || "").toLowerCase();
  return BLACKLIST.some((word) => {
    const re = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    return re.test(lower);
  });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
