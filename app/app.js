// Platinum Roadmap — offline GTA VI trophy tracker.
// Loads only its own data/trophies.json, saves progress in localStorage,
// and never makes a network request. Source links come from the data file
// and open only when the reader clicks them.
const STORAGE_KEY = 'platinum-roadmap-progress-v1';
const SEED_IDS = [2, 3, 4, 5, 8, 9, 10, 15, 16, 21, 35, 42, 46];

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detailPane');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('gradeFilter');
const spoilerEl = document.getElementById('spoilerToggle');

const params = new URLSearchParams(window.location.search);
let storedSpoilers = null;
let spoilersExplicit = false;
let earned = loadProgress();
let spoilersOn = params.get('spoilers') === 'off' ? false : (typeof storedSpoilers === 'boolean' ? storedSpoilers : true);
let kindFilter = params.get('kind') || 'all';
let gradeFilter = 'all';
let selectedId = null;
let trophies = [];
let trophyMeta = null;

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (typeof parsed.spoilersOn === 'boolean') storedSpoilers = parsed.spoilersOn;
    return new Set(Array.isArray(parsed.earned) ? parsed.earned : parsed);
  } catch {
    return new Set();
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      app: 'platinum-roadmap',
      earned: [...earned].sort(),
      // Only persist the spoiler flag once the reader has toggled it: a
      // ?spoilers= link parameter (or the demo seed) must not silently
      // become the reader's permanent preference.
      spoilersOn: spoilersExplicit ? spoilersOn : storedSpoilers,
    }));
  } catch {
    // Private mode or full storage: progress lives in memory only.
  }
}

function seedDemoProgress() {
  if (params.get('seed') !== '13' || earned.size !== 0) return;
  for (const id of SEED_IDS) {
    const trophy = trophies.find((t) => t.id === id);
    if (trophy) earned.add(trophy.name);
  }
  saveProgress();
}

function isSpoilerHidden(trophy) {
  return spoilersOn && trophy.kind === 'story' && !earned.has(trophy.name);
}

function visibleName(trophy) {
  return isSpoilerHidden(trophy) ? 'Hidden story trophy' : trophy.name;
}

function visibleDescription(trophy) {
  return isSpoilerHidden(trophy)
    ? 'Hidden until earned — tick it off once you unlock it in the game.'
    : trophy.description;
}

function kindLabel(kind) {
  if (kind === 'story') return 'Story';
  if (kind === 'side') return 'Side strand';
  if (kind === 'collectibles') return 'Collectibles';
  if (kind === 'activities') return 'Activities';
  if (kind === 'platinum') return 'Platinum';
  return 'Misc';
}

function countLabel(trophy) {
  if (trophy.count == null) return '';
  if (trophy.id === 14) return 'Target: 100% completion';
  if (trophy.id === 52) return 'Target: $250,000 laundered';
  if (trophy.id === 53) return 'Target: $100,000 spent';
  return 'Target: ' + trophy.count;
}

