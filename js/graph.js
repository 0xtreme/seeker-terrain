import { getRelationColor, getTraditionColor } from "./data-loader.js";

function describeShape(type, size) {
  const s = size;
  if (type === "person") {
    return `M ${-s},0 a ${s},${s} 0 1,0 ${s * 2},0 a ${s},${s} 0 1,0 ${-s * 2},0`;
  }

  if (type === "concept") {
    return `M 0,${-s} L ${s},0 L 0,${s} L ${-s},0 Z`;
  }

  if (type === "text") {
    const q = s * 0.72;
    return `M ${-q},${-q} L ${q},${-q} L ${q},${q} L ${-q},${q} Z`;
  }

  if (type === "tradition") {
    const h = s * 0.92;
    const w = s * 1.03;
    return [
      `M ${-w},0`,
      `L ${-w * 0.5},${-h}`,
      `L ${w * 0.5},${-h}`,
      `L ${w},0`,
      `L ${w * 0.5},${h}`,
      `L ${-w * 0.5},${h}`,
      "Z"
    ].join(" ");
  }

  const width = s * 2.1;
  const height = s * 1.4;
  const radius = s * 0.36;
  const left = -width / 2;
  const top = -height / 2;
  const right = left + width;
  const bottom = top + height;

  return [
    `M ${left + radius},${top}`,
    `L ${right - radius},${top}`,
    `Q ${right},${top} ${right},${top + radius}`,
    `L ${right},${bottom - radius}`,
    `Q ${right},${bottom} ${right - radius},${bottom}`,
    `L ${left + radius},${bottom}`,
    `Q ${left},${bottom} ${left},${bottom - radius}`,
    `L ${left},${top + radius}`,
    `Q ${left},${top} ${left + radius},${top}`,
    "Z"
  ].join(" ");
}

