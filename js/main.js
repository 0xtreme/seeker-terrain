import {
  formatEra,
  formatYear,
  getRelationLabel,
  getTraditionColor,
  getTypeLabel,
  loadGraphData,
  nodeInEra
} from "./data-loader.js";
import { createGraphView } from "./graph.js";
import { createMapView } from "./map.js";
import { createTimelineView } from "./timeline.js";
import { createConceptView } from "./concept.js";

const state = {
  data: null,
  view: "graph",
  filters: {
    traditions: new Set(),
    types: new Set(["tradition", "school", "person", "concept", "text"]),
    eraStart: -3000,
    eraEnd: 2026,
    tag: "",
    focusTradition: ""
  },
  map: {
    year: 2026,
    showSpread: false
  },
  timeline: {
    showAxial: true,
    showInfluence: false,
    zoom: 1.8
  },
  selectedNodeId: null,
  searchFocusNodeId: null
};

const views = {};

const elements = {
  searchInput: document.getElementById("search-input"),
  searchResults: document.getElementById("search-results"),

  viewButtons: Array.from(document.querySelectorAll(".view-btn")),

  filtersDrawer: document.getElementById("filters-drawer"),
  filtersToggle: document.getElementById("filters-toggle"),
  filtersClose: document.getElementById("filters-close"),

  traditionFilters: document.getElementById("tradition-filters"),
  typeFilters: document.getElementById("type-filters"),
  eraStart: document.getElementById("era-start"),
  eraEnd: document.getElementById("era-end"),
  eraRangeLabel: document.getElementById("era-range-label"),
  tagFilter: document.getElementById("tag-filter"),
  focusTradition: document.getElementById("focus-tradition"),
  filtersReset: document.getElementById("filters-reset"),

  mapYear: document.getElementById("map-year"),
  mapYearLabel: document.getElementById("map-year-label"),
  mapSpreadToggle: document.getElementById("map-spread-toggle"),

  axialToggle: document.getElementById("axial-toggle"),
  influenceToggle: document.getElementById("influence-toggle"),
  timelineZoom: document.getElementById("timeline-zoom"),
  timelineZoomLabel: document.getElementById("timeline-zoom-label"),

  conceptSelect: document.getElementById("concept-select"),
  conceptCloud: document.getElementById("concept-cloud"),
  conceptGrid: document.getElementById("concept-grid"),

  graphReset: document.getElementById("graph-reset"),
  legendTraditions: document.getElementById("legend-traditions"),
  searchFocusBanner: document.getElementById("search-focus-banner"),
  searchFocusLabel: document.getElementById("search-focus-label"),
  searchFocusClear: document.getElementById("search-focus-clear"),

  detailPanel: document.getElementById("detail-panel"),
  detailAccent: document.getElementById("detail-accent"),
  detailType: document.getElementById("detail-type"),
  detailEra: document.getElementById("detail-era"),
  detailOrigin: document.getElementById("detail-origin"),
  detailClose: document.getElementById("detail-close"),
  detailTitle: document.getElementById("detail-title"),
  detailSummary: document.getElementById("detail-summary"),
  detailTags: document.getElementById("detail-tags"),
  detailConnections: document.getElementById("detail-connections"),
  detailTexts: document.getElementById("detail-texts"),
  detailSources: document.getElementById("detail-sources"),
  detailWikipedia: document.getElementById("detail-wikipedia")
};

function setDrawerOpen(open) {
  elements.filtersDrawer.dataset.open = String(open);
}

function setDetailOpen(open) {
  elements.detailPanel.dataset.open = String(open);
}

function isPrimaryTradition(node) {
  return node.type !== "concept" && node.type !== "text";
}

function passesTradition(node, traditions) {
  if (!isPrimaryTradition(node)) {
    return true;
  }

  return traditions.has(node.tradition) || traditions.has(node.id);
}