function filteredTrophies() {
  const query = searchEl.value.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (kindFilter === 'missable' && !trophy.missable) return false;
    if (kindFilter === 'online') return false;
    if (kindFilter !== 'all' && kindFilter !== 'missable' && trophy.kind !== kindFilter) return false;
    if (gradeFilter !== 'all' && trophy.grade !== gradeFilter) return false;
    if (query) {
      // A spoiler-hidden trophy must never leak through search: only its
      // generic placeholder text is searchable, never the real name, the
      // official description or the guide.
      const hay = isSpoilerHidden(trophy)
        ? (visibleName(trophy) + ' ' + visibleDescription(trophy)).toLowerCase()
        : (trophy.name + ' ' + trophy.description + ' ' + trophy.guide).toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('bigCount').textContent = done + ' / ' + total;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressText').textContent = done + ' of ' + total + ' earned · ' + pct + '% to the platinum';
  const byGrade = {};
  for (const trophy of trophies) {
    if (earned.has(trophy.name)) byGrade[trophy.grade] = (byGrade[trophy.grade] || 0) + 1;
  }
  const totals = {};
  for (const trophy of trophies) totals[trophy.grade] = (totals[trophy.grade] || 0) + 1;
  document.getElementById('gradeCounts').textContent =
    'Platinum ' + (byGrade.platinum || 0) + '/' + (totals.platinum || 0) +
    ' · Gold ' + (byGrade.gold || 0) + '/' + (totals.gold || 0) +
    ' · Silver ' + (byGrade.silver || 0) + '/' + (totals.silver || 0) +
    ' · Bronze ' + (byGrade.bronze || 0) + '/' + (totals.bronze || 0);
}

function renderChecklist() {
  const shown = filteredTrophies();
  document.getElementById('listMeta').textContent =
    'Showing ' + shown.length + ' of ' + trophies.length + ' trophies' +
    (kindFilter === 'online' ? ' — the official list has 0 online trophies.' : '') +
    (spoilersOn ? ' · Story spoilers hidden until earned.' : '');
  document.getElementById('emptyNote').hidden = shown.length !== 0;
  listEl.replaceChildren();
  for (const trophy of shown) {
    const item = document.createElement('li');
    if (earned.has(trophy.name)) item.classList.add('earned');
    if (selectedId === trophy.id) item.classList.add('selected');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.name);
    box.setAttribute('aria-label', 'Earned: ' + visibleName(trophy));
    box.addEventListener('change', () => {
      toggleEarned(trophy, box.checked);
    });
    box.addEventListener('click', (event) => event.stopPropagation());
    const main = document.createElement('div');
    main.className = 'trophy-main';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    const medal = document.createElement('span');
    medal.className = 'medal ' + trophy.grade;
    name.append(medal, document.createTextNode(visibleName(trophy)));
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = visibleDescription(trophy);
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    const gradeTag = document.createElement('span');
    gradeTag.className = 'tag grade';
    gradeTag.textContent = trophy.grade;
    tags.append(gradeTag);
    const kindTag = document.createElement('span');
    kindTag.className = 'tag';
    kindTag.textContent = kindLabel(trophy.kind);
    if (trophy.kind !== 'platinum') tags.append(kindTag);
    if (trophy.missable) {
      const miss = document.createElement('span');
      miss.className = 'tag missable';
      miss.textContent = '⚠ MISSABLE';
      tags.append(miss);
    }
    if (trophy.count != null) {
      const count = document.createElement('span');
      count.className = 'trophy-count';
      count.textContent = countLabel(trophy);
      tags.append(count);
    }
    main.append(name, desc, tags);
    item.append(box, main);
    item.addEventListener('click', () => {
      selectedId = trophy.id;
      renderChecklist();
      renderDetail();
    });
    listEl.append(item);
  }
}

function markEarnedButton(trophy) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mark-earned-btn';
  button.textContent = earned.has(trophy.name) ? '✓ Mark as not earned' : 'Mark as earned';
  button.addEventListener('click', () => toggleEarned(trophy, !earned.has(trophy.name)));
  return button;
}

function resetFilters() {
  kindFilter = 'all';
  gradeFilter = 'all';
  searchEl.value = '';
  gradeEl.value = 'all';
  for (const button of document.querySelectorAll('#kindFilters button')) {
    button.classList.toggle('active', button.dataset.kind === 'all');
  }
}

