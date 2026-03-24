# Spiritus — Spirituality Knowledge Graph
## Developer Spec v1.0

**Project:** Spiritus
**Type:** Static site, GitHub Pages compatible
**Last reviewed:** March 2026
**Review cadence:** Annual (January)
**Maintainer:** Praveen / Easyrun

---

## What This Is

An interactive, public-facing knowledge graph that maps the entire landscape of human spiritual thought across all traditions — religions, mystical schools, philosophical lineages, key figures, core concepts, geography, and timeline — in one explorable visual.

The core thesis: spiritual traditions look separate on the surface but share deep structural connections. A Sufi mystic, a Christian contemplative, and an Advaita Vedantin can be saying essentially the same thing about consciousness. The Stoics and the Buddhists share a near-identical theory of suffering. This graph makes those invisible connections visible.

This is not an encyclopedia. Wikipedia exists. This is a map — you use it to navigate, discover unexpected connections, and go deeper elsewhere.

---

## Tech Stack

- Pure HTML + CSS + Vanilla JS (no framework, no build step, GitHub Pages native)
- D3.js v7 — force-directed graph for main knowledge graph view
- Leaflet.js — geographic origin map view
- Custom CSS timeline — chronological view
- All data in flat JSON files (human-editable, no database)
- No backend, no user accounts, no CMS

---

## Data Model

Everything is either a node or an edge.

### Node Schema

```json
{
  "id": "advaita_vedanta",
  "label": "Advaita Vedanta",
  "type": "school",
  "tradition": "hinduism",
  "era_start": -800,
  "era_end": null,
  "origin_lat": 10.8505,
  "origin_lng": 76.2711,
  "origin_place": "Kerala / South India",
  "summary": "Non-dual school of Vedantic philosophy. Core teaching: Brahman (universal consciousness) and Atman (individual self) are not ultimately separate. The experience of separation is Maya — illusion.",
  "key_texts": ["Brahma Sutras", "Principal Upanishads", "Vivekachudamani"],
  "tags": ["non-dual", "consciousness", "moksha", "maya"],
  "wikipedia": "https://en.wikipedia.org/wiki/Advaita_Vedanta",
  "image": null
}
```

**Node type values:**
| Type | Description |
|---|---|
| `tradition` | Top-level religion or spiritual path |
| `school` | Subdivision, sect, or philosophical school |
| `person` | Historical figure, mystic, philosopher, teacher |
| `concept` | Abstract idea that appears across traditions |
| `text` | Key scripture or foundational text |

### Edge Schema

```json
{
  "source": "adi_shankaracharya",
  "target": "advaita_vedanta",
  "relation": "founded",
  "strength": 1.0,
  "notes": "Consolidated and systematised Advaita in the 8th century CE"
}
```

**Edge relation values:**
| Relation | Meaning |
|---|---|
| `founded` | Person founded school or tradition |
| `influenced` | A influenced B — person/school to person/school |
| `belongs_to` | Person belongs to school or tradition |
| `shares_concept` | Two traditions/people share a core concept |
| `opposed` | Schools with opposing views (also valuable to show) |
| `synthesised` | Person synthesised multiple traditions |
| `student_of` | Direct lineage between people |
| `wrote` | Person wrote a text |

---

## Seed Dataset (v1 Launch Content)

### Traditions

| ID | Label |
|---|---|
| hinduism | Hinduism |
| buddhism | Buddhism |
| islam | Islam |
| christianity | Christianity |
| judaism | Judaism |
| taoism | Taoism |
| jainism | Jainism |
| sikhism | Sikhism |
| zoroastrianism | Zoroastrianism |
| greek_philosophy | Greek Philosophy |
| indigenous | Indigenous / Shamanic |

### Schools