function computeFilteredData() {
  const data = state.data;
  if (!data) {
    return { nodes: [], edges: [], nodeById: new Map(), concepts: [] };
  }

  const filteredNodes = data.nodes.filter((node) => {
    if (!passesTradition(node, state.filters.traditions)) {
      return false;
    }

    if (!state.filters.types.has(node.type)) {
      return false;
    }

    if (!nodeInEra(node, state.filters.eraStart, state.filters.eraEnd)) {
      return false;
    }

    if (state.filters.tag && !(node.tags || []).includes(state.filters.tag)) {
      return false;
    }

    return true;
  });

  if (state.searchFocusNodeId && data.nodeById.has(state.searchFocusNodeId)) {
    const focusId = state.searchFocusNodeId;
    const focusIds = new Set([focusId]);

    data.edges.forEach((edge) => {
      if (edge.source === focusId) {
        focusIds.add(edge.target);
      }
      if (edge.target === focusId) {
        focusIds.add(edge.source);
      }
    });

    const byId = new Map(filteredNodes.map((node) => [node.id, node]));
    focusIds.forEach((id) => {
      if (!byId.has(id) && data.nodeById.has(id)) {
        byId.set(id, data.nodeById.get(id));
      }
    });

    filteredNodes.length = 0;
    filteredNodes.push(...Array.from(byId.values()).filter((node) => focusIds.has(node.id)));
  }

  const idSet = new Set(filteredNodes.map((node) => node.id));

  const filteredEdges = data.edges.filter((edge) => idSet.has(edge.source) && idSet.has(edge.target));

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    nodeById: new Map(filteredNodes.map((node) => [node.id, node])),
    concepts: filteredNodes.filter((node) => node.type === "concept")
  };
}

function updateMapYearLabel() {
  elements.mapYearLabel.textContent = formatYear(Number(elements.mapYear.value));
}

function updateTimelineZoomLabel() {
  elements.timelineZoomLabel.textContent = `x${Number(state.timeline.zoom).toFixed(1)}`;
}

function updateEraLabel() {
  elements.eraRangeLabel.textContent = `${formatYear(state.filters.eraStart)} to ${formatYear(
    state.filters.eraEnd
  )}`;
}

function updateSearchFocusBanner() {
  if (!state.searchFocusNodeId || !state.data?.nodeById.has(state.searchFocusNodeId)) {
    elements.searchFocusBanner.hidden = true;
    elements.searchFocusLabel.textContent = "";
    return;
  }

  elements.searchFocusBanner.hidden = false;
  elements.searchFocusLabel.textContent = state.data.nodeById.get(state.searchFocusNodeId).label;
}

function populateGraphLegend(data) {
  elements.legendTraditions.innerHTML = "";

  const entries = [
    ...data.traditions.slice().sort((a, b) => a.label.localeCompare(b.label)).map((tradition) => ({
      id: tradition.id,
      label: tradition.label
    })),
    { id: "concept", label: "Concept" },
    { id: "text", label: "Text" }
  ];

  entries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.backgroundColor = getTraditionColor(entry.id);

    const label = document.createElement("span");
    label.textContent = entry.label;

    item.append(swatch, label);
    elements.legendTraditions.appendChild(item);
  });
}

function populateFilterControls(data) {
  const traditions = data.traditions.slice().sort((a, b) => a.label.localeCompare(b.label));

  state.filters.traditions = new Set(traditions.map((tradition) => tradition.id));

  elements.traditionFilters.innerHTML = "";
  traditions.forEach((tradition) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = tradition.id;
    checkbox.checked = true;

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.filters.traditions.add(tradition.id);
      } else {
        state.filters.traditions.delete(tradition.id);
      }
      applyAll();
    });

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.backgroundColor = getTraditionColor(tradition.id);

    label.append(checkbox, swatch, document.createTextNode(tradition.label));
    elements.traditionFilters.appendChild(label);
  });

  elements.typeFilters.innerHTML = "";
  data.types.forEach((type) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = type;
    checkbox.checked = true;

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.filters.types.add(type);
      } else {
        state.filters.types.delete(type);
      }
      applyAll();
    });

    label.append(checkbox, document.createTextNode(getTypeLabel(type)));
    elements.typeFilters.appendChild(label);
  });

  elements.tagFilter.innerHTML = `<option value="">All tags</option>`;
  data.tags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    elements.tagFilter.appendChild(option);
  });

  elements.focusTradition.innerHTML = `<option value="">Off</option>`;
  traditions.forEach((tradition) => {
    const option = document.createElement("option");
    option.value = tradition.id;
    option.textContent = tradition.label;
    elements.focusTradition.appendChild(option);
  });

  updateEraLabel();
  updateMapYearLabel();
  elements.timelineZoom.value = String(state.timeline.zoom);
  updateTimelineZoomLabel();
}