function renderDetail() {
  const trophy = trophies.find((t) => t.id === selectedId) || trophies[0];
  if (!trophy) {
    detailEl.textContent = 'No trophy selected.';
    return;
  }
  selectedId = trophy.id;
  detailEl.replaceChildren();
  const title = document.createElement('h2');
  const medal = document.createElement('span');
  medal.className = 'medal ' + trophy.grade;
  title.append(medal, document.createTextNode(' ' + visibleName(trophy)));
  detailEl.append(title);
  if (isSpoilerHidden(trophy)) {
    const note = document.createElement('p');
    note.className = 'spoiler-hidden-note';
    note.textContent = 'This is a story trophy and spoilers are on. Its name, official description and guide stay hidden until you tick it off as earned — then the full guide appears here.';
    detailEl.append(note);
    const gradeLine = document.createElement('p');
    gradeLine.textContent = 'Grade: ' + trophy.grade + ' · Kind: ' + kindLabel(trophy.kind);
    detailEl.append(gradeLine);
    detailEl.append(markEarnedButton(trophy));
    return;
  }
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = 'Official: "' + trophy.description + '" — ' + trophy.grade;
  detailEl.append(official);
  if (trophy.missable) {
    const banner = document.createElement('div');
    banner.className = 'missable-banner';
    banner.textContent = '⚠ MISSABLE — the only missable trophy in the list. Do it in Chapter 1, before the story moves on.';
    detailEl.append(banner);
  }
  const earnedLine = document.createElement('p');
  earnedLine.className = 'earned-line';
  earnedLine.textContent = earned.has(trophy.name) ? '✓ Earned — ticked off in your tracker.' : 'Not earned yet — tick the box in the list when you unlock it.';
  detailEl.append(earnedLine);
  detailEl.append(markEarnedButton(trophy));
  const guideHead = document.createElement('h3');
  guideHead.textContent = 'Guide';
  const guideText = document.createElement('p');
  guideText.className = 'guide-text';
  guideText.textContent = trophy.guide;
  detailEl.append(guideHead, guideText);
  const metaHead = document.createElement('h3');
  metaHead.textContent = 'Details';
  const meta = document.createElement('p');
  meta.textContent = 'Kind: ' + kindLabel(trophy.kind) +
    ' · Roadmap step: ' + trophy.stage +
    (trophy.count != null ? ' · ' + countLabel(trophy) : '');
  detailEl.append(metaHead, meta);
  const srcHead = document.createElement('h3');
  srcHead.textContent = 'Sources';
  const srcList = document.createElement('ul');
  srcList.className = 'sources';
  for (const source of trophy.sources || []) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = source.name;
    li.append(link);
    srcList.append(li);
  }
  detailEl.append(srcHead, srcList);
}

function renderRoadmap() {
  const intro = document.getElementById('roadmapIntro');
  intro.replaceChildren();
  const head = document.createElement('h2');
  head.textContent = 'Roadmap to the platinum — about 200 hours, one playthrough';
  const body = document.createElement('p');
  body.textContent = 'PowerPyx rates the platinum 4/10 for difficulty: the challenge is time, not reflexes. The story takes 60–80 hours, the 100% completion checklist about 100 hours, and cleanup about 10–20 hours. There are no difficulty settings, no mission gold medals, no online trophies, and no mission replay — so keep a manual save at the start and end of each of the five chapters (15 manual slots plus one autosave). After the story you return to free-roam, the 100% checklist appears under Progress, Stats, 100% Completion, and every quest giver tied to a trophy comes back.';
  const warn = document.createElement('div');
  warn.className = 'warn-box';
  const warnText = document.createElement('strong');
  warnText.textContent = 'One warning: ';
  warn.append(warnText, document.createTextNode('only one trophy can be missed — Positive Mental Attitude, the Chapter 1 balcony meditation. Do it before leaving Chapter 1. Everything else can be finished after the story.'));
  intro.append(head, body, warn);
  const stagesEl = document.getElementById('stages');
  stagesEl.replaceChildren();
  const stageInfo = [
    { num: 1, title: 'Finish the story', meta: 'Chapters 1–5 · 60–80 hours · story trophies pop automatically', text: 'Play the story and enjoy it. Build two habits from Chapter 1: scan every new vehicle with the WAiNK app (the checklist later wants 200 of 277 base models) and study every new animal through the binoculars (100 of 255). Do the Chapter 1 balcony meditation the moment it is offered. Save at the start and end of each chapter.' },
    { num: 2, title: '100% completion checklist & activities', meta: 'About 100 hours · the gold trophy A Long Road lives here', text: 'Work the checklist: 70 of the 80 challenges (skip the hardest), all 42 shooting-range gold medals, every drone race, every robbery, every underwater discovery, all of Bret’s quests, 200 vehicles scanned, 100 animals studied, plus the collectibles — 3 card sets, 100 WAiNK locations, 8 garages, 10 vehicles registered.' },
    { num: 3, title: 'Strangers & Freaks and cleanup', meta: 'About 10–20 hours · the platinum pops at the end', text: 'Finish the 8 stranger strands and the final missions for Andy, Kenton, Billy, Randy and Tyrone, then mop up the miscellaneous trophies: partner robberies and escapes, showroom and airport moments, the easter egg, and the money totals ($250,000 laundered, $100,000 spent). The platinum unlocks with the last trophy.' },
  ];
  for (const stage of stageInfo) {
    const card = document.createElement('div');
    card.className = 'stage-card';
    const h = document.createElement('h2');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = 'Step ' + stage.num + ' — ';
    h.append(num, document.createTextNode(stage.title));
    const meta = document.createElement('p');
    meta.className = 'stage-meta';
    meta.textContent = stage.meta;
    const text = document.createElement('p');
    text.textContent = stage.text;
    const chips = document.createElement('div');
    chips.className = 'chip-row';
    for (const trophy of trophies.filter((t) => t.stage === stage.num)) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (earned.has(trophy.name) ? ' done' : '');
      const medal = document.createElement('span');
      medal.className = 'medal ' + trophy.grade;
      chip.append(medal, document.createTextNode(visibleName(trophy)));
      chip.addEventListener('click', () => {
        resetFilters();
        selectedId = trophy.id;
        switchTab('checklist');
        renderChecklist();
        renderDetail();
        const selected = listEl.querySelector('li.selected');
        if (selected) selected.scrollIntoView({ block: 'nearest' });
      });
      chips.append(chip);
    }
    card.append(h, meta, text, chips);
    stagesEl.append(card);
  }
}