| ID | Label | Parent Tradition |
|---|---|---|
| advaita_vedanta | Advaita Vedanta | hinduism |
| dvaita_vedanta | Dvaita Vedanta | hinduism |
| kashmir_shaivism | Kashmir Shaivism | hinduism |
| tantra | Tantra | hinduism |
| bhakti | Bhakti Movement | hinduism |
| theravada | Theravada | buddhism |
| mahayana | Mahayana | buddhism |
| vajrayana | Vajrayana / Tibetan | buddhism |
| zen | Zen | buddhism |
| sufism | Sufism | islam |
| christian_mysticism | Christian Mysticism | christianity |
| kabbalah | Kabbalah | judaism |
| neoplatonism | Neoplatonism | greek_philosophy |
| stoicism | Stoicism | greek_philosophy |
| perennial_philosophy | Perennial Philosophy | synthesis |
| integral | Integral Philosophy | synthesis |

### People (Seed — 30 figures)

| ID | Label | Tradition | Era | Origin |
|---|---|---|---|---|
| adi_shankaracharya | Adi Shankaracharya | hinduism | 788–820 CE | Kerala, India |
| narayana_guru | Sree Narayana Guru | hinduism | 1856–1928 CE | Kerala, India |
| ramana_maharshi | Ramana Maharshi | hinduism | 1879–1950 CE | Tamil Nadu, India |
| ramakrishna | Ramakrishna | hinduism | 1836–1886 CE | West Bengal, India |
| vivekananda | Swami Vivekananda | hinduism | 1863–1902 CE | West Bengal, India |
| aurobindo | Sri Aurobindo | hinduism | 1872–1950 CE | West Bengal, India |
| nagarjuna | Nagarjuna | buddhism | ~150–250 CE | South India |
| bodhidharma | Bodhidharma | buddhism | ~5th–6th CE | India / China |
| milarepa | Milarepa | buddhism | 1052–1135 CE | Tibet |
| buddha | Siddhartha Gautama | buddhism | ~563–483 BCE | Nepal/India |
| rumi | Rumi | islam/sufism | 1207–1273 CE | Persia/Turkey |
| ibn_arabi | Ibn Arabi | islam/sufism | 1165–1240 CE | Andalusia/Syria |
| al_ghazali | Al-Ghazali | islam | 1058–1111 CE | Persia |
| rabi_al_adawiyya | Rabi'a al-Adawiyya | islam/sufism | ~714–801 CE | Basra, Iraq |
| meister_eckhart | Meister Eckhart | christianity | 1260–1328 CE | Germany |
| teresa_of_avila | Teresa of Avila | christianity | 1515–1582 CE | Spain |
| plotinus | Plotinus | neoplatonism | 204–270 CE | Egypt/Rome |
| socrates | Socrates | greek_philosophy | 470–399 BCE | Athens, Greece |
| pythagoras | Pythagoras | greek_philosophy | ~570–495 BCE | Samos, Greece |
| laozi | Laozi | taoism | ~600 BCE | China |
| zhuangzi | Zhuangzi | taoism | ~369–286 BCE | China |
| mahavira | Mahavira | jainism | ~599–527 BCE | Bihar, India |
| guru_nanak | Guru Nanak | sikhism | 1469–1539 CE | Punjab, India |
| kabir | Kabir | hinduism/islam | 1440–1518 CE | Varanasi, India |
| baal_shem_tov | Baal Shem Tov | judaism/kabbalah | 1698–1760 CE | Ukraine |
| maimonides | Maimonides | judaism | 1138–1204 CE | Spain/Egypt |
| krishnamurti | J. Krishnamurti | synthesis | 1895–1986 CE | Andhra Pradesh, India |
| alan_watts | Alan Watts | synthesis | 1915–1973 CE | UK/USA |
| ken_wilber | Ken Wilber | integral | 1949– | USA |
| teilhard | Teilhard de Chardin | christianity | 1881–1955 CE | France |

### Concepts (Seed — 20 concepts)