function relationClass(relation) {
  return `relation-${String(relation).replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

export function createGraphView({ container, tooltipEl, onNodeSelect }) {
  const svg = d3
    .select(container)
    .append("svg")
    .attr("class", "graph-svg")
    .attr("aria-label", "Spirituality graph");

  const rootGroup = svg.append("g");
  const linksGroup = rootGroup.append("g");
  const nodesGroup = rootGroup.append("g");

  let width = container.clientWidth || 1280;
  let height = container.clientHeight || 720;

  const linkForce = d3
    .forceLink()
    .id((d) => d.id)
    .distance((edge) => {
      if (edge.relation === "belongs_to") return 55;
      if (edge.relation === "student_of") return 70;
      if (edge.relation === "shares_concept") return 95;
      if (edge.relation === "influenced") return 110;
      return 88;
    })
    .strength((edge) => {
      if (edge.relation === "belongs_to") return 0.55;
      if (edge.relation === "shares_concept") return 0.25;
      return 0.34;
    });

  const simulation = d3
    .forceSimulation()
    .force("link", linkForce)
    .force("charge", d3.forceManyBody().strength(-105))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius((node) => node.radius + 4));

  const zoomBehavior = d3
    .zoom()
    .scaleExtent([0.25, 3.4])
    .on("zoom", (event) => {
      rootGroup.attr("transform", event.transform);
    });

  svg.call(zoomBehavior);

  let linkSelection = linksGroup.selectAll("line");
  let nodeSelection = nodesGroup.selectAll("g");
  let latestData = { nodes: [], edges: [] };
  let highlightedId = null;
  let focusTradition = "";

  function resize() {
    width = container.clientWidth || width;
    height = container.clientHeight || height;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    simulation.force("center", d3.forceCenter(width / 2, height / 2));
  }

  function showTooltip(node, event) {
    const summary = (node.summary || "No summary available.").slice(0, 180);
    tooltipEl.innerHTML = `<strong>${node.label}</strong>${summary}`;
    tooltipEl.hidden = false;
    moveTooltip(event);
  }

  function moveTooltip(event) {
    const offset = 14;
    tooltipEl.style.left = `${event.clientX + offset}px`;
    tooltipEl.style.top = `${event.clientY + offset}px`;
  }

  function hideTooltip() {
    tooltipEl.hidden = true;
  }

  function applyVisibilityStyles() {
    const hasFocus = Boolean(focusTradition);

    const inFocus = (node) => node.tradition === focusTradition || node.id === focusTradition;

    nodeSelection.classed("dimmed", (node) => hasFocus && !inFocus(node));

    linkSelection
      .classed("focus-cross", false)
      .classed("dimmed", false)
      .each(function eachLink(edge) {
        if (!hasFocus) {
          return;
        }

        const sourceIn = inFocus(edge.source);
        const targetIn = inFocus(edge.target);
        const isCross =
          (edge.relation === "influenced" || edge.relation === "shares_concept") &&
          sourceIn !== targetIn &&
          (sourceIn || targetIn);

        if (sourceIn && targetIn) {
          return;
        }

        if (isCross) {
          d3.select(this).classed("focus-cross", true);
          return;
        }

        d3.select(this).classed("dimmed", true);
      });
  }

  function applyHighlight() {
    nodeSelection.classed("highlighted", (node) => node.id === highlightedId);
    if (!highlightedId) {
      return;
    }

    const match = nodeSelection.filter((node) => node.id === highlightedId);
    if (!match.empty()) {
      match.raise();
    }
  }

  function render(data) {
    resize();
    latestData = data;

    const nodes = data.nodes.map((node) => ({ ...node }));
    const edges = data.edges.map((edge) => ({ ...edge }));

    nodes.forEach((node) => {
      node.radius = 6 + Math.min(14, Math.sqrt(node.degree || 1) * 1.8);
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
        node.x = width / 2 + (Math.random() - 0.5) * 120;
        node.y = height / 2 + (Math.random() - 0.5) * 120;
      }
    });

    linkSelection = linkSelection.data(edges, (edge) => edge.id).join((enter) =>
      enter
        .append("line")
        .attr("class", (edge) => `graph-link ${relationClass(edge.relation)}`)
        .attr("stroke", (edge) => getRelationColor(edge.relation))
    );

    nodeSelection = nodeSelection
      .data(nodes, (node) => node.id)
      .join((enter) => {
        const group = enter.append("g").attr("class", "graph-node");
        group
          .append("path")
          .attr("fill", (node) => getTraditionColor(node.tradition))
          .attr("stroke", "rgba(230,228,222,0.22)")
          .attr("stroke-width", 0.9);
        group
          .append("text")
          .attr("class", "graph-node-label")
          .attr("text-anchor", "middle")
          .attr("dy", (node) => -(node.radius + 7))
          .text((node) => node.label);

        group
          .on("mouseenter", function onEnter(event, node) {
            showTooltip(node, event);
          })
          .on("mousemove", function onMove(event) {
            moveTooltip(event);
          })
          .on("mouseleave", hideTooltip)
          .on("click", function onClick(_event, node) {
            onNodeSelect(node.id, { sourceView: "graph", skipFocus: true });
          });

        return group;
      });

    nodeSelection
      .select("path")
      .attr("d", (node) => describeShape(node.type, node.radius))
      .attr("fill", (node) => getTraditionColor(node.tradition));

    nodeSelection
      .select("text")
      .attr("dy", (node) => -(node.radius + 8))
      .attr("opacity", (node) =>
        node.type === "tradition" || node.type === "school" || node.degree > 8 ? 1 : 0.72
      );

    nodeSelection.call(
      d3
        .drag()
        .on("start", (event) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on("drag", (event) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on("end", (event) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
    );

    simulation.nodes(nodes).on("tick", () => {
      linkSelection
        .attr("x1", (edge) => edge.source.x)
        .attr("y1", (edge) => edge.source.y)
        .attr("x2", (edge) => edge.target.x)
        .attr("y2", (edge) => edge.target.y);

      nodeSelection.attr("transform", (node) => `translate(${node.x},${node.y})`);
    });

    linkForce.links(edges);
    for (let i = 0; i < 45; i += 1) {
      simulation.tick();
    }
    simulation.alpha(0.88).restart();

    applyVisibilityStyles();
    applyHighlight();
  }

  function focusNode(nodeId) {
    const node = simulation.nodes().find((item) => item.id === nodeId);
    if (!node) {
      return;
    }

    const scale = 1.35;
    const x = width / 2 - node.x * scale;
    const y = height / 2 - node.y * scale;

    svg
      .transition()
      .duration(520)
      .call(zoomBehavior.transform, d3.zoomIdentity.translate(x, y).scale(scale));
  }

  function highlight(nodeId) {
    highlightedId = nodeId;
    applyHighlight();
  }

  function setFocusTradition(traditionId) {
    focusTradition = traditionId || "";
    applyVisibilityStyles();
  }

  function resetView({ reheat = true } = {}) {
    svg.transition().duration(380).call(zoomBehavior.transform, d3.zoomIdentity);
    if (reheat) {
      simulation.nodes().forEach((node) => {
        node.fx = null;
        node.fy = null;
      });
      simulation.alpha(0.9).restart();
    }
  }

  window.addEventListener("resize", resize);

  return {
    render,
    focusNode,
    highlight,
    setFocusTradition,
    resetView,
    clearHighlight: () => highlight(null),
    onActivate: () => {
      resize();
      if (latestData.nodes.length) {
        simulation.alpha(0.18).restart();
      }
    }
  };
}