function renderMissable() {
  const intro = document.getElementById('missableIntro');
  intro.replaceChildren();
  const head = document.createElement('h2');
  head.textContent = 'Missable trophies: 1 of 55';
  const body = document.createElement('p');
  body.textContent = 'PowerPyx flags exactly one potentially missable trophy in the whole list. Every other trophy is either automatic story progress or repeatable free-roam content, and after the story every quest giver tied to a trophy comes back. The danger is not the story — it is leaving Chapter 1 without one meditation.';
  intro.append(head, body);
  const list = document.getElementById('missableList');
  list.replaceChildren();
  for (const trophy of trophies.filter((t) => t.missable)) {
    const card = document.createElement('div');
    card.className = 'stage-card';
    const h = document.createElement('h2');
    h.textContent = '⚠ ' + trophy.name + ' — ' + trophy.grade;
    const off = document.createElement('p');
    off.className = 'official';
    off.textContent = 'Official: "' + trophy.description + '"';
    const guide = document.createElement('p');
    guide.textContent = trophy.guide;
    const srcHead = document.createElement('h3');
    srcHead.textContent = 'Sources';
    const srcList = document.createElement('ul');
    srcList.className = 'sources';
    for (const source of trophy.sources || []) {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = source.name;
      li.append(link);
      srcList.append(li);
    }
    card.append(h, off, guide, srcHead, srcList);
    list.append(card);
  }
  const safe = document.getElementById('safeNote');
  safe.replaceChildren();
  const safeHead = document.createElement('h2');
  safeHead.textContent = 'Almost everything else is safe';
  const safeBody = document.createElement('p');
  safeBody.textContent = 'All 12 story and chapter trophies unlock automatically when you finish their mission or chapter. All collectibles, activities, robberies and side strands stay available in free-roam after the story, and the side characters return. Five trophies have triggers that guide writers are still confirming — Personal Best above all — so if one of those has not popped by the end of the story, check the PowerPyx guide for the confirmed moment. The only thing you cannot get back is a Chapter 1 moment you walked past — so do the balcony meditation, keep chapter-start saves, and relax about the other 54.';
  safe.append(safeHead, safeBody);
}

function renderSources() {
  const seen = new Map();
  for (const trophy of trophies) {
    for (const source of trophy.sources || []) seen.set(source.url, source.name);
  }
  const list = document.getElementById('sourceList');
  list.replaceChildren();
  for (const [url, name] of seen) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = name;
    li.append(link);
    list.append(li);
  }
}