| ID | Label | One-line description |
|---|---|---|
| non_duality | Non-Duality | Subject and object, self and universe, are not ultimately separate |
| impermanence | Impermanence | All phenomena are transient; clinging causes suffering |
| consciousness | Consciousness as Ground | Ultimate reality is pure awareness, not matter |
| ego_dissolution | Ego Dissolution | The false sense of separate self must be released for liberation |
| love_as_path | Love as the Path | Divine love as the primary vehicle for union with the absolute |
| emptiness | Emptiness / Sunyata | All phenomena lack inherent, independent existence |
| via_negativa | Via Negativa | Approaching the absolute by negating all limited attributes |
| moksha | Liberation / Moksha | Freedom from the cycle of birth, death, and conditioned existence |
| fana | Annihilation / Fana | Sufi: dissolution of ego in the divine presence |
| kenosis | Self-Emptying / Kenosis | Christian mysticism: emptying oneself to be filled with God |
| tao | The Tao | The nameless, formless, ungraspable ground of all existence |
| wu_wei | Non-Action / Wu Wei | Effortless action in harmony with the natural order |
| dharma | Dharma | Cosmic order, one's duty, and the nature of reality |
| karma | Karma | The law of intentional action and its fruits across time |
| maya | Maya / Illusion | The phenomenal world mistaken for ultimate reality |
| gnosis | Gnosis | Direct, experiential knowledge of the divine — not belief |
| brahman | Brahman | Universal, infinite, self-luminous consciousness |
| nirvana | Nirvana | Extinguishing of craving and the suffering it causes |
| perennial_core | The Perennial Core | The thesis that all traditions share a common mystical heart |
| axial_breakthrough | The Axial Breakthrough | The simultaneous emergence of individual ethical consciousness ~800–200 BCE |

---

## Four View Modes

Switch via top navigation bar. All views share the same underlying JSON data.

---

### View 1: Graph (Default)

D3.js v7 force-directed network graph.

**Visual encoding:**
- Node size: proportional to number of edges (significance)
- Node colour: by tradition (see colour palette below)
- Node shape: tradition = hexagon, school = rounded square, person = circle, concept = diamond, text = small square
- Edge style: `founded` = thick solid, `influenced` = medium dashed, `student_of` = thin solid, `shares_concept` = coloured dotted, `opposed` = red dashed

**Interactions:**
- Hover: shows label + one-line summary tooltip
- Click node: opens detail panel (slides in from right)
- Drag nodes: repositions in force layout
- Scroll/pinch: zoom
- Search bar (top): fuzzy search, zooms and highlights matching node

**Filter drawer (left, collapsible):**
- Filter by tradition (multi-select checkboxes with colour swatches)
- Filter by node type (tradition / school / person / concept / text)
- Filter by era (range slider: 3000 BCE to present)
- Filter by concept tag

**Killer feature — Tradition Focus mode:**
Select one tradition. All nodes in that tradition stay full opacity. All nodes outside it fade to 15% opacity. But cross-tradition edges (influenced, shares_concept) stay visible at full opacity in their relation colour. This makes the connections out of each tradition impossible to miss.

---

### View 2: Map

Leaflet.js world map showing geographic origin of each person and school.

- Nodes plotted as circles at origin coordinates
- Coloured by tradition
- Clustered at high zoom-out (Leaflet.MarkerCluster)
- Click node: same detail panel as graph view
- Timeline scrubber at bottom: drag to a year, nodes fade in/out based on era
- "Show spread" toggle (v2 feature): animated paths showing how a tradition spread geographically

---

### View 3: Timeline

Horizontal scrollable timeline from 3000 BCE to present.

- Traditions shown as horizontal colour bands
- People plotted as labelled dots on their tradition's band at birth year
- Concepts appear as floating labels at their approximate emergence date
- Hover shows detail panel
- "Axial Age highlight" toggle: shades 800–200 BCE region and labels the simultaneous emergence of Buddha, Mahavira, Laozi, Pythagoras, and the Hebrew prophets
- "Influence arcs" toggle: curved arcs connecting people/schools across tradition bands, showing cross-tradition influence

---

### View 4: Concept Explorer

Not a graph — a structured comparison view.

**How it works:**
1. User picks a concept from a tag cloud or dropdown (e.g. "Non-Duality")
2. Page shows: all traditions that hold this concept, the key figure associated with it in each tradition, the specific term used, and a short quote or teaching

**Layout:** Responsive card grid. One card per tradition. Each card shows:
- Tradition name + colour bar
- Their term for the concept (Advaita, Sunyata, Tawhid/Fana, Kenosis, Ayin, Tao...)
- Key figure
- One representative line from their teaching