function renderSearchResults(query) {
  const text = query.trim().toLowerCase();
  if (!text) {
    if (state.searchFocusNodeId) {
      state.searchFocusNodeId = null;
      updateSearchFocusBanner();
      applyAll();
    }
    elements.searchResults.hidden = true;
    elements.searchResults.innerHTML = "";
    return;
  }

  const matches = state.data.nodes
    .filter((node) => {
      const haystack = `${node.label} ${node.id} ${node.summary || ""}`.toLowerCase();
      return haystack.includes(text);
    })
    .sort((a, b) => {
      const aStarts = a.label.toLowerCase().startsWith(text) ? 0 : 1;
      const bStarts = b.label.toLowerCase().startsWith(text) ? 0 : 1;
      if (aStarts !== bStarts) {
        return aStarts - bStarts;
      }
      return a.label.localeCompare(b.label);
    })
    .slice(0, 10);

  if (!matches.length) {
    elements.searchResults.hidden = false;
    elements.searchResults.innerHTML = `<div class="search-result">No matches</div>`;
    return;
  }

  elements.searchResults.hidden = false;
  elements.searchResults.innerHTML = "";

  matches.forEach((node) => {
    const button = document.createElement("button");
    button.className = "search-result";
    button.type = "button";
    button.innerHTML = `${node.label}<small>${getTypeLabel(node.type)} • ${formatEra(
      node.era_start,
      node.era_end
    )}</small>`;

    button.addEventListener("click", () => {
      state.searchFocusNodeId = node.id;
      updateSearchFocusBanner();
      applyAll();
      openNode(node.id);
      elements.searchResults.hidden = true;
      elements.searchInput.blur();
    });

    elements.searchResults.appendChild(button);
  });
}

function buildConnections(node) {
  const relationOrder = [
    "founded",
    "influenced",
    "student_of",
    "shares_concept",
    "belongs_to",
    "wrote",
    "synthesised",
    "opposed"
  ];

  const groups = new Map();
  relationOrder.forEach((relation) => groups.set(relation, []));

  state.data.edges.forEach((edge) => {
    if (edge.source !== node.id && edge.target !== node.id) {
      return;
    }

    const relatedId = edge.source === node.id ? edge.target : edge.source;
    const relatedNode = state.data.nodeById.get(relatedId);
    if (!relatedNode) {
      return;
    }

    if (!groups.has(edge.relation)) {
      groups.set(edge.relation, []);
    }

    groups.get(edge.relation).push(relatedNode);
  });

  return relationOrder
    .map((relation) => ({ relation, nodes: groups.get(relation) || [] }))
    .filter((row) => row.nodes.length);
}

