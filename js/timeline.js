import { getTraditionColor } from "./data-loader.js";

function hashJitter(text) {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) {
    value = (value * 31 + text.charCodeAt(i)) % 997;
  }
  return (value % 13) - 6;
}

function pickLane(lanes, x, minGap, maxLanes) {
  let laneIndex = lanes.findIndex((lastX) => x - lastX > minGap);

  if (laneIndex === -1) {
    if (lanes.length < maxLanes) {
      laneIndex = lanes.length;
    } else {
      laneIndex = lanes.reduce((best, value, index) => (value < lanes[best] ? index : best), 0);
    }
  }

  lanes[laneIndex] = x;
  return laneIndex;
}

export function createTimelineView({ container, onNodeSelect }) {
  let highlightedId = null;
  let latest = {
    nodes: [],
    edges: [],
    showAxial: true,
    showInfluence: false,
    zoom: 1.8
  };
  let lastX = null;
  let nodePositionMap = new Map();
  let wheelBound = false;

  function bindWheelPan() {
    if (wheelBound) {
      return;
    }

    container.addEventListener(
      "wheel",
      (event) => {
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
          container.scrollLeft += event.deltaY;
          event.preventDefault();
        }
      },
      { passive: false }
    );

    wheelBound = true;
  }

  function render({ preserveScroll = true } = {}) {
    const { nodes, edges, showAxial, showInfluence, zoom } = latest;
    const previousScrollLeft = preserveScroll ? container.scrollLeft : 0;

    container.innerHTML = "";
    nodePositionMap = new Map();

    const inner = document.createElement("div");
    inner.className = "timeline-inner";
    container.appendChild(inner);

    const traditionNodes = nodes
      .filter((node) => node.type === "tradition")
      .sort((a, b) => a.label.localeCompare(b.label));

    const bands = traditionNodes.length || 1;
    const width = Math.max(container.clientWidth + 2000, Math.round(4200 * zoom));
    const height = Math.max(640, 180 + bands * 92);

    const svg = d3
      .select(inner)
      .append("svg")
      .attr("class", "timeline-svg")
      .attr("width", width)
      .attr("height", height);

    const xScale = d3.scaleLinear().domain([-3000, 2026]).range([130, width - 90]);
    const yBand = d3
      .scaleBand()
      .domain(traditionNodes.map((node) => node.id))
      .range([96, height - 70])
      .paddingInner(0.2);

    lastX = xScale;

    const axis = d3
      .axisTop(xScale)
      .tickValues([-3000, -2000, -1000, -800, -200, 0, 500, 1000, 1500, 1800, 2000, 2026])
      .tickFormat((value) => (value < 0 ? `${Math.abs(value)} BCE` : `${value} CE`));

    svg.append("g").attr("class", "timeline-axis").attr("transform", "translate(0,56)").call(axis);

    traditionNodes.forEach((tradition) => {
      const y = yBand(tradition.id);
      const h = yBand.bandwidth();

      svg
        .append("rect")
        .attr("x", 122)
        .attr("y", y)
        .attr("width", width - 210)
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
        .attr("y", 64)
        .attr("width", endX - startX)
        .attr("height", height - 126)
        .attr("rx", 8);

      svg
        .append("text")
        .attr("class", "axial-label")
        .attr("x", startX + 10)
        .attr("y", 80)
        .text("Axial Age: 800–200 BCE");
    }

    const personNodes = nodes
      .filter(
        (node) =>
          node.type === "person" && Number.isFinite(node.era_start) && yBand.domain().includes(node.tradition)
      )
      .sort((a, b) => a.era_start - b.era_start);

    const personGroup = svg.append("g");
    const lanesByTradition = new Map();
    const maxLanesPerBand = Math.max(3, Math.min(8, Math.floor((yBand.bandwidth() - 16) / 10)));

    personNodes.forEach((person) => {
      const x = xScale(person.era_start);
      const lanes = lanesByTradition.get(person.tradition) || [];
      const laneIndex = pickLane(lanes, x, 50, maxLanesPerBand);
      lanesByTradition.set(person.tradition, lanes);

      const laneCenter = (maxLanesPerBand - 1) / 2;
      const laneOffset = (laneIndex - laneCenter) * 9;
      const yCenter =
        yBand(person.tradition) + yBand.bandwidth() / 2 + laneOffset + hashJitter(person.id) * 0.35;

      const g = personGroup
        .append("g")
        .attr("class", "timeline-person")
        .attr("transform", `translate(${x},${yCenter})`)
        .on("click", () => onNodeSelect(person.id, { sourceView: "timeline", skipFocus: true }));

      g.append("circle").attr("r", 4).attr("fill", getTraditionColor(person.tradition));
      g.append("text")
        .attr("class", "timeline-person-label")
        .attr("x", 6)
        .attr("y", -6)
        .text(person.label);

      if (person.id === highlightedId) {
        g.append("circle")
          .attr("r", 8.2)
          .attr("fill", "none")
          .attr("stroke", "#f2f0eb")
          .attr("stroke-width", 1.2);
      }

      nodePositionMap.set(person.id, { x, y: yCenter });
    });

    const conceptNodes = nodes
      .filter((node) => node.type === "concept" && Number.isFinite(node.era_start))
      .sort((a, b) => a.era_start - b.era_start);

    const conceptGroup = svg.append("g");
    const conceptRows = Array.from({ length: 6 }, () => -Infinity);

    conceptNodes.forEach((concept) => {
      const x = xScale(concept.era_start);
      let rowIndex = conceptRows.findIndex((lastX) => x - lastX > 140);

      if (rowIndex === -1) {
        rowIndex = conceptRows.reduce((best, value, index) => (value < conceptRows[best] ? index : best), 0);
      }

      conceptRows[rowIndex] = x;
      const y = 20 + rowIndex * 18;

      const g = conceptGroup
        .append("g")
        .attr("class", "timeline-concept")
        .attr("transform", `translate(${x},${y})`)
        .on("click", () => onNodeSelect(concept.id, { sourceView: "timeline", skipFocus: true }));

      g.append("rect")
        .attr("x", -6)
        .attr("y", -9)
        .attr("width", Math.max(72, concept.label.length * 5.8))
        .attr("height", 14)
        .attr("rx", 4);
      g.append("text").attr("x", -2).attr("y", 1).text(concept.label);

      if (concept.id === highlightedId) {
        g.append("rect")
          .attr("x", -8)
          .attr("y", -11)
          .attr("width", Math.max(76, concept.label.length * 5.8 + 4))
          .attr("height", 18)
          .attr("fill", "none")
          .attr("stroke", "#f2f0eb");
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
          const path = `M ${source.x} ${source.y} C ${source.x + curveDepth} ${source.y - curveDepth}, ${
            target.x - curveDepth
          } ${target.y - curveDepth}, ${target.x} ${target.y}`;
          arcGroup.append("path").attr("class", "influence-arc").attr("d", path);
        });
    }

    if (preserveScroll) {
      container.scrollLeft = previousScrollLeft;
    }
  }

  function update({ nodes, edges, showAxial, showInfluence, zoom }) {
    latest = { nodes, edges, showAxial, showInfluence, zoom };
    render({ preserveScroll: true });
  }

  function highlight(nodeId) {
    highlightedId = nodeId;
    if (latest.nodes.length) {
      render({ preserveScroll: true });
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

  bindWheelPan();

  return {
    update,
    highlight,
    focusNode,
    onActivate: () => {
      if (latest.nodes.length) {
        render({ preserveScroll: true });
      }
    }
  };
}