**Example — Non-Duality:**

| Hinduism | Buddhism | Sufism | Christian Mysticism | Kabbalah | Taoism |
|---|---|---|---|---|---|
| Advaita | Sunyata | Tawhid / Fana | Unio Mystica | Ayin | Wu Ji |
| Shankaracharya | Nagarjuna | Ibn Arabi | Meister Eckhart | Baal Shem Tov | Laozi |

---

## Detail Panel (shown on click, all views)

Slides in from right. Covers about 35% of viewport width.

```
[Tradition colour accent bar — full width across top]

[Node type badge]    [Era badge]    [Origin badge]

[Name — large, Cinzel font]

[One-paragraph summary in plain English]

[Key concepts: tag chips, clickable to filter graph]

────────────────────────────────────
Connected to:
  Founded →      [linked node names, clickable]
  Influenced →   [linked node names, clickable]
  Student of →   [linked node names, clickable]
  Shared ideas with → [linked node names, clickable]
────────────────────────────────────

Key texts: [list]

[Wikipedia ↗]    [Close ×]
```

---

## Visual Design

### Aesthetic Direction

Dark, cosmic, contemplative. Think: star atlas meets ancient manuscript. Clean typographic hierarchy. Not "spiritual aesthetic" (no lotus gradients, no sacred geometry wallpaper). More like a beautifully designed academic reference in dark mode.

### Colour Palette

```css
/* Base */
--bg:           #0b0b10;
--surface:      #13131c;
--surface-2:    #1a1a26;
--border:       #252535;
--text-1:       #e6e4de;
--text-2:       #8a8899;
--text-3:       #55536a;

/* Tradition colours */
--hinduism:       #e07b39;   /* saffron */
--buddhism:       #c49a2a;   /* gold */
--islam:          #3a8c72;   /* deep green */
--christianity:   #5a7abf;   /* deep blue */
--judaism:        #9470d0;   /* violet */
--taoism:         #5ca882;   /* jade */
--sikhism:        #d4a030;   /* ochre */
--jainism:        #90b060;   /* sage */
--greek:          #b87060;   /* terracotta */
--zoroastrianism: #d49040;   /* amber */
--synthesis:      #7888a0;   /* silver */
--concept:        #d4c89a;   /* parchment */
--text-node:      #666680;   /* muted */
```

### Typography

```css
/* Google Fonts imports */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400&display=swap');

--font-display: 'Cinzel', serif;          /* headings, node labels */
--font-body:    'Source Serif 4', serif;  /* summaries, descriptions */
--font-mono:    'JetBrains Mono', mono;   /* tags, IDs, metadata */
```

### Layout

- Full-screen graph (100vw / 100vh)
- Top bar: 48px — logo left, view switcher centre, search right
- Filter drawer: 280px, slides in from left, default collapsed
- Detail panel: 35% viewport width, slides in from right on node click
- All panels use backdrop-blur + semi-transparent surface background

---

## File Structure

```
/
├── index.html
├── css/
│   ├── main.css
│   ├── graph.css
│   ├── map.css
│   ├── timeline.css
│   └── concept.css
├── js/
│   ├── main.js           (view switching, search, shared state)
│   ├── graph.js          (D3 v7 force graph)
│   ├── map.js            (Leaflet map)
│   ├── timeline.js       (timeline view)
│   ├── concept.js        (concept explorer view)
│   └── data-loader.js    (loads and merges JSON)
├── data/
│   ├── nodes-traditions.json
│   ├── nodes-schools.json
│   ├── nodes-people.json
│   ├── nodes-concepts.json
│   ├── nodes-texts.json
│   └── edges.json
└── assets/
    └── images/           (optional portraits — keep small, lazy load)
```

---

## Content Guidelines for Data Contributors

