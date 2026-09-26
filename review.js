// review.js
// Runs inside a GitHub Action. It reads a pull request's code changes,
// asks an AI model (via Groq, which is free) to review them, and posts
// the result as a comment on the pull request.

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const REPO = process.env.REPO;         // e.g. "yourname/your-repo"
const PR_NUMBER = process.env.PR_NUMBER;

async function main() {
  if (!GITHUB_TOKEN || !GROQ_API_KEY || !REPO || !PR_NUMBER) {
    console.error("Missing required environment variables.");
    process.exit(1);
  }

  const diff = await getPRDiff();
  const review = await getAIReview(diff);
  await postComment(review);
  console.log("Review posted successfully.");
}

// Step 1: Get the code changes (diff) from the pull request
async function getPRDiff() {
  const url = `https://api.github.com/repos/${REPO}/pulls/${PR_NUMBER}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3.diff",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch PR diff: ${res.status}`);
  }

  let diff = await res.text();

  // AI models have a limit on how much text they can read at once,
  // so trim very large diffs to stay safe.
  const MAX_CHARS = 12000;
  if (diff.length > MAX_CHARS) {
    diff = diff.slice(0, MAX_CHARS) + "\n\n... (diff truncated, too large)";
  }

  return diff;
}

// Step 2: Send the diff to the AI model and get review comments back
async function getAIReview(diff) {
  const prompt = `You are an experienced software engineer reviewing a pull request.
Review the following code diff. Point out:
- Bugs or logic errors
- Security issues
- Missing edge cases
- Style or readability improvements

Be concise and specific. Use bullet points. If the code looks good, say so briefly.

Diff:
${diff}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// Step 3: Post the review as a comment on the pull request
async function postComment(review) {
  const url = `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`;
  const body = `### 🤖 AI PR Review\n\n${review}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body }),
  });

  if (!res.ok) {
    throw new Error(`Failed to post comment: ${res.status}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
