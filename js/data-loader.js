const DATA_FILES = {
  traditions: "data/nodes-traditions.json",
  schools: "data/nodes-schools.json",
  people: "data/nodes-people.json",
  concepts: "data/nodes-concepts.json",
  texts: "data/nodes-texts.json",
  edges: "data/edges.json"
};

export const TRADITION_COLORS = {
  hinduism: "#e07b39",
  buddhism: "#c49a2a",
  islam: "#3a8c72",
  christianity: "#5a7abf",
  judaism: "#9470d0",
  taoism: "#5ca882",
  sikhism: "#d4a030",
  jainism: "#90b060",
  greek_philosophy: "#b87060",
  zoroastrianism: "#d49040",
  synthesis: "#7888a0",
  indigenous: "#9e8a5f",
  concept: "#d4c89a",
  text: "#666680"
};

export const RELATION_COLORS = {
  founded: "#f1efe9",
  influenced: "#86a6f6",
  belongs_to: "#505978",
  shares_concept: "#d4c89a",
  opposed: "#ac4b4b",
  synthesised: "#7eb8b0",
  student_of: "#9ac9bf",
  wrote: "#9a8fcf"
};

const TYPE_LABELS = {
  tradition: "Tradition",
  school: "School",
  person: "Person",
  concept: "Concept",
  text: "Text"
};

const RELATION_LABELS = {
  founded: "Founded",
  influenced: "Influenced",
  belongs_to: "Belongs to",
  shares_concept: "Shared ideas with",
  opposed: "Opposed",
  synthesised: "Synthesised",
  student_of: "Student of",
  wrote: "Wrote"
};

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

function normalizeTradition(node) {
  if (node.type === "tradition") {
    return node.id;
  }
  if (node.type === "concept") {
    return "concept";
  }
  if (node.type === "text") {
    return node.tradition || "text";
  }
  return node.tradition || "synthesis";
}

export function getTraditionColor(tradition) {
  return TRADITION_COLORS[tradition] || "#7888a0";
}

export function getRelationColor(relation) {
  return RELATION_COLORS[relation] || "#55536a";
}

export function getTypeLabel(type) {
  return TYPE_LABELS[type] || type;
}

export function getRelationLabel(relation) {
  return RELATION_LABELS[relation] || relation;
}

export function formatYear(year) {
  if (year === null || year === undefined || Number.isNaN(year)) {
    return "Unknown";
  }
  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  }
  return `${year} CE`;
}

export function formatEra(start, end) {
  const startText = formatYear(start);
  if (end === null || end === undefined) {
    return `${startText} to present`;
  }
  return `${startText} to ${formatYear(end)}`;
}

export function nodeInEra(node, eraStart, eraEnd) {
  const start = node.era_start ?? -3000;
  const end = node.era_end ?? 9999;
  return start <= eraEnd && end >= eraStart;
}

export async function loadGraphData() {
  const [traditions, schools, people, concepts, texts, edgesRaw] = await Promise.all(
    Object.values(DATA_FILES).map((path) => loadJson(path))
  );

  const nodes = [...traditions, ...schools, ...people, ...concepts, ...texts].map((node) => ({
    ...node,
    tradition: normalizeTradition(node)
  }));

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const edges = edgesRaw
    .filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target))
    .map((edge, index) => ({
      ...edge,
      id: edge.id || `${edge.source}-${edge.target}-${edge.relation}-${index}`,
      sourceNode: nodeById.get(edge.source),
      targetNode: nodeById.get(edge.target)
    }));

  const degreeMap = new Map(nodes.map((node) => [node.id, 0]));
  edges.forEach((edge) => {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
  });

  nodes.forEach((node) => {
    node.degree = degreeMap.get(node.id) || 0;
  });

  const allTags = new Set();
  nodes.forEach((node) => {
    (node.tags || []).forEach((tag) => allTags.add(tag));
  });

  return {
    nodes,
    edges,
    nodeById,
    tags: Array.from(allTags).sort((a, b) => a.localeCompare(b)),
    traditions: nodes.filter((node) => node.type === "tradition"),
    concepts: nodes.filter((node) => node.type === "concept"),
    types: ["tradition", "school", "person", "concept", "text"]
  };
}
