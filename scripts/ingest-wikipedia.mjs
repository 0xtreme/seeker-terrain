#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");

const NODE_FILES = {
  tradition: "nodes-traditions.json",
  school: "nodes-schools.json",
  person: "nodes-people.json",
  concept: "nodes-concepts.json",
  text: "nodes-texts.json"
};

const EDGE_FILE = "edges.json";
const REPORT_FILE = "wikipedia-crawl-report.json";

const WIKI_API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT = "SpiritusDataIngest/1.0 (https://github.com/0xtreme/seeker-terrain)";

const DEFAULTS = {
  depth: 2,
  maxPagesPerTradition: 36,
  maxTotalPages: 360,
  maxLinksPerPage: 150,
  maxTraverseLinksPerPage: 44,
  maxGraphLinksPerNode: 8,
  maxLinkEdges: 1800,
  requestDelayMs: 70
};

const SEED_PAGES = {
  hinduism: [
    "Hinduism",
    "Hindu philosophy",
    "Vedanta",
    "Yoga",
    "Bhakti",
    "Ramanuja",
    "Madhvacharya",
    "Patanjali",
    "Abhinavagupta",
    "Chaitanya Mahaprabhu",
    "Ramananda",
    "Nimbarka",
    "Vishishtadvaita"
  ],
  buddhism: [
    "Buddhism",
    "Buddhist philosophy",
    "Mahayana",
    "Theravada",
    "Vajrayana",
    "Dogen",
    "Huineng",
    "Atisha",
    "Tsongkhapa",
    "Shantideva",
    "Padmasambhava",
    "Madhyamaka"
  ],
  islam: [
    "Islam",
    "Sufism",
    "Islamic philosophy",
    "Islamic theology",
    "Al-Farabi",
    "Avicenna",
    "Averroes",
    "Mulla Sadra",
    "Suhrawardi",
    "Ibn Ata Allah",
    "Ibn Arabi"
  ],
  christianity: [
    "Christianity",
    "Christian mysticism",
    "Christian theology",
    "Desert Fathers",
    "Augustine of Hippo",
    "Thomas Aquinas",
    "John of the Cross",
    "Francis of Assisi",
    "Origen",
    "Pseudo-Dionysius the Areopagite",
    "Gregory of Nyssa",
    "Maximus the Confessor"
  ],
  judaism: [
    "Judaism",
    "Kabbalah",
    "Jewish mysticism",
    "Hasidic Judaism",
    "Isaac Luria",
    "Moses de Leon",
    "Nachman of Breslov",
    "Judah Halevi",
    "Saadia Gaon",
    "Baal Shem Tov"
  ],
  taoism: [
    "Taoism",
    "Chinese philosophy",
    "Tao Te Ching",
    "Zhuangzi (book)",
    "Liezi",
    "Wang Bi",
    "Ge Hong",
    "Neidan",
    "Taoist meditation"
  ],
  sikhism: [
    "Sikhism",
    "Guru Granth Sahib",
    "Guru Angad",
    "Guru Amar Das",
    "Guru Ram Das",
    "Guru Arjan",
    "Guru Gobind Singh",
    "Bhai Gurdas"
  ],
  jainism: [
    "Jainism",
    "Jain philosophy",
    "Acharya Kundakunda",
    "Hemachandra",
    "Umaswati"
  ],
  zoroastrianism: [
    "Zoroastrianism",
    "Avesta",
    "Zarathustra",
    "Magi",
    "Frashokereti"
  ],
  greek_philosophy: [
    "Ancient Greek philosophy",
    "Stoicism",
    "Neoplatonism",
    "Pythagoreanism",
    "Plato",
    "Aristotle",
    "Zeno of Citium",
    "Chrysippus",
    "Cleanthes",
    "Epictetus",
    "Seneca the Younger",
    "Marcus Aurelius",
    "Cynicism (philosophy)",
    "Epicureanism",
    "Skepticism",
    "Heraclitus",
    "Parmenides"
  ],
  indigenous: [
    "Shamanism",
    "Animism",
    "Indigenous religion",
    "Mythology",
    "Black Elk",
    "Handsome Lake",
    "Deganawida",
    "Andean cosmovision"
  ],
  synthesis: [
    "Perennial philosophy",
    "Comparative religion",
    "Mysticism",
    "Esotericism",
    "Integral theory",
    "Transpersonal psychology",
    "World philosophy"
  ]
};