function renderDetailPanel(node) {
  elements.detailAccent.style.backgroundColor = getTraditionColor(node.tradition);
  elements.detailType.textContent = getTypeLabel(node.type);
  elements.detailEra.textContent = formatEra(node.era_start, node.era_end);
  elements.detailOrigin.textContent = node.origin_place || "Origin unknown";
  elements.detailTitle.textContent = node.label;
  elements.detailSummary.textContent = node.summary || "No summary available.";

  elements.detailTags.innerHTML = "";
  (node.tags || []).forEach((tag) => {
    const tagButton = document.createElement("button");
    tagButton.type = "button";
    tagButton.className = "chip";
    tagButton.textContent = tag;
    tagButton.addEventListener("click", () => {
      state.filters.tag = tag;
      elements.tagFilter.value = tag;
      applyAll();
    });
    elements.detailTags.appendChild(tagButton);
  });

  elements.detailConnections.innerHTML = "";
  buildConnections(node).forEach((group) => {
    const row = document.createElement("div");
    row.className = "connection-row";

    const title = document.createElement("strong");
    title.textContent = getRelationLabel(group.relation);

    const list = document.createElement("div");
    list.className = "connection-list";

    group.nodes.forEach((related) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "connection-link";
      button.textContent = related.label;
      button.addEventListener("click", () => openNode(related.id));
      list.appendChild(button);
    });

    row.append(title, list);
    elements.detailConnections.appendChild(row);
  });

  elements.detailTexts.innerHTML = "";
  const texts = node.key_texts || [];
  if (!texts.length) {
    const li = document.createElement("li");
    li.textContent = "No key texts listed.";
    elements.detailTexts.appendChild(li);
  } else {
    texts.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      elements.detailTexts.appendChild(li);
    });
  }

  elements.detailSources.innerHTML = "";
  const sources = Array.isArray(node.sources) ? node.sources : [];
  if (!sources.length) {
    const li = document.createElement("li");
    li.textContent = "Source metadata not yet added for this node.";
    elements.detailSources.appendChild(li);
  } else {
    sources.forEach((source) => {
      const li = document.createElement("li");
      if (source.url) {
        const link = document.createElement("a");
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = source.title || source.url;
        li.appendChild(link);
        if (source.note) {
          li.appendChild(document.createTextNode(` — ${source.note}`));
        }
      } else {
        li.textContent = source.title || source.note || "Source";
      }
      elements.detailSources.appendChild(li);
    });
  }

  if (node.wikipedia) {
    elements.detailWikipedia.hidden = false;
    elements.detailWikipedia.href = node.wikipedia;
  } else {
    elements.detailWikipedia.hidden = true;
    elements.detailWikipedia.removeAttribute("href");
  }

  setDetailOpen(true);
}

function openNode(nodeId, options = {}) {
  const node = state.data.nodeById.get(nodeId);
  if (!node) {
    return;
  }

  state.selectedNodeId = nodeId;
  renderDetailPanel(node);

  views.graph.highlight(nodeId);
  views.timeline.highlight(nodeId);

  if (options.skipFocus) {
    return;
  }

  if (state.view === "graph") {
    views.graph.focusNode(nodeId);
  } else if (state.view === "map") {
    views.map.focusNode(nodeId);
  } else if (state.view === "timeline") {
    views.timeline.focusNode(nodeId);
  }
}

function setActiveView(viewName) {
  state.view = viewName;

  elements.viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `view-${viewName}`);
  });

  const targetView = views[viewName];
  if (targetView?.onActivate) {
    targetView.onActivate();
  }

  if (state.selectedNodeId) {
    if (viewName === "graph") {
      views.graph.focusNode(state.selectedNodeId);
    }
    if (viewName === "map") {
      views.map.focusNode(state.selectedNodeId);
    }
    if (viewName === "timeline") {
      views.timeline.focusNode(state.selectedNodeId);
    }
  }
}

function applyAll() {
  updateSearchFocusBanner();
  const filtered = computeFilteredData();

  views.graph.render(filtered);
  views.graph.setFocusTradition(state.filters.focusTradition);

  views.map.update({
    nodes: filtered.nodes,
    edges: filtered.edges,
    year: state.map.year,
    showSpread: state.map.showSpread
  });

  views.timeline.update({
    nodes: filtered.nodes,
    edges: filtered.edges,
    showAxial: state.timeline.showAxial,
    showInfluence: state.timeline.showInfluence,
    zoom: state.timeline.zoom
  });

  const conceptNodes = filtered.concepts.length ? filtered.concepts : state.data.concepts;
  views.concept.update({
    nodes: filtered.nodes,
    edges: filtered.edges,
    concepts: conceptNodes,
    nodeById: state.data.nodeById
  });

  if (state.selectedNodeId && state.data.nodeById.has(state.selectedNodeId)) {
    renderDetailPanel(state.data.nodeById.get(state.selectedNodeId));
  }
}

function resetFilters() {
  const allTraditions = state.data.traditions.map((tradition) => tradition.id);
  state.filters.traditions = new Set(allTraditions);
  state.filters.types = new Set(["tradition", "school", "person", "concept", "text"]);
  state.filters.eraStart = -3000;
  state.filters.eraEnd = 2026;
  state.filters.tag = "";
  state.filters.focusTradition = "";

  elements.traditionFilters.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = true;
  });

  elements.typeFilters.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.checked = true;
  });

  elements.eraStart.value = String(state.filters.eraStart);
  elements.eraEnd.value = String(state.filters.eraEnd);
  elements.tagFilter.value = "";
  elements.focusTradition.value = "";

  updateEraLabel();
  applyAll();
}

