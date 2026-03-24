import { getTraditionColor } from "./data-loader.js";

function firstSentence(text) {
  if (!text) return "";
  const cut = text.split(".")[0]?.trim();
  return cut ? `${cut}.` : text;
}

export function createConceptView({ selectEl, cloudEl, gridEl, onNodeSelect }) {
  let latest = { concepts: [], nodes: [], edges: [], nodeById: new Map() };
  let selectedConceptId = null;

  function getComparisons(concept) {
    if (Array.isArray(concept.comparisons) && concept.comparisons.length) {
      return concept.comparisons
        .map((entry) => {
          const figure = entry.figure_id ? latest.nodeById.get(entry.figure_id) : null;
          return {
            tradition: entry.tradition,
            traditionLabel: entry.tradition_label || latest.nodeById.get(entry.tradition)?.label || entry.tradition,
            term: entry.term || concept.label,
            figureId: entry.figure_id || null,
            figureLabel: figure?.label || entry.figure || "",
            quote: entry.quote || ""
          };
        })
        .sort((a, b) => a.traditionLabel.localeCompare(b.traditionLabel));
    }

    const relationMap = new Map();
    latest.edges
      .filter((edge) => edge.relation === "shares_concept" && (edge.source === concept.id || edge.target === concept.id))
      .forEach((edge) => {
        const otherId = edge.source === concept.id ? edge.target : edge.source;
        const node = latest.nodeById.get(otherId);
        if (!node) {
          return;
        }

        if (!relationMap.has(node.tradition)) {
          relationMap.set(node.tradition, {
            tradition: node.tradition,
            traditionLabel: latest.nodeById.get(node.tradition)?.label || node.tradition,
            term: concept.label,
            figureId: node.type === "person" ? node.id : null,
            figureLabel: node.label,
            quote: edge.notes || firstSentence(node.summary)
          });
        }
      });

    return Array.from(relationMap.values()).sort((a, b) => a.traditionLabel.localeCompare(b.traditionLabel));
  }

  function renderGrid(concept) {
    if (!concept) {
      gridEl.innerHTML = `<p class="concept-empty">No concept selected.</p>`;
      return;
    }

    const comparisons = getComparisons(concept);

    if (!comparisons.length) {
      gridEl.innerHTML = `<p class="concept-empty">No comparison data available for this concept yet.</p>`;
      return;
    }

    gridEl.innerHTML = "";

    comparisons.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "concept-card";

      const bar = document.createElement("div");
      bar.className = "concept-card-bar";
      bar.style.backgroundColor = getTraditionColor(entry.tradition);
      card.appendChild(bar);

      const body = document.createElement("div");
      body.className = "concept-card-body";

      body.innerHTML = `
        <h3>${entry.traditionLabel}</h3>
        <p class="concept-term">${entry.term}</p>
        <p class="concept-figure">${entry.figureLabel || "Figure not set"}</p>
        <p class="concept-quote">${entry.quote || "Representative quote pending."}</p>
      `;

      if (entry.figureId) {
        const button = document.createElement("button");
        button.className = "connection-link";
        button.textContent = "Open figure";
        button.type = "button";
        button.addEventListener("click", () => onNodeSelect(entry.figureId));
        body.appendChild(button);
      }

      card.appendChild(body);
      gridEl.appendChild(card);
    });
  }

  function renderCloud() {
    cloudEl.innerHTML = "";

    latest.concepts.forEach((concept) => {
      const pill = document.createElement("button");
      pill.className = "concept-pill";
      if (concept.id === selectedConceptId) {
        pill.classList.add("active");
      }
      pill.type = "button";
      pill.textContent = concept.label;
      pill.addEventListener("click", () => {
        setSelectedConcept(concept.id);
      });
      cloudEl.appendChild(pill);
    });
  }

  function setSelectedConcept(conceptId) {
    selectedConceptId = conceptId;
    selectEl.value = conceptId || "";
    renderCloud();
    renderGrid(latest.nodeById.get(selectedConceptId));
  }

  function hydrateOptions() {
    selectEl.innerHTML = "";
    latest.concepts.forEach((concept) => {
      const option = document.createElement("option");
      option.value = concept.id;
      option.textContent = concept.label;
      selectEl.appendChild(option);
    });

    if (!selectedConceptId && latest.concepts.length) {
      selectedConceptId = latest.concepts[0].id;
    }

    if (selectedConceptId) {
      selectEl.value = selectedConceptId;
    }

    renderCloud();
    renderGrid(latest.nodeById.get(selectedConceptId));
  }

  selectEl.addEventListener("change", (event) => {
    setSelectedConcept(event.target.value);
  });

  return {
    update({ nodes, edges, concepts, nodeById }) {
      latest = { nodes, edges, concepts, nodeById };

      if (selectedConceptId && !nodeById.has(selectedConceptId)) {
        selectedConceptId = concepts[0]?.id || null;
      }

      hydrateOptions();
    },
    setSelectedConcept,
    onActivate() {
      renderCloud();
    }
  };
}