const RELEVANT_TERMS = [
  "religion",
  "spiritual",
  "philosophy",
  "philosopher",
  "mystic",
  "mysticism",
  "theology",
  "theological",
  "metaphysics",
  "meditation",
  "ritual",
  "doctrine",
  "tradition",
  "school",
  "sect",
  "scripture",
  "sacred",
  "sutra",
  "upanishad",
  "veda",
  "quran",
  "tanakh",
  "bible",
  "kabbalah",
  "sufi",
  "tao",
  "dharma",
  "karma",
  "moksha",
  "nirvana",
  "fana",
  "gnosis",
  "enlightenment",
  "monastic",
  "ethics",
  "ontology",
  "consciousness",
  "non-dual",
  "nondual",
  "emptiness"
];

const REJECT_TERMS = [
  "disambiguation",
  "list of",
  "film",
  "album",
  "song",
  "video game",
  "football",
  "cricket",
  "district",
  "municipality",
  "county",
  "village",
  "city",
  "railway",
  "airline",
  "political party",
  "military",
  "battle",
  "season",
  "award",
  "company",
  "brand",
  "far-right",
  "white nationalist",
  "fascist",
  "neo-nazi",
  "election",
  "electoral",
  "politician",
  "political office"
];

const TAG_KEYWORDS = {
  non_duality: ["non-dual", "nondual", "advaita", "oneness"],
  consciousness: ["consciousness", "awareness", "mind"],
  mysticism: ["mystic", "mysticism", "esoteric"],
  meditation: ["meditation", "contemplation", "mindfulness"],
  liberation: ["moksha", "nirvana", "liberation", "salvation", "enlightenment"],
  ritual: ["ritual", "ceremony", "liturgy"],
  ethics: ["ethics", "moral", "virtue"],
  scripture: ["scripture", "sutra", "quran", "bible", "tanakh", "text"],
  theology: ["theology", "theological", "divine", "god"],
  metaphysics: ["metaphysics", "ontology", "cosmology"]
};

const PERSON_CATEGORY_TERMS =
  /\b(philosophers|theologians|mystics|saints|gurus|monks|poets|writers|scholars|rabbis|imams|biographies|biography)\b/;

const PERSON_ROLE_TERMS =
  /\b(philosopher|theologian|mystic|saint|guru|monk|poet|writer|scholar|teacher|rabbi|imam|cleric|sage)\b/;

const PERSON_EXCLUSION_TERMS =
  /\b(philosophy|religion|movement|school|tradition|book|text|scripture|doctrine|concept|theory|order|organization|temple|church|festival)\b/;

const TEXT_TERMS =
  /\b(book|text|scripture|sutra|sutras|gita|quran|qur'an|bible|tanakh|upanishad|veda|canon|hymn|hadith|gospel|tractate|teachings)\b/;

const CONCEPT_TERMS =
  /\b(concept|belief|doctrine|principle|practice|ethic|ontology|metaphysics|epistemology|cosmology|meditation|ritual)\b/;

const SCHOOL_TERMS =
  /\b(philosophy|school|tradition|movement|order|lineage|sect|ism|monastic|mysticism)\b/;

const TITLE_TYPE_OVERRIDES = new Map(
  Object.entries({
    "marcus aurelius": "person",
    "seneca the younger": "person",
    "epictetus": "person",
    "zeno of citium": "person",
    "chrysippus": "person",
    "cleanthes": "person",
    "plato": "person",
    "aristotle": "person",
    "socrates": "person",
    "ramanuja": "person",
    "patanjali": "person",
    "dogen": "person",
    "tsongkhapa": "person",
    "augustine of hippo": "person",
    "thomas aquinas": "person",
    "al-farabi": "person",
    "avicenna": "person",
    "averroes": "person",
    "isaac luria": "person",
    "nachman of breslov": "person",
    "guru gobind singh": "person",
    "stoicism": "school",
    "epicureanism": "school",
    "cynicism (philosophy)": "school",
    "skepticism": "school",
    "neoplatonism": "school",
    "madhyamaka": "school",
    "vishishtadvaita": "school"
  })
);

const TITLE_TRADITION_OVERRIDES = new Map(
  Object.entries({
    "marcus aurelius": "greek_philosophy",
    "seneca the younger": "greek_philosophy",
    "epictetus": "greek_philosophy",
    "zeno of citium": "greek_philosophy",
    "chrysippus": "greek_philosophy",
    "cleanthes": "greek_philosophy",
    "plato": "greek_philosophy",
    "aristotle": "greek_philosophy",
    "heraclitus": "greek_philosophy",
    "parmenides": "greek_philosophy",
    "augustine of hippo": "christianity",
    "thomas aquinas": "christianity",
    "john of the cross": "christianity",
    "francis of assisi": "christianity",
    "al-farabi": "islam",
    "avicenna": "islam",
    "averroes": "islam",
    "mulla sadra": "islam",
    "ramanuja": "hinduism",
    "madhvacharya": "hinduism",
    "patanjali": "hinduism",
    "abhinavagupta": "hinduism",
    "dogen": "buddhism",
    "atisha": "buddhism",
    "tsongkhapa": "buddhism",
    "shantideva": "buddhism",
    "isaac luria": "judaism",
    "nachman of breslov": "judaism",
    "moses de leon": "judaism",
    "guru gobind singh": "sikhism",
    "guru arjan": "sikhism",
    "guru amar das": "sikhism",
    "guru angad": "sikhism",
    "zarathustra": "zoroastrianism",
    "stoicism": "greek_philosophy",
    "epicureanism": "greek_philosophy",
    "cynicism (philosophy)": "greek_philosophy",
    "skepticism": "greek_philosophy",
    "neoplatonism": "greek_philosophy"
  })
);

function parseArgs(argv) {
  const options = { ...DEFAULTS };

  for (const arg of argv.slice(2)) {
    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawKey, rawValue] = arg.slice(2).split("=");
    const key = rawKey.trim();
    const value = rawValue === undefined ? "true" : rawValue.trim();

    if (!(key in options)) {
      console.warn(`[warn] Unknown option --${key}. Ignoring.`);
      continue;
    }

    if (typeof options[key] === "number") {
      const num = Number(value);
      if (!Number.isFinite(num)) {
        throw new Error(`Invalid numeric value for --${key}: ${value}`);
      }
      options[key] = num;
      continue;
    }

    options[key] = value;
  }

  return options;
}

