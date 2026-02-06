/**
 * Fetch all topics and chapters for Physics subject (id: 665865487b076d51f6fc037a)
 * using the /public-topics/by-subject and /chapters/load-by-topic endpoints.
 *
 * Usage:
 *   node scripts/get-physics-topics-chapters.js
 *   AUTH_TOKEN=your_jwt node scripts/get-physics-topics-chapters.js
 */

const BASE_URL =
  process.env.API_BASE_URL || "https://opschool.tie.go.tz:5001/v1";
const SUBJECT_ID = "665865487b076d51f6fc037a"; // Physics
const AUTH_TOKEN = process.env.AUTH_TOKEN || "";

const topicsUrl = `${BASE_URL}/public-topics/by-subject/${SUBJECT_ID}`;
const chaptersUrl = (topicId) =>
  `${BASE_URL}/chapters/load-by-topic/${topicId}`;

const extractTopics = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.topics)) return data.topics;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const extractChapters = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.chapters)) return data.chapters;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

async function main() {
  const headers = { "Content-Type": "application/json" };
  if (AUTH_TOKEN) headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;

  // 1. Fetch topics for Physics subject
  const topicsRes = await fetch(topicsUrl, { method: "GET", headers });
  if (!topicsRes.ok) {
    console.error(
      "Topics request failed:",
      topicsRes.status,
      topicsRes.statusText
    );
    const text = await topicsRes.text();
    if (text) console.error(text);
    process.exit(1);
  }

  const topicsData = await topicsRes.json();
  const topics = extractTopics(topicsData);

  const output = {
    subjectId: SUBJECT_ID,
    topics: [],
  };

  // 2. For each topic, fetch chapters (only id and name; ignore rest)
  for (const topic of topics) {
    const topicId = topic._id ?? topic.id;
    const topicName = topic.name ?? topic.title ?? topicId;

    const entry = {
      topicId,
      topicName,
      chapters: [],
    };

    const chRes = await fetch(chaptersUrl(topicId), { method: "GET", headers });
    if (chRes.ok) {
      const chData = await chRes.json();
      const chapters = extractChapters(chData);
      entry.chapters = chapters.map((ch) => ({
        id: ch._id ?? ch.id,
        name: ch.name ?? ch.title ?? ch._id ?? ch.id,
      }));
    }

    output.topics.push(entry);
  }

  console.log(JSON.stringify(output, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
