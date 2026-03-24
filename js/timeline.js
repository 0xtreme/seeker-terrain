import { getTraditionColor } from "./data-loader.js";

function hashJitter(text) {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) {
    value = (value * 31 + text.charCodeAt(i)) % 997;
  }
  return (value % 13) - 6;
}

export function createTimelineView({ container, onNodeSelect }) {
  let highlightedId = null;
  let latest = { nodes: [], edges: [], showAxial: true, showInfluence: false };
  let lastX = null;
  let nodePositionMap = new Map();

  function render() {
    const { nodes, edges, showAxial, showInfluence } = latest;

    container.innerHTML = "";
    nodePositionMap = new Map();

    const inner = document.createElement("div");
    inner.className = "timeline-inner";
    container.appendChild(inner);

    const traditionNodes = nodes.filter((node) => node.type === "tradition").sort((a, b) => a.label.localeCompare(b.label));
    const bands = traditionNodes.length || 1;

    const width = Math.max(container.clientWidth + 1400, 3200);
    const height = Math.max(560, 150 + bands * 72);

    const svg = d3
      .select(inner)
      .append("svg")
      .attr("class", "timeline-svg")
      .attr("width", width)
      .attr("height", height);

    const xScale = d3.scaleLinear().domain([-3000, 2026]).range([120, width - 80]);
    const yBand = d3
      .scaleBand()
      .domain(traditionNodes.map((node) => node.id))
      .range([82, height - 60])
      .paddingInner(0.18);

    lastX = xScale;

    const axis = d3
      .axisTop(xScale)
      .tickValues([-3000, -2000, -1000, -800, -200, 0, 500, 1000, 1500, 2000])
      .tickFormat((value) => (value < 0 ? `${Math.abs(value)} BCE` : `${value} CE`));

    svg.append("g").attr("class", "timeline-axis").attr("transform", "translate(0,54)").call(axis);

    traditionNodes.forEach((tradition) => {
      const y = yBand(tradition.id);
      const h = yBand.bandwidth();

      svg
        .append("rect")
        .attr("x", 112)
        .attr("y", y)
        .attr("width", width - 190)
        .attr("height", h)
        .attr("fill", getTraditionColor(tradition.id))
        .attr("opacity", 0.15)
        .attr("stroke", getTraditionColor(tradition.id))
        .attr("stroke-opacity", 0.34);

      svg
        .append("text")
        .attr("class", "timeline-band-label")
        .attr("x", 12)
        .attr("y", y + h / 2 + 4)
        .text(tradition.label);
    });

    if (showAxial) {
      const startX = xScale(-800);
      const endX = xScale(-200);
      svg
        .append("rect")
        .attr("class", "axial-highlight")
        .attr("x", startX)
        .attr("y", 62)
        .attr("width", endX - startX)
        .attr("height", height - 114)
        .attr("rx", 8);

      svg
        .append("text")
        .attr("class", "axial-label")
        .attr("x", startX + 10)
        .attr("y", 78)
        .text("Axial Age: 800–200 BCE");
    }

    const personNodes = nodes.filter(
      (node) =>
        node.type === "person" &&
        Number.isFinite(node.era_start) &&
        yBand.domain().includes(node.tradition)
    );

    const personGroup = svg.append("g");

    personNodes.forEach((person) => {
      const x = xScale(person.era_start);
      const yCenter = yBand(person.tradition) + yBand.bandwidth() / 2 + hashJitter(person.id);

      const g = personGroup
        .append("g")
        .attr("class", "timeline-person")
        .attr("transform", `translate(${x},${yCenter})`)
        .on("click", () => onNodeSelect(person.id));

      g.append("circle").attr("r", 4).attr("fill", getTraditionColor(person.tradition));
      g.append("text").attr("class", "timeline-person-label").attr("x", 6).attr("y", -6).text(person.label);

      if (person.id === highlightedId) {
        g.append("circle").attr("r", 8.2).attr("fill", "none").attr("stroke", "#f2f0eb").attr("stroke-width", 1.2);
      }

      nodePositionMap.set(person.id, { x, y: yCenter });
    });

    const conceptNodes = nodes
      .filter((node) => node.type === "concept" && Number.isFinite(node.era_start))
      .sort((a, b) => a.era_start - b.era_start);

    const conceptGroup = svg.append("g");

    conceptNodes.forEach((concept, index) => {
      const x = xScale(concept.era_start);
      const y = 28 + (index % 4) * 16;

      const g = conceptGroup
        .append("g")
        .attr("class", "timeline-concept")
        .attr("transform", `translate(${x},${y})`)
        .on("click", () => onNodeSelect(concept.id));

      g.append("rect").attr("x", -6).attr("y", -9).attr("width", Math.max(72, concept.label.length * 5.8)).attr("height", 14).attr("rx", 4);
      g.append("text").attr("x", -2).attr("y", 1).text(concept.label);

      if (concept.id === highlightedId) {
        g.append("rect").attr("x", -8).attr("y", -11).attr("width", Math.max(76, concept.label.length * 5.8 + 4)).attr("height", 18).attr("fill", "none").attr("stroke", "#f2f0eb");
      }

      nodePositionMap.set(concept.id, { x, y });
    });

    if (showInfluence) {
      const validRelations = new Set(["influenced", "student_of", "founded"]);
      const arcGroup = svg.append("g");

      edges
        .filter((edge) => validRelations.has(edge.relation))
        .forEach((edge) => {
          const source = nodePositionMap.get(edge.source);
          const target = nodePositionMap.get(edge.target);
          if (!source || !target) {
            return;
          }

          const curveDepth = Math.max(22, Math.abs(target.x - source.x) * 0.12);
          const path = `M ${source.x} ${source.y} C ${source.x + curveDepth} ${source.y - curveDepth}, ${target.x - curveDepth} ${target.y - curveDepth}, ${target.x} ${target.y}`;
          arcGroup.append("path").attr("class", "influence-arc").attr("d", path);
        });
    }
  }

  function update({ nodes, edges, showAxial, showInfluence }) {
    latest = { nodes, edges, showAxial, showInfluence };
    render();
  }

  function highlight(nodeId) {
    highlightedId = nodeId;
    if (latest.nodes.length) {
      render();
    }
  }

  function focusNode(nodeId) {
    if (!lastX) {
      return;
    }
    const position = nodePositionMap.get(nodeId);
    if (!position) {
      return;
    }

    const targetScrollLeft = Math.max(0, position.x - container.clientWidth / 2);
    container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
  }

  return {
    update,
    highlight,
    focusNode,
    onActivate: () => {
      if (latest.nodes.length) {
        render();
      }
    }
  };
}
