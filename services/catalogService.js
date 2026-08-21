const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, '..', 'data', 'catalog.json');

function loadCatalog() {
  const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
  return JSON.parse(raw);
}

// Simple fuzzy match: checks if any catalog keyword appears in (or closely
// matches) the mentioned item text. Case-insensitive, tolerant of partial matches.
function findItem(catalog, mentionText) {
  if (!mentionText) return null;
  const search = mentionText.toLowerCase().trim();

  // exact / substring match against keywords first
  for (const item of catalog.items) {
    for (const kw of item.keywords) {
      if (search.includes(kw.toLowerCase()) || kw.toLowerCase().includes(search)) {
        return item;
      }
    }
  }

  // fallback: match against item name words
  for (const item of catalog.items) {
    const nameWords = item.name.toLowerCase().split(' ');
    if (nameWords.some(w => search.includes(w) && w.length > 3)) {
      return item;
    }
  }

  return null;
}

function findItems(catalog, mentions = []) {
  return mentions
    .map(m => findItem(catalog, m))
    .filter(Boolean);
}

module.exports = { loadCatalog, findItem, findItems };