function bindEvents() {
  elements.filtersToggle.addEventListener("click", () => {
    setDrawerOpen(elements.filtersDrawer.dataset.open !== "true");
  });

  elements.filtersClose.addEventListener("click", () => setDrawerOpen(false));

  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.view));
  });

  elements.eraStart.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.filters.eraStart = Math.min(value, state.filters.eraEnd);
    elements.eraStart.value = String(state.filters.eraStart);
    updateEraLabel();
    applyAll();
  });

  elements.eraEnd.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.filters.eraEnd = Math.max(value, state.filters.eraStart);
    elements.eraEnd.value = String(state.filters.eraEnd);
    updateEraLabel();
    applyAll();
  });

  elements.tagFilter.addEventListener("change", (event) => {
    state.filters.tag = event.target.value;
    applyAll();
  });

  elements.focusTradition.addEventListener("change", (event) => {
    state.filters.focusTradition = event.target.value;
    applyAll();
  });

  elements.filtersReset.addEventListener("click", resetFilters);

  elements.mapYear.addEventListener("input", (event) => {
    state.map.year = Number(event.target.value);
    updateMapYearLabel();
    applyAll();
  });

  elements.mapSpreadToggle.addEventListener("change", (event) => {
    state.map.showSpread = event.target.checked;
    applyAll();
  });

  elements.axialToggle.addEventListener("change", (event) => {
    state.timeline.showAxial = event.target.checked;
    applyAll();
  });

  elements.influenceToggle.addEventListener("change", (event) => {
    state.timeline.showInfluence = event.target.checked;
    applyAll();
  });

  elements.timelineZoom.addEventListener("input", (event) => {
    state.timeline.zoom = Number(event.target.value);
    updateTimelineZoomLabel();
    applyAll();
  });

  elements.searchInput.addEventListener("input", (event) => {
    renderSearchResults(event.target.value);
  });

  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    const firstResult = elements.searchResults.querySelector("button.search-result");
    if (firstResult) {
      event.preventDefault();
      firstResult.click();
    }
  });

  elements.searchFocusClear.addEventListener("click", () => {
    state.searchFocusNodeId = null;
    elements.searchInput.value = "";
    updateSearchFocusBanner();
    applyAll();
  });

  elements.graphReset.addEventListener("click", () => {
    views.graph.resetView({ reheat: true });
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTypingTarget =
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable);

    if (isTypingTarget || state.view !== "graph") {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "r" || key === "0") {
      event.preventDefault();
      views.graph.resetView({ reheat: true });
    }
  });

  document.addEventListener("click", (event) => {
    if (!elements.searchResults.contains(event.target) && event.target !== elements.searchInput) {
      elements.searchResults.hidden = true;
    }
  });

  elements.detailClose.addEventListener("click", () => {
    setDetailOpen(false);
    state.selectedNodeId = null;
    views.graph.clearHighlight();
    views.timeline.highlight(null);
  });
}

function initViews() {
  views.graph = createGraphView({
    container: document.getElementById("graph-canvas"),
    tooltipEl: document.getElementById("graph-tooltip"),
    onNodeSelect: openNode
  });

  views.map = createMapView({
    containerId: "map-canvas",
    onNodeSelect: openNode
  });

  views.timeline = createTimelineView({
    container: document.getElementById("timeline-canvas"),
    onNodeSelect: openNode
  });

  views.concept = createConceptView({
    selectEl: elements.conceptSelect,
    cloudEl: elements.conceptCloud,
    gridEl: elements.conceptGrid,
    onNodeSelect: openNode
  });
}

async function bootstrap() {
  try {
    state.data = await loadGraphData();
  } catch (error) {
    console.error(error);
    document.body.innerHTML = `<pre style="padding:20px;color:#e07b39;background:#111">Failed to load data: ${error.message}</pre>`;
    return;
  }

  initViews();
  populateFilterControls(state.data);
  populateGraphLegend(state.data);
  bindEvents();
  applyAll();
}

bootstrap();