1. Summary must be one paragraph, plain English. Write for a curious 18-year-old, not an academic.
2. Every person node needs at least 3 edges (belongs_to + at least 2 others).
3. Cross-tradition edges (influenced, shares_concept) are the most valuable content. Actively seek them.
4. Era dates: use integers (CE positive, BCE negative). Use midpoint of known range. Null for living people's end date.
5. Origin coordinates: birth location for people. Place of founding for schools.
6. Concepts: check for existing concept before adding a new one. Link to existing; never duplicate.
7. No theological claims. Record historical and scholarly consensus on influence and connection. The graph does not rank traditions or declare one superior.
8. Contentious connections: add a `notes` field citing the scholarly source.

---

## Cross-Tradition Connections to Highlight (Priority Edges)

These are the connections that will make the graph extraordinary. Build these into the seed dataset.

| Source | Target | Relation | Notes |
|---|---|---|---|
| Plotinus (Neoplatonism) | Sufism | influenced | Neoplatonic emanationism shaped early Islamic mysticism |
| Neoplatonism | Christian Mysticism | influenced | Via Pseudo-Dionysius and Augustine |
| Nagarjuna | Advaita Vedanta | influenced | Shankaracharya's Advaita borrows from Madhyamaka logic |
| Kabir | Sikhism | influenced | Kabir's Sant tradition was major influence on Guru Nanak |
| Rumi | Alan Watts | influenced | Watts translated and popularised Sufi ideas for the West |
| Vedanta | Alan Watts | influenced | Watts synthesised Vedanta, Zen, and Taoism |
| Zen | Alan Watts | influenced | — |
| Ibn Arabi (Wahdat al-Wujud) | Non-Duality concept | shares_concept | Near-identical to Advaita's Brahman |
| Meister Eckhart (Gelassenheit) | Non-Duality concept | shares_concept | "Letting go" = ego dissolution |
| Buddhism | Stoicism | shares_concept | Both teach: suffering from attachment to outcomes |
| Laozi | J. Krishnamurti | influenced | Both teach: the problem is the effort to become |
| Aurobindo | Teilhard de Chardin | shares_concept | Both proposed evolution toward a divine collective consciousness |

---

## Expansion Roadmap

### v1 (~80 nodes, ~120 edges): Launch
Core dataset above. Enough for a compelling, non-trivial graph.

### v2 (~200 nodes): 3 months post-launch
Add: full Zen lineage (Bodhidharma → Huineng → Dogen → ...), Tibetan Buddhist teachers, Gnostic traditions, more Sufi masters, Aboriginal Australian Dreaming, African traditional religions, Shinto, Native American traditions.

### v3 (~500 nodes + AI assist)
Add a submit form where users suggest new nodes. Submissions go into a GitHub Issues queue. Maintainer reviews and merges accepted ones into the JSON files via pull request.

### v4: Community contributions
Full open-source data model. Anyone can submit a PR to the data JSON. Maintainer curates.

### v5: Claude API integration
"Ask Spiritus" — type a question like "How did Sufism influence the Bhakti movement in Kerala?" and a Claude API call answers using the graph data as context. Single API endpoint, no auth required, rate-limited by IP.

---

## Maintenance Guide

**Adding a node:** Edit the relevant JSON file in /data/, follow the schema exactly, push to GitHub. GitHub Pages deploys automatically.

**Annual review checklist (January):**
- Any major scholarly revisions to dates or influence connections?
- New cross-tradition research published?
- Any living figures to add/update?
- Update "Last reviewed" date in footer.

**What never changes:** The core traditions, the major historical figures, the foundational concepts. This data is extremely stable. The only things that change are newly discovered influence connections and occasionally revised dating of ancient figures.

---

## What Makes This Different

| Everything else | Spiritus |
|---|---|
| Text articles, siloed by tradition | Visual graph — relationships are the product |
| No cross-tradition view | Cross-tradition connections are the centrepiece |
| No geographic spread | Map view shows where ideas were born and travelled |
| No parallel timeline | Axial Age and other convergences made visible |
| Academic or religious framing | Plain English, no tradition is privileged |
| No concept comparison | Concept Explorer: same idea, five traditions, side by side |

---

## Disclaimer (shown in footer)

"Spiritus presents historical and scholarly perspectives on spiritual traditions. It is not affiliated with any religion or organisation. It does not make theological claims or rank traditions. Content reviewed: March 2026."
