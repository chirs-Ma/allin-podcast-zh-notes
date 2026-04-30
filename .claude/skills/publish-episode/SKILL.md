---
name: publish-episode
description: |
  Trigger when the user provides a path to a newly generated podcast detail page (notes.visual.html)
  and wants to publish it to the site. This skill handles copying the episode into the project,
  updating the homepage index.html with a new card, and pushing to GitHub.
  Use whenever the user says things like "publish this episode", "add this to the site",
  "I have a new episode", "put this detail page on the site", or provides a file path to
  a notes.visual.html file.
---

# Publish Episode

Automated workflow: take a generated detail page, integrate it into the site, and push to GitHub.

## Workflow

### 1. Receive the episode path

The user provides a path to a `notes.visual.html` file (or the directory containing it).

```
/path/to/allin-podcast/happyscribe_episodes/2026-04-24-topic-slug/notes.visual.html
```

If the user gives a directory path, append `/notes.visual.html`.

### 2. Run the publish script

Execute the bundled script with the resolved absolute path:

```bash
node .claude/skills/publish-episode/scripts/publish.js <absolute-path-to-notes.visual.html>
```

The script performs these steps automatically:

1. **Validate** — checks the source file exists
2. **Parse metadata** — extracts from the HTML:
   - Title (`<h1>` or `<title>`)
   - Date (from `.meta` "生成时间")
   - Summary (from `.summary p`)
   - Stats (reading time, takeaway count, timeline count, speaker count from `.meta-pill`)
3. **Copy** — copies the episode into `episodes/<slug>/notes.visual.html`
4. **Update index.html** — inserts a new card at the top of the list:
   - Removes the old "最新" badge from previous episodes
   - Adds "最新" badge to the new episode
   - Sets the correct relative link (`./episodes/<slug>/notes.visual.html`)
   - Builds `data-search` keywords for client-side filtering
5. **Git push** — `git add .`, `git commit`, `git push`

### 3. Report results

After the script runs, report to the user:
- Episode title and date
- Where it was copied to
- Whether GitHub push succeeded

If the script fails, show the error output and help the user fix the issue (e.g., git auth, missing file).

## Edge cases

- **Multiple new episodes**: Run the script once per episode, oldest first (so the final "最新" badge lands on the truly newest).
- **Path is relative**: Resolve to absolute path before passing to the script.
- **Git push fails**: Check if there are uncommitted changes, if remote is configured, and if the user needs to authenticate.
- **index.html structure changed**: If the script cannot find `<main class="episode-list">`, it will error. In that case, manually inspect index.html and update the script regex.
