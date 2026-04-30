#!/usr/bin/env node
/**
 * Publish new episodes to the All-In Podcast Chinese notes site.
 *
 * Scans the fixed source directory for new episodes and publishes them.
 *
 * Usage:
 *   node publish.js          # Publish the latest unpublished episode
 *   node publish.js all      # Publish all unpublished episodes (oldest first)
 *   node publish.js <slug>   # Publish a specific episode by slug
 *
 * Source dir: /Users/maxuexian/Desktop/allin-podcast/happyscribe_episodes/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Configuration ──────────────────────────────────────────────────────────
const SOURCE_DIR = '/Users/maxuexian/Desktop/allin-podcast/happyscribe_episodes';
const EPISODE_FILE = 'notes.visual.html';

// ── Find project root ──────────────────────────────────────────────────────
let projectRoot = process.cwd();
while (!fs.existsSync(path.join(projectRoot, 'index.html'))) {
  const parent = path.dirname(projectRoot);
  if (parent === projectRoot) {
    console.error('Could not find project root (no index.html in cwd or ancestors)');
    process.exit(1);
  }
  projectRoot = parent;
}

// ── Discover episodes ──────────────────────────────────────────────────────
function discoverEpisodes() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });
  const dirs = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(name => /^\d{4}-\d{2}-\d{2}-/.test(name))
    .sort(); // oldest first

  return dirs.map(slug => {
    const sourceFile = path.join(SOURCE_DIR, slug, EPISODE_FILE);
    const publishedDir = path.join(projectRoot, 'episodes', slug);
    const isPublished = fs.existsSync(publishedDir);
    return { slug, sourceFile, isPublished };
  });
}

// ── Parse HTML metadata ────────────────────────────────────────────────────
function parseMetadata(html) {
  function stripTags(str) {
    return str.replace(/<[^>]+>/g, '').trim();
  }

  // Title: prefer <h1>, fallback to <title>
  const h1Match = html.match(/<h1>([\s\S]*?)<\/h1>/i);
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  let title = '';
  if (h1Match) {
    title = stripTags(h1Match[1]);
  } else if (titleMatch) {
    const raw = stripTags(titleMatch[1]);
    title = raw.replace(/\s*-\s*中文播客可视化笔记\s*$/, '');
  }
  title = title.replace(/^标题[:：]\s*/, '');
  if (!title) title = 'Untitled Episode';

  // Date
  const dateMatch = html.match(/生成时间[:：]\s*(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : '';

  // Summary
  const summaryMatch = html.match(/<div class="summary"><p>([\s\S]*?)<\/p><\/div>/i);
  const summary = summaryMatch ? stripTags(summaryMatch[1]) : '';

  // Stats pills
  const pills = [];
  const pillRe = /<span class="meta-pill"><b>([\s\S]*?)<\/b>([\s\S]*?)<\/span>/gi;
  let m;
  while ((m = pillRe.exec(html)) !== null) {
    pills.push({ value: stripTags(m[1]), label: stripTags(m[2]) });
  }

  const readingTimePill = pills[0];
  const otherPills = pills.slice(1);

  const keywords = [
    ...title.split(/[、，,\s]+/).filter(w => w.length > 1),
    date
  ].join(' ');

  return { title, date, summary, readingTimePill, otherPills, keywords };
}

// ── Publish one episode ────────────────────────────────────────────────────
function publishOne(slug, sourceFile, isNewest) {
  const html = fs.readFileSync(sourceFile, 'utf-8');
  const meta = parseMetadata(html);

  // Copy
  const targetDir = path.join(projectRoot, 'episodes', slug);
  const targetFile = path.join(targetDir, EPISODE_FILE);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`\n📁 Copied: ${slug}`);

  // Update index.html
  const indexPath = path.join(projectRoot, 'index.html');
  let indexHtml = fs.readFileSync(indexPath, 'utf-8');

  // Remove old "最新" badges if this is the newest
  if (isNewest) {
    indexHtml = indexHtml.replace(/<span class="new-badge">最新<\/span>/g, '');
  }

  const badge = isNewest ? '<span class="new-badge">最新</span>' : '';
  const otherTagsHtml = meta.otherPills.map(p =>
    `          <span class="meta-tag"><b>${p.value}</b> ${p.label}</span>`
  ).join('\n');

  const relativeLink = `./episodes/${slug}/${EPISODE_FILE}`;
  const cardHtml = `      <a
        class="episode-card"
        href="${relativeLink}"
        data-search="${meta.keywords}"
      >
        <div class="episode-header">
          <h2 class="episode-title">${meta.title}${badge}</h2>
          <span class="episode-date">${meta.date}</span>
        </div>
        <p class="episode-summary">${meta.summary}</p>
        <div class="episode-meta">
          <span class="meta-tag accent"><b>${meta.readingTimePill ? meta.readingTimePill.value : ''}</b>${meta.readingTimePill ? ' ' + meta.readingTimePill.label : ''}</span>
${otherTagsHtml}
        </div>
      </a>
`;

  const listOpenRe = /(<main class="episode-list" id="episode-list">)\n/;
  if (!listOpenRe.test(indexHtml)) {
    console.error('Could not find <main class="episode-list"> in index.html');
    process.exit(1);
  }
  indexHtml = indexHtml.replace(listOpenRe, `$1\n${cardHtml}`);
  fs.writeFileSync(indexPath, indexHtml, 'utf-8');
  console.log(`   Updated index.html card for: ${meta.title}`);

  return meta.title;
}

// ── Git operations ─────────────────────────────────────────────────────────
function gitPush(titles) {
  try {
    execSync('git add .', { cwd: projectRoot, stdio: 'inherit' });
    const commitMsg = titles.length === 1
      ? `Add episode: ${titles[0]}`
      : `Add ${titles.length} episodes: ${titles.join(', ').slice(0, 80)}…`;
    execSync(`git commit -m "${commitMsg}"`, { cwd: projectRoot, stdio: 'inherit' });
    execSync('git push', { cwd: projectRoot, stdio: 'inherit' });
    console.log('\n✅ Published and pushed to GitHub');
  } catch (e) {
    console.error('\n❌ Git operation failed:', e.message);
    process.exit(1);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
const arg = process.argv[2];
const allEpisodes = discoverEpisodes();

let toPublish = [];

if (arg === 'all') {
  // Publish all unpublished, oldest first
  toPublish = allEpisodes.filter(e => !e.isPublished);
  if (toPublish.length === 0) {
    console.log('All episodes are already published. Nothing to do.');
    process.exit(0);
  }
} else if (arg) {
  // Publish specific slug
  const found = allEpisodes.find(e => e.slug === arg);
  if (!found) {
    console.error(`Episode not found: ${arg}`);
    console.error(`Available slugs:\n  ${allEpisodes.map(e => e.slug).join('\n  ')}`);
    process.exit(1);
  }
  if (found.isPublished) {
    console.log(`Episode already published: ${arg}`);
    process.exit(0);
  }
  toPublish = [found];
} else {
  // Publish latest unpublished
  const unpublished = allEpisodes.filter(e => !e.isPublished);
  if (unpublished.length === 0) {
    console.log('All episodes are already published. Nothing to do.');
    process.exit(0);
  }
  toPublish = [unpublished[unpublished.length - 1]]; // latest
}

// Publish
const titles = [];
for (let i = 0; i < toPublish.length; i++) {
  const ep = toPublish[i];
  const isNewest = (i === toPublish.length - 1);
  const title = publishOne(ep.slug, ep.sourceFile, isNewest);
  titles.push(title);
}

gitPush(titles);
