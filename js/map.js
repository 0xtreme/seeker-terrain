import { getTraditionColor, nodeInEra } from "./data-loader.js";

function hasCoordinates(node) {
  return Number.isFinite(node.origin_lat) && Number.isFinite(node.origin_lng);
}

function markerHtml(color) {
  return `<span style="display:block;width:12px;height:12px;border-radius:50%;background:${color};box-shadow:0 0 0 2px rgba(0,0,0,0.55);"></span>`;
}

export function createMapView({ containerId, onNodeSelect }) {
  const mapElement = document.getElementById(containerId);
  const worldBounds = [
    [-85, -180],
    [85, 180]
  ];

  const map = L.map(mapElement, {
    zoomControl: true,
    minZoom: 2,
    maxZoom: 9,
    worldCopyJump: false,
    maxBounds: worldBounds,
    maxBoundsViscosity: 1
  }).setView([25, 20], 2);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
    subdomains: "abcd",
    maxZoom: 19,
    noWrap: true,
    bounds: worldBounds
  }).addTo(map);

  const markerLayer = L.markerClusterGroup({
    maxClusterRadius: 44,
    spiderfyOnEveryZoom: false,
    showCoverageOnHover: false,
    removeOutsideVisibleBounds: true
  });

  const spreadLayer = L.layerGroup();
  map.addLayer(markerLayer);
  map.addLayer(spreadLayer);

  let markerById = new Map();
  let latest = { nodes: [], edges: [], year: 2026, showSpread: false };

  function updateSpreadLines(nodes) {
    spreadLayer.clearLayers();
    if (!latest.showSpread) {
      return;
    }

    const byId = new Map(nodes.map((node) => [node.id, node]));

    nodes.forEach((node) => {
      if (!["person", "school"].includes(node.type) || !hasCoordinates(node)) {
        return;
      }

      const origin = byId.get(node.tradition);
      if (!origin || !hasCoordinates(origin)) {
        return;
      }

      const samePoint =
        Math.abs(origin.origin_lat - node.origin_lat) < 0.2 &&
        Math.abs(origin.origin_lng - node.origin_lng) < 0.2;

      if (samePoint) {
        return;
      }

      L.polyline(
        [
          [origin.origin_lat, origin.origin_lng],
          [node.origin_lat, node.origin_lng]
        ],
        {
          color: getTraditionColor(node.tradition),
          weight: 1.1,
          opacity: 0.8,
          dashArray: "6 6",
          className: "map-spread-line"
        }
      ).addTo(spreadLayer);
    });
  }

  function update({ nodes, edges, year, showSpread }) {
    latest = { nodes, edges, year, showSpread };
    markerLayer.clearLayers();
    markerById = new Map();

    const visibleNodes = nodes.filter((node) => hasCoordinates(node) && nodeInEra(node, -3000, year));

    visibleNodes.forEach((node) => {
      const marker = L.marker([node.origin_lat, node.origin_lng], {
        icon: L.divIcon({
          className: "map-dot",
          html: markerHtml(getTraditionColor(node.tradition)),
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        })
      });

      marker.bindTooltip(`${node.label}<br/><small>${node.origin_place || "Unknown origin"}</small>`, {
        direction: "top",
        offset: [0, -10],
        className: "map-label"
      });

      marker.on("click", () => {
        onNodeSelect(node.id, { sourceView: "map", skipFocus: true });
      });

      markerLayer.addLayer(marker);
      markerById.set(node.id, marker);
    });

    updateSpreadLines(visibleNodes);
  }

  function focusNode(nodeId) {
    const marker = markerById.get(nodeId);
    if (!marker) {
      return;
    }

    map.setView(marker.getLatLng(), Math.max(4, map.getZoom()), {
      animate: true,
      duration: 0.45
    });

    marker.openTooltip();
  }

  return {
    update,
    focusNode,
    onActivate: () => {
      map.invalidateSize();
    }
  };
}