function normalizeTitle(title) {
  return String(title || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLookupKey(value) {
  return normalizeTitle(value).toLowerCase();
}

function toSlug(value) {
  return normalizeTitle(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function wikiUrlFromTitle(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(normalizeTitle(title).replace(/ /g, "_"))}`;
}

function extractWikiTitleFromUrl(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  const match = url.match(/wikipedia\.org\/wiki\/([^?#]+)/i);
  if (!match) {
    return null;
  }

  try {
    return normalizeTitle(decodeURIComponent(match[1]));
  } catch {
    return normalizeTitle(match[1]);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, retries = 3) {
  let attempt = 0;

  while (attempt <= retries) {
    attempt += 1;

    let response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json"
        }
      });
    } catch (error) {
      if (attempt > retries) {
        throw error;
      }
      await sleep(250 * attempt);
      continue;
    }

    if (response.ok) {
      return response.json();
    }

    if ((response.status === 429 || response.status >= 500) && attempt <= retries) {
      await sleep(350 * attempt);
      continue;
    }

    const body = await response.text();
    throw new Error(`Request failed (${response.status}) for ${url}\n${body.slice(0, 300)}`);
  }

  throw new Error(`Request failed after retries for ${url}`);
}

function shouldSkipLinkTitle(title) {
  const text = normalizeTitle(title).toLowerCase();
  if (!text) {
    return true;
  }

  if (text.startsWith("list of ")) {
    return true;
  }

  if (text.endsWith("(disambiguation)")) {
    return true;
  }

  if (/^\d{3,4}$/.test(text)) {
    return true;
  }

  if (/^\d{1,2}(st|nd|rd|th) century/.test(text)) {
    return true;
  }

  return false;
}

function linkPriority(title) {
  const normalizedTitle = normalizeTitle(title);
  const text = normalizedTitle.toLowerCase();
  let score = 0;

  if (shouldSkipLinkTitle(text)) {
    return -99;
  }

  for (const term of RELEVANT_TERMS) {
    if (text.includes(term)) {
      score += 2;
    }
  }

  if (text.includes("(")) {
    score += 1;
  }

  if (/^[a-z][a-z\-\s]+$/.test(text)) {
    score += 1;
  }

  const overrideType = TITLE_TYPE_OVERRIDES.get(text);
  if (overrideType === "person") {
    score += 6;
  } else if (overrideType === "school") {
    score += 4;
  }

  if (/\((philosopher|saint|mystic|poet|scholar|theologian|rabbi|imam|guru|teacher|monk)\)/i.test(normalizedTitle)) {
    score += 4;
  }

  if (/^[A-Z][a-z]+(?:\s[A-Z][a-z.'-]+){1,3}$/.test(normalizedTitle)) {
    score += 2;
  }

  if (REJECT_TERMS.some((term) => text.includes(term))) {
    score -= 4;
  }

  return score;
}

function normalizeSearchText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[‐‑‒–—−]/g, "-");
}

function textHasAny(text, terms) {
  const haystack = normalizeSearchText(text);
  return terms.some((term) => haystack.includes(normalizeSearchText(term)));
}

function hasBirthDeathCategories(categoriesText) {
  return (
    /\b\d{1,4}\s*(bc|bce|ce|ad)?\s+births\b/.test(categoriesText) ||
    /\b\d{1,4}\s*(bc|bce|ce|ad)?\s+deaths\b/.test(categoriesText)
  );
}

function hasPersonSignals(record) {
  const title = normalizeTitle(record.title);
  const categoriesText = (record.categories || []).join(" ").toLowerCase();
  const text = `${title} ${record.extract || ""}`.toLowerCase();
  const firstSentence = String(record.extract || "").split(".")[0].toLowerCase();

  const hasBirthDeath = hasBirthDeathCategories(categoriesText);
  const hasPersonCategory = PERSON_CATEGORY_TERMS.test(categoriesText);
  const hasPersonRole = PERSON_ROLE_TERMS.test(text);
  const titleRoleHint = /\((philosopher|saint|mystic|poet|scholar|theologian|rabbi|imam|guru|teacher|monk)\)/i.test(
    title
  );

  const sentenceLooksLikeBiography =
    /\b(was|is)\b/.test(firstSentence) &&
    PERSON_ROLE_TERMS.test(firstSentence) &&
    !PERSON_EXCLUSION_TERMS.test(firstSentence);

  if (hasBirthDeath) {
    return true;
  }

  if (PERSON_EXCLUSION_TERMS.test(firstSentence) && !hasPersonCategory && !titleRoleHint) {
    return false;
  }

  if (titleRoleHint && hasPersonRole) {
    return true;
  }

  if (hasPersonCategory && (hasPersonRole || sentenceLooksLikeBiography)) {
    return true;
  }

  return false;
}

function hasTextSignals(record) {
  const categoriesText = (record.categories || []).join(" ").toLowerCase();
  const text = `${record.title} ${record.extract || ""}`.toLowerCase();

  return (
    /\b(books|texts|scriptures|sutras|hymns|poems|writings|literature|canons|gospels|hadiths|tractates)\b/.test(
      categoriesText
    ) || TEXT_TERMS.test(text)
  );
}

function hasConceptSignals(record) {
  const categoriesText = (record.categories || []).join(" ").toLowerCase();
  const text = `${record.title} ${record.extract || ""}`.toLowerCase();

  return (
    /\b(concepts|doctrines|beliefs|rituals|practices|philosophical terms|metaphysics|ethics|ontology)\b/.test(
      categoriesText
    ) || CONCEPT_TERMS.test(text)
  );
}

function hasSchoolSignals(record) {
  const categoriesText = (record.categories || []).join(" ").toLowerCase();
  const text = `${record.title} ${record.extract || ""}`.toLowerCase();
  return SCHOOL_TERMS.test(categoriesText) || SCHOOL_TERMS.test(text);
}

function guessNodeType(record) {
  const overrideType = TITLE_TYPE_OVERRIDES.get(normalizeLookupKey(record.title));
  if (overrideType) {
    return overrideType;
  }

  if (hasPersonSignals(record)) {
    return "person";
  }

  if (hasTextSignals(record)) {
    return "text";
  }

  if (hasConceptSignals(record)) {
    return "concept";
  }

  if (hasSchoolSignals(record)) {
    return "school";
  }

  return "concept";
}

function isRelevantRecord(record, isSeed = false) {
  if (isSeed) {
    return true;
  }

  const title = normalizeTitle(record.title).toLowerCase();
  const categoriesText = (record.categories || []).join(" ").toLowerCase();
  const text = `${title} ${record.extract || ""} ${categoriesText}`;

  if (shouldSkipLinkTitle(title)) {
    return false;
  }

  const hasStrongSignal = hasPersonSignals(record) || hasTextSignals(record) || hasConceptSignals(record);

  const hasRelevantKeyword = textHasAny(text, RELEVANT_TERMS);
  const hasRejectKeyword = textHasAny(text, REJECT_TERMS);
  const hasSpiritualCategory = /\b(religion|religious|philosophy|philosophical|mysticism|mystic|theology|spiritual|sufi|buddh|hindu|christian|jewish|tao|jain|sikh|zoroastr|esoteric|occult)\b/.test(
    categoriesText
  );

  if (!hasRelevantKeyword && !hasStrongSignal && !hasSpiritualCategory) {
    return false;
  }

  if (hasRejectKeyword && !(hasSpiritualCategory && hasStrongSignal)) {
    return false;
  }

  return hasStrongSignal || hasRelevantKeyword || hasSpiritualCategory;
}

function parseBirthDeathYears(categories) {
  let birth = null;
  let death = null;

  for (const rawCategory of categories || []) {
    const category = rawCategory.toLowerCase();

    const birthMatch = category.match(/(\d{1,4})\s*(bc|bce|ce|ad)?\s+births/);
    if (birthMatch && birth === null) {
      const year = Number(birthMatch[1]);
      const era = birthMatch[2] || "ce";
      birth = /bc|bce/.test(era) ? -year : year;
    }

    const deathMatch = category.match(/(\d{1,4})\s*(bc|bce|ce|ad)?\s+deaths/);
    if (deathMatch && death === null) {
      const year = Number(deathMatch[1]);
      const era = deathMatch[2] || "ce";
      death = /bc|bce/.test(era) ? -year : year;
    }

    if (birth !== null && death !== null) {
      break;
    }
  }

  return { birth, death };
}

function parseCenturyYear(text) {
  const match = String(text || "").match(/(\d{1,2})(st|nd|rd|th)-century\s*(bc|bce|ce|ad)?/i);
  if (!match) {
    return null;
  }

  const century = Number(match[1]);
  const era = (match[3] || "ce").toLowerCase();

  if (!Number.isFinite(century) || century < 1) {
    return null;
  }

  const mid = (century - 1) * 100 + 50;
  return /bc|bce/.test(era) ? -mid : mid;
}

function parseFirstExplicitYear(text) {
  const eraMatch = String(text || "").match(/(\d{1,4})\s*(bc|bce|ce|ad)/i);
  if (eraMatch) {
    const year = Number(eraMatch[1]);
    const era = eraMatch[2].toLowerCase();
    return /bc|bce/.test(era) ? -year : year;
  }

  return parseCenturyYear(text);
}

function inferOriginPlace(record) {
  for (const category of record.categories || []) {
    const clean = String(category).replace(/^Category:/i, "").trim();

    if (/^People from\s+/i.test(clean)) {
      return clean.replace(/^People from\s+/i, "").trim();
    }

    if (/^Philosophers from\s+/i.test(clean)) {
      return clean.replace(/^Philosophers from\s+/i, "").trim();
    }

    if (/^Religions originating in\s+/i.test(clean)) {
      return clean.replace(/^Religions originating in\s+/i, "").trim();
    }
  }

  if (record.coordinates) {
    return "Wikipedia coordinates";
  }

  return "Unknown";
}

function summarizeExtract(extract) {
  const clean = String(extract || "").replace(/\s+/g, " ").trim();
  if (!clean) {
    return "Imported from Wikipedia via automated tradition/philosophy graph crawl.";
  }

  if (clean.length <= 420) {
    return clean;
  }

  const clipped = clean.slice(0, 420);
  const stop = clipped.lastIndexOf(". ");
  if (stop > 140) {
    return clipped.slice(0, stop + 1);
  }

  return `${clipped.slice(0, 416)}...`;
}

function buildTags(record, traditionId, type) {
  const text = `${record.title} ${record.extract || ""} ${(record.categories || []).join(" ")}`.toLowerCase();
  const tags = new Set([traditionId, type]);

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      tags.add(tag);
    }
  }

  if (type === "person") {
    tags.add("lineage");
  }
  if (type === "school") {
    tags.add("tradition");
  }

  return Array.from(tags).slice(0, 8);
}

function choosePrimaryTradition(record) {
  const overrideTradition = TITLE_TRADITION_OVERRIDES.get(normalizeLookupKey(record.title));
  if (overrideTradition) {
    return overrideTradition;
  }

  const ids = Array.from(record.traditions || []);
  if (!ids.length) {
    return "synthesis";
  }

  const nonSynthesis = ids.filter((id) => id !== "synthesis");
  if (nonSynthesis.length === 1) {
    return nonSynthesis[0];
  }

  if (nonSynthesis.length > 1) {
    return "synthesis";
  }

  return ids[0];
}

function chooseRelation(sourceType, targetType) {
  if (sourceType === "concept" || targetType === "concept") {
    return "shares_concept";
  }
  return "influenced";
}

function ensureUniqueId(baseId, usedIds) {
  let id = baseId;
  let counter = 2;
  while (!id || usedIds.has(id)) {
    id = `${baseId}_${counter}`;
    counter += 1;
  }
  usedIds.add(id);
  return id;
}

async function loadJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fetchPageRecord(title, options) {
  const requestedTitle = normalizeTitle(title);
  let plcontinue = null;
  let canonicalTitle = requestedTitle;
  let extract = "";
  let categories = [];
  let coordinates = null;
  const links = [];
  const seenLinks = new Set();

  do {
    const url = new URL(WIKI_API);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("formatversion", "2");
    url.searchParams.set("redirects", "1");
    url.searchParams.set("titles", canonicalTitle);
    url.searchParams.set("prop", "extracts|categories|coordinates|links");
    url.searchParams.set("exintro", "1");
    url.searchParams.set("explaintext", "1");
    url.searchParams.set("cllimit", "max");
    url.searchParams.set("plnamespace", "0");
    url.searchParams.set("pllimit", "max");

    if (plcontinue) {
      url.searchParams.set("plcontinue", plcontinue);
    }

    const data = await fetchJson(url.toString());
    const page = data?.query?.pages?.[0];

    if (!page || page.missing) {
      return null;
    }

    canonicalTitle = normalizeTitle(page.title || canonicalTitle);

    if (!extract && typeof page.extract === "string") {
      extract = page.extract;
    }

    if (!categories.length && Array.isArray(page.categories)) {
      categories = page.categories
        .map((entry) => normalizeTitle(String(entry.title || "").replace(/^Category:/i, "")))
        .filter(Boolean);
    }

    if (!coordinates && Array.isArray(page.coordinates) && page.coordinates.length) {
      const first = page.coordinates[0];
      if (Number.isFinite(first.lat) && Number.isFinite(first.lon)) {
        coordinates = {
          lat: Number(first.lat),
          lng: Number(first.lon)
        };
      }
    }

    if (Array.isArray(page.links)) {
      for (const link of page.links) {
        const linkedTitle = normalizeTitle(link.title);
        if (!linkedTitle || shouldSkipLinkTitle(linkedTitle)) {
          continue;
        }
        if (!seenLinks.has(linkedTitle)) {
          seenLinks.add(linkedTitle);
          links.push(linkedTitle);
        }
        if (links.length >= options.maxLinksPerPage) {
          break;
        }
      }
    }

    plcontinue = data?.continue?.plcontinue || null;
  } while (plcontinue && links.length < options.maxLinksPerPage);

  return {
    title: canonicalTitle,
    extract,
    categories,
    coordinates,
    links,
    traditions: new Set()
  };
}

async function crawlWikipedia(options) {
  const canonicalRecords = new Map();
  const aliases = new Map();

  const progress = {
    fetched: 0,
    kept: 0,
    skipped: 0,
    perTradition: {}
  };

  for (const [traditionId, seeds] of Object.entries(SEED_PAGES)) {
    const queue = seeds.map((title) => ({ title, depth: 0, isSeed: true }));
    const seenInTradition = new Set();
    let traditionCount = 0;

    while (queue.length) {
      if (progress.kept >= options.maxTotalPages) {
        break;
      }

      if (traditionCount >= options.maxPagesPerTradition) {
        break;
      }

      const current = queue.shift();
      const requestedKey = normalizeLookupKey(current.title);

      if (seenInTradition.has(requestedKey)) {
        continue;
      }
      seenInTradition.add(requestedKey);

      const resolvedKey = aliases.get(requestedKey) || requestedKey;
      let record = canonicalRecords.get(resolvedKey);

      if (!record) {
        const fetched = await fetchPageRecord(current.title, options);
        progress.fetched += 1;

        if (progress.fetched % 25 === 0) {
          console.log(`[crawl] fetched ${progress.fetched} pages; kept ${progress.kept}`);
        }

        if (!fetched) {
          progress.skipped += 1;
          continue;
        }

        const canonicalKey = normalizeLookupKey(fetched.title);
        aliases.set(requestedKey, canonicalKey);

        if (!isRelevantRecord(fetched, current.isSeed)) {
          progress.skipped += 1;
          continue;
        }

        fetched.depth = current.depth;
        canonicalRecords.set(canonicalKey, fetched);
        record = fetched;
        progress.kept += 1;

        if (options.requestDelayMs > 0) {
          await sleep(options.requestDelayMs);
        }
      }

      if (!record.traditions.has(traditionId)) {
        record.traditions.add(traditionId);
        traditionCount += 1;
      }

      if (current.depth >= options.depth) {
        continue;
      }

      const nextLinks = Array.from(new Set(record.links))
        .filter((title) => !shouldSkipLinkTitle(title))
        .sort((a, b) => linkPriority(b) - linkPriority(a))
        .slice(0, options.maxTraverseLinksPerPage);

      for (const linkTitle of nextLinks) {
        queue.push({ title: linkTitle, depth: current.depth + 1, isSeed: false });
      }
    }

    progress.perTradition[traditionId] = traditionCount;
    console.log(`[crawl] ${traditionId}: ${traditionCount} pages retained`);
  }

  return {
    records: canonicalRecords,
    progress
  };
}

function buildExistingLookup(allNodes) {
  const byId = new Map();
  const titleLookup = new Map();

  for (const node of allNodes) {
    byId.set(node.id, node);

    const labelKey = normalizeLookupKey(node.label);
    if (labelKey) {
      titleLookup.set(labelKey, node.id);
    }

    const wikiTitle = extractWikiTitleFromUrl(node.wikipedia);
    if (wikiTitle) {
      titleLookup.set(normalizeLookupKey(wikiTitle), node.id);
    }

    const idKey = normalizeLookupKey(node.id);
    if (idKey) {
      titleLookup.set(idKey, node.id);
    }
  }

  return { byId, titleLookup };
}

async function mergeCrawlIntoData(crawlResult, options) {
  const traditions = await loadJson(path.join(dataDir, NODE_FILES.tradition));
  const schools = await loadJson(path.join(dataDir, NODE_FILES.school));
  const people = await loadJson(path.join(dataDir, NODE_FILES.person));
  const concepts = await loadJson(path.join(dataDir, NODE_FILES.concept));
  const texts = await loadJson(path.join(dataDir, NODE_FILES.text));
  const edges = await loadJson(path.join(dataDir, EDGE_FILE));

  const nodeBuckets = {
    tradition: traditions,
    school: schools,
    person: people,
    concept: concepts,
    text: texts
  };

  const allNodes = [...traditions, ...schools, ...people, ...concepts, ...texts];
  const { byId: existingById, titleLookup } = buildExistingLookup(allNodes);
  const usedIds = new Set(allNodes.map((node) => node.id));

  const traditionIds = new Set(traditions.map((tradition) => tradition.id));
  const traditionStartYear = new Map(traditions.map((tradition) => [tradition.id, tradition.era_start ?? -3000]));

  const nodeInfoByTitle = new Map();

  for (const node of allNodes) {
    const info = {
      id: node.id,
      type: node.type,
      tradition: node.tradition || (node.type === "tradition" ? node.id : "synthesis"),
      isNew: false
    };

    nodeInfoByTitle.set(normalizeLookupKey(node.label), info);

    const wikiTitle = extractWikiTitleFromUrl(node.wikipedia);
    if (wikiTitle) {
      nodeInfoByTitle.set(normalizeLookupKey(wikiTitle), info);
    }
  }

  const newNodesByType = {
    tradition: [],
    school: [],
    person: [],
    concept: [],
    text: []
  };

  const crawlRecords = Array.from(crawlResult.records.values());
  const today = new Date().toISOString().slice(0, 10);

  for (const record of crawlRecords) {
    const titleKey = normalizeLookupKey(record.title);
    const existingId = titleLookup.get(titleKey);

    if (existingId) {
      const existing = existingById.get(existingId);
      nodeInfoByTitle.set(titleKey, {
        id: existing.id,
        type: existing.type,
        tradition: existing.tradition || (existing.type === "tradition" ? existing.id : "synthesis"),
        isNew: false
      });
      continue;
    }

    const type = guessNodeType(record);
    const primaryTradition = choosePrimaryTradition(record);
    const tradition = traditionIds.has(primaryTradition) ? primaryTradition : "synthesis";

    const birthDeath = parseBirthDeathYears(record.categories);
    const fallbackYear = parseFirstExplicitYear(record.extract);

    let eraStart = null;
    let eraEnd = null;

    if (type === "person") {
      eraStart = birthDeath.birth ?? fallbackYear ?? traditionStartYear.get(tradition) ?? null;
      eraEnd = birthDeath.death;
    } else {
      eraStart = fallbackYear ?? traditionStartYear.get(tradition) ?? null;
      eraEnd = null;
    }

    const baseId = `wiki_${toSlug(record.title)}`;
    const id = ensureUniqueId(baseId, usedIds);
    const wikipedia = wikiUrlFromTitle(record.title);

    const node = {
      id,
      label: record.title,
      type,
      tradition,
      era_start: eraStart,
      era_end: eraEnd,
      origin_lat: record.coordinates?.lat ?? null,
      origin_lng: record.coordinates?.lng ?? null,
      origin_place: inferOriginPlace(record),
      summary: summarizeExtract(record.extract),
      key_texts: type === "text" ? [record.title] : [],
      tags: buildTags(record, tradition, type),
      wikipedia,
      image: null,
      sources: [
        {
          title: `Wikipedia: ${record.title}`,
          url: wikipedia,
          note: `Imported on ${today} via automated link traversal from religion/philosophy seed pages.`
        }
      ]
    };

    nodeBuckets[type].push(node);
    newNodesByType[type].push(node);

    const info = {
      id,
      type,
      tradition,
      isNew: true
    };

    nodeInfoByTitle.set(titleKey, info);
  }

  const edgeKeys = new Set(
    edges.map((edge) => `${edge.source}::${edge.target}::${edge.relation}`)
  );

  let newBelongsToEdges = 0;
  let newLinkEdges = 0;

  function addEdge(source, target, relation, strength, notes) {
    if (!source || !target || source === target) {
      return false;
    }

    const key = `${source}::${target}::${relation}`;
    if (edgeKeys.has(key)) {
      return false;
    }

    edgeKeys.add(key);
    edges.push({
      source,
      target,
      relation,
      strength,
      notes
    });

    return true;
  }

  for (const info of nodeInfoByTitle.values()) {
    if (!info.isNew) {
      continue;
    }

    if (info.type === "tradition") {
      continue;
    }

    if (!traditionIds.has(info.tradition)) {
      continue;
    }

    const added = addEdge(
      info.id,
      info.tradition,
      "belongs_to",
      0.95,
      "Inferred from Wikipedia crawl tradition assignment."
    );

    if (added) {
      newBelongsToEdges += 1;
    }
  }

  for (const record of crawlRecords) {
    if (newLinkEdges >= options.maxLinkEdges) {
      break;
    }

    const sourceInfo = nodeInfoByTitle.get(normalizeLookupKey(record.title));
    if (!sourceInfo) {
      continue;
    }

    let addedForSource = 0;
    const uniqueLinks = Array.from(new Set(record.links));

    for (const linkedTitle of uniqueLinks) {
      if (newLinkEdges >= options.maxLinkEdges || addedForSource >= options.maxGraphLinksPerNode) {
        break;
      }

      const targetInfo = nodeInfoByTitle.get(normalizeLookupKey(linkedTitle));
      if (!targetInfo || targetInfo.id === sourceInfo.id) {
        continue;
      }

      const relation = chooseRelation(sourceInfo.type, targetInfo.type);

      if (
        relation === "influenced" &&
        sourceInfo.type === "text" &&
        targetInfo.type === "text"
      ) {
        continue;
      }

      const added = addEdge(
        sourceInfo.id,
        targetInfo.id,
        relation,
        relation === "shares_concept" ? 0.5 : 0.35,
        `Inferred from Wikipedia hyperlink graph: ${record.title} -> ${linkedTitle}.`
      );

      if (added) {
        newLinkEdges += 1;
        addedForSource += 1;
      }
    }
  }

  await writeJson(path.join(dataDir, NODE_FILES.tradition), nodeBuckets.tradition);
  await writeJson(path.join(dataDir, NODE_FILES.school), nodeBuckets.school);
  await writeJson(path.join(dataDir, NODE_FILES.person), nodeBuckets.person);
  await writeJson(path.join(dataDir, NODE_FILES.concept), nodeBuckets.concept);
  await writeJson(path.join(dataDir, NODE_FILES.text), nodeBuckets.text);
  await writeJson(path.join(dataDir, EDGE_FILE), edges);

  const totals = {
    nodes: {
      tradition: nodeBuckets.tradition.length,
      school: nodeBuckets.school.length,
      person: nodeBuckets.person.length,
      concept: nodeBuckets.concept.length,
      text: nodeBuckets.text.length,
      all:
        nodeBuckets.tradition.length +
        nodeBuckets.school.length +
        nodeBuckets.person.length +
        nodeBuckets.concept.length +
        nodeBuckets.text.length
    },
    edges: edges.length
  };

  const report = {
    generatedAt: new Date().toISOString(),
    options,
    crawl: crawlResult.progress,
    additions: {
      nodes: {
        tradition: newNodesByType.tradition.length,
        school: newNodesByType.school.length,
        person: newNodesByType.person.length,
        concept: newNodesByType.concept.length,
        text: newNodesByType.text.length,
        all:
          newNodesByType.tradition.length +
          newNodesByType.school.length +
          newNodesByType.person.length +
          newNodesByType.concept.length +
          newNodesByType.text.length
      },
      edges: {
        belongs_to: newBelongsToEdges,
        hyperlink_inferred: newLinkEdges,
        all: newBelongsToEdges + newLinkEdges
      }
    },
    totals
  };

  await writeJson(path.join(dataDir, REPORT_FILE), report);

  return report;
}

async function main() {
  const options = parseArgs(process.argv);
  console.log("[start] Wikipedia ingest with options:");
  console.log(JSON.stringify(options, null, 2));

  const crawlResult = await crawlWikipedia(options);
  const report = await mergeCrawlIntoData(crawlResult, options);

  console.log("[done] Wikipedia ingest complete");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("[error]", error);
  process.exitCode = 1;
});
