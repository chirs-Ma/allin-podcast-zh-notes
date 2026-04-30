---
name: publish-episode
description: |
  Publish newly generated podcast detail pages (notes.visual.html) to the site.
  This skill auto-discovers episodes from the fixed source directory, copies them
  into the project, updates index.html, and pushes to GitHub.
  Trigger when the user says things like "publish", "发布", "发布最新一期",
  "publish new episode", "push to site", or any mention of publishing episodes.
  Also trigger when the user mentions adding episodes to the homepage or GitHub.
---

# Publish Episode

Automated workflow: discover, copy, integrate, and push — no manual path needed.

## How it works

The source directory is fixed at:
```
/Users/maxuexian/Desktop/allin-podcast/happyscribe_episodes/
```

Each subdirectory follows the pattern `YYYY-MM-DD-topic-slug/` and contains a
`notes.visual.html` file.

### Discovery logic

The script scans the source directory and compares against already-published
episodes in `episodes/`. It knows which ones are new without user input.

### Usage modes

| Command | Behavior |
|---------|----------|
| `node publish.js` | Publish the **latest** unpublished episode |
| `node publish.js all` | Publish **all** unpublished episodes (oldest first) |
| `node publish.js <slug>` | Publish a **specific** episode by slug |

## Workflow

### 1. Auto-discover episodes

Run the script. It automatically:

1. **Scans** the source directory for all `*/notes.visual.html` files
2. **Compares** against `episodes/` — skips already published
3. **Selects** the target episode(s) based on the mode

### 2. Publish each episode

For each selected episode:

1. **Parse metadata** from the HTML:
   - Title (`<h1>` or `<title>`, with "标题：" prefix stripped)
   - Date (from `.meta` "生成时间")
   - Summary (from `.summary p`)
   - Stats (reading time, takeaways, timeline segments, speakers from `.meta-pill`)
2. **Copy** into `episodes/<slug>/notes.visual.html`
3. **Update index.html** — inserts a new card at the top of the list:
   - "最新" badge lands on the newest episode only
   - Previous episodes lose the "最新" badge
   - `data-search` keywords built for client-side filtering

### 3. Git push

Runs `git add .`, `git commit`, `git push` with an appropriate message.

## Edge cases

- **All episodes already published**: Script exits gracefully with "Nothing to do."
- **Specific slug not found**: Lists all available slugs and exits.
- **Specific slug already published**: Exits gracefully.
- **Git push fails**: Check remote auth and uncommitted changes.
- **index.html structure changed**: If `<main class="episode-list">` is not found,
  the script errors — inspect and update the regex in the script.