function toggleEarned(trophy, isEarned) {
  if (isEarned) earned.add(trophy.name);
  else earned.delete(trophy.name);
  saveProgress();
  renderProgress();
  renderChecklist();
  renderDetail();
  renderRoadmap();
}

function switchTab(tab) {
  for (const button of document.querySelectorAll('#tabs button')) {
    button.classList.toggle('active', button.dataset.tab === tab);
  }
  document.getElementById('viewChecklist').hidden = tab !== 'checklist';
  document.getElementById('viewRoadmap').hidden = tab !== 'roadmap';
  document.getElementById('viewMissable').hidden = tab !== 'missable';
  document.getElementById('toolbar').style.display = tab === 'checklist' ? '' : 'none';
}

function exportProgress() {
  const payload = {
    app: 'platinum-roadmap',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-platinum-roadmap-progress.json';
  link.click();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('bad file');
    const known = new Set(trophies.map((t) => t.name));
    const next = new Set();
    for (const name of names) if (typeof name === 'string' && known.has(name)) next.add(name);
    earned = next;
    saveProgress();
    renderProgress();
    renderChecklist();
    renderDetail();
    renderRoadmap();
    window.alert('Imported ' + next.size + ' earned trophies from the file.');
  } catch {
    window.alert('That file is not a Platinum Roadmap progress export.');
  }
}

async function loadTrophies() {
  let doc;
  try {
    const response = await fetch('data/trophies.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    doc = await response.json();
  } catch {
    document.getElementById('listMeta').textContent = 'Could not load data/trophies.json.';
    detailEl.textContent = 'Could not load the trophy data (data/trophies.json). This guide needs its own files served over HTTP — run `node serve.ts` and open http://localhost:8080 — instead of opening index.html directly from the file system.';
    return;
  }
  trophies = doc.trophies;
  trophyMeta = doc;
  // Drop any saved names that are not in the loaded list (a stale export or
  // a list that changed since the save), like importProgress does.
  const knownNames = new Set(trophies.map((t) => t.name));
  const before = earned.size;
  earned = new Set([...earned].filter((name) => knownNames.has(name)));
  if (earned.size !== before) saveProgress();
  seedDemoProgress();
  spoilerEl.checked = spoilersOn;
  renderProgress();
  renderChecklist();
  renderDetail();
  renderRoadmap();
  renderMissable();
  renderSources();
  const tab = params.get('tab');
  if (tab === 'roadmap' || tab === 'missable') switchTab(tab);
  if (params.get('kind')) {
    kindFilter = params.get('kind');
    for (const button of document.querySelectorAll('#kindFilters button')) {
      button.classList.toggle('active', button.dataset.kind === kindFilter);
    }
    renderChecklist();
  }
  if (params.get('select')) {
    const id = Number(params.get('select'));
    if (trophies.some((t) => t.id === id)) {
      selectedId = id;
      renderChecklist();
      renderDetail();
      const selected = listEl.querySelector('li.selected');
      if (selected) selected.scrollIntoView({ block: 'nearest' });
    }
  }
}

for (const button of document.querySelectorAll('#tabs button')) {
  button.addEventListener('click', () => switchTab(button.dataset.tab));
}
for (const button of document.querySelectorAll('#kindFilters button')) {
  button.addEventListener('click', () => {
    kindFilter = button.dataset.kind;
    for (const other of document.querySelectorAll('#kindFilters button')) {
      other.classList.toggle('active', other === button);
    }
    renderChecklist();
  });
}
gradeEl.addEventListener('change', () => {
  gradeFilter = gradeEl.value;
  renderChecklist();
});
searchEl.addEventListener('input', renderChecklist);
spoilerEl.addEventListener('change', () => {
  spoilersOn = spoilerEl.checked;
  spoilersExplicit = true;
  storedSpoilers = spoilersOn;
  saveProgress();
  renderChecklist();
  renderDetail();
  renderRoadmap();
});
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (event) => {
  importProgress(event.target.files[0]);
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (window.confirm('Clear all earned ticks in this browser?')) {
    earned = new Set();
    saveProgress();
    renderProgress();
    renderChecklist();
    renderDetail();
    renderRoadmap();
  }
});

loadTrophies();
