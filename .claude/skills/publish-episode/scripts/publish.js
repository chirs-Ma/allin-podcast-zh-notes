#!/usr/bin/env node
/**
 * Publish a new episode to the All-In Podcast Chinese notes site.
 *
 * Usage: node publish.js <path-to-notes.visual.html>
 *
 * What it does:
 * 1. Validates the source HTML file exists
 * 2. Parses metadata (title, date, summary, stats) from the HTML
 * 3. Copies the episode into episodes/<slug>/
 * 4. Updates index.html with a new card (newest first, removes old "最新" badge)
 * 5. Git add / commit / push
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('Usage: node publish.js <path-to-notes.visual.html>');
  process.exit(1);
}

const resolvedSource = path.resolve(sourcePath);
if (!fs.existsSync(resolvedSource)) {
  console.error(`Source file not found: ${resolvedSource}`);
  process.exit(1);
}

// Find project root: prefer cwd if it has index.html, otherwise walk up from source
let projectRoot = process.cwd();
if (!fs.existsSync(path.join(projectRoot, 'index.html'))) {
  projectRoot = path.dirname(resolvedSource);
  while (!fs.existsSync(path.join(projectRoot, 'index.html'))) {
    const parent = path.dirname(projectRoot);
    if (parent === projectRoot) {
      console.error('Could not find project root (no index.html in cwd or ancestor of source)');
      process.exit(1);
    }
    projectRoot = parent;
  }
}

// ── Parse HTML metadata ────────────────────────────────────────────────────
const html = fs.readFileSync(resolvedSource, 'utf-8');

function stripTags(str) {
  return str.replace(/<[^>]+>/g, '').trim();
}

// Title: prefer <h1> content, fallback to <title>
const h1Match = html.match(/<h1>([\s\S]*?)<\/h1>/i);
const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
let title = '';
if (h1Match) {
  title = stripTags(h1Match[1]);
} else if (titleMatch) {
  // Title format: "标题内容 - 中文播客可视化笔记"
  const raw = stripTags(titleMatch[1]);
  title = raw.replace(/\s*-\s*中文播客可视化笔记\s*$/, '');
}
if (!title) title = 'Untitled Episode';

// Date from .meta span
const dateMatch = html.match(/生成时间[:：]\s*(\d{4}-\d{2}-\d{2})/);
const date = dateMatch ? dateMatch[1] : '';

// Summary from .summary p
const summaryMatch = html.match(/<div class="summary"><p>([\s\S]*?)<\/p><\/div>/i);
const summary = summaryMatch ? stripTags(summaryMatch[1]) : '';

// Stats from meta-pill badges
const pills = [];
const pillRe = /<span class="meta-pill"><b>([\s\S]*?)<\/b>([\s\S]*?)<\/span>/gi;
let m;
while ((m = pillRe.exec(html)) !== null) {
  pills.push({ value: stripTags(m[1]), label: stripTags(m[2]) });
}

// Build tags: first pill is "reading time" (accent), rest are regular
const readingTimePill = pills[0];
const otherPills = pills.slice(1);

const otherTagsHtml = otherPills.map(p =>
  `          <span class="meta-tag"><b>${p.value}</b> ${p.label}</span>`
).join('\n');

// Build data-search keywords (title words + date)
const keywords = [
  ...title.split(/[、，,\s]+/).filter(w => w.length > 1),
  date
].join(' ');

// ── Copy episode into project ──────────────────────────────────────────────
const sourceDir = path.dirname(resolvedSource);
const slug = path.basename(sourceDir);
const targetDir = path.join(projectRoot, 'episodes', slug);
const targetFile = path.join(targetDir, 'notes.visual.html');

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(resolvedSource, targetFile);
console.log(`Copied episode to: ${path.relative(projectRoot, targetFile)}`);

// ── Update index.html ──────────────────────────────────────────────────────
const indexPath = path.join(projectRoot, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf-8');

// Remove all existing "最新" badges
indexHtml = indexHtml.replace(/<span class="new-badge">最新<\/span>/g, '');

// Build the new card HTML
const relativeLink = `./episodes/${slug}/notes.visual.html`;
const cardHtml = `      <a
        class="episode-card"
        href="${relativeLink}"
        data-search="${keywords}"
      >
        <div class="episode-header">
          <h2 class="episode-title">${title}<span class="new-badge">最新</span></h2>
          <span class="episode-date">${date}</span>
        </div>
        <p class="episode-summary">${summary}</p>
        <div class="episode-meta">
          <span class="meta-tag accent"><b>${readingTimePill ? readingTimePill.value : ''}</b>${readingTimePill ? ' ' + readingTimePill.label : ''}</span>
${otherTagsHtml}
        </div>
      </a>
`;

// Insert the new card right after <main class="episode-list" id="episode-list">
const listOpenRe = /(<main class="episode-list" id="episode-list">)\n/;
if (!listOpenRe.test(indexHtml)) {
  console.error('Could not find <main class="episode-list"> in index.html');
  process.exit(1);
}
indexHtml = indexHtml.replace(listOpenRe, `$1\n${cardHtml}`);

fs.writeFileSync(indexPath, indexHtml, 'utf-8');
console.log('Updated index.html');

// ── Git operations ─────────────────────────────────────────────────────────
try {
  execSync('git add .', { cwd: projectRoot, stdio: 'inherit' });
  execSync(`git commit -m "Add episode: ${title}"`, { cwd: projectRoot, stdio: 'inherit' });
  execSync('git push', { cwd: projectRoot, stdio: 'inherit' });
  console.log('\n✅ Published and pushed to GitHub');
} catch (e) {
  console.error('\n❌ Git operation failed:', e.message);
  process.exit(1);
}
