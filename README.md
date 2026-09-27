# AI PR Review Agent

An automated code review bot that runs on every pull request. It reads the code changes, sends them to an LLM (via Groq), and posts a structured review comment back on the PR — flagging bugs, security issues, missing edge cases, and style problems within seconds.

## How it works

1. A pull request is opened or updated on GitHub.
2. A GitHub Action triggers automatically (`.github/workflows/pr-review.yml`).
3. The workflow runs `review.js`, which:
   - Fetches the PR's code diff using the GitHub API.
   - Sends the diff to an LLM (Groq's hosted models) with a review prompt.
   - Posts the AI's response back onto the PR as a comment via the GitHub API.

No servers, no hosting — it runs entirely inside GitHub Actions' free tier, and uses Groq's free inference tier for the AI model. Total cost: $0.

## Example output

*(Add a screenshot here of a real review comment once you have one — see "Screenshot" section below.)*

## Tech used

- GitHub Actions (CI/CD trigger)
- GitHub REST API (fetching diffs, posting comments)
- Groq API (LLM inference)
- Node.js (no external dependencies — uses built-in `fetch`)

## Setup (to run this on your own repo)

1. Fork or copy `review.js` and `.github/workflows/pr-review.yml` into your repo.
2. Get a free API key from [console.groq.com](https://console.groq.com).
3. In your repo, go to **Settings → Secrets and variables → Actions**, and add a secret named `GROQ_API_KEY` with your key.
4. Open a pull request — the workflow runs automatically and posts a review comment.

## Limitations

- Reviews are based on the diff only, not the full codebase context.
- Very large diffs get truncated to stay within the model's input limit.
- Like any AI reviewer, it can occasionally get things wrong — it's meant to assist human review, not replace it.

## Author

Built by Santhosh as a portfolio project to explore CI/CD + LLM integration for automated developer tooling.
