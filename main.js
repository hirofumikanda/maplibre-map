import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const initialCenter = [139.766966, 35.681163];
const initailZoom = 14;
const map = new maplibregl.Map({
  container: "map",
  zoom: initailZoom,
  hash: true,
  center: initialCenter,
  minZoom: 0,
  maxZoom: 21,
  style: "styles/style.json",
  attributionControl: false,
});

window.map = map;

map.on("load", async () => {
  map.addControl(new maplibregl.NavigationControl());
  map.showTileBoundaries = true;
  map.on("move", () => {
    const center = map.getCenter();
    document.getElementById("fly").value =
      center.lat.toFixed(6) + ", " + center.lng.toFixed(6) + ", " + map.getZoom().toFixed(2);
  });
});

map.on("contextmenu", (e) => {
  const features = map.queryRenderedFeatures(e.point);
  resetHightlightLayers();

  if (features.length > 0) {
    console.log("フィーチャ数：" + features.length);
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      console.log("レイヤーID：" + feature.layer.id);
      console.log("フィーチャID：" + feature.id);
      console.log(JSON.stringify(feature.properties, null, 2));
    }
    const lineFeatures = features.filter((f) => "layer" in f && f.layer.type === "line");
    if (lineFeatures.length > 0) {
      map.getSource("highlight-source-line").setData({
        type: "FeatureCollection",
        features: lineFeatures,
      });
    }
    const fillFeatures = features.filter((f) => "layer" in f && f.layer.type === "fill" && f.layer.id !== "land");
    if (fillFeatures.length > 0) {
      map.getSource("highlight-source-line").setData({
        type: "FeatureCollection",
        features: fillFeatures,
      });
    }
  }
  function resetHightlightLayers() {
    if (map.getSource("highlight-source-line")) {
      map.removeLayer("highlight-layer-line");
      map.removeSource("highlight-source-line");
    }
    map.addSource("highlight-source-line", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
    map.addLayer({
      id: "highlight-layer-line",
      type: "line",
      source: "highlight-source-line",
      paint: {
        "line-color": "rgb(255, 0, 0)",
        "line-width": 2,
        "line-opacity": 0.8,
      },
    });
    if (map.getSource("highlight-source-fill")) {
      map.removeLayer("highlight-layer-fill");
      map.removeSource("highlight-source-fill");
    }
    map.addSource("highlight-source-fill", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
    map.addLayer({
      id: "highlight-layer-fill",
      type: "fill",
      source: "highlight-source-fill",
      paint: {
        "fill-outline-color": "rgb(255, 0, 0)",
      },
    });
  }
});

document.getElementById("fly").value = initialCenter[1] + ", " + initialCenter[0] + ", " + initailZoom;

document.getElementById("fly").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    var coords = document.getElementById("fly").value;
    var pattern = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?,\s\d+(\.\d+)?$/;
    if (pattern.test(coords)) {
      var splittedCoods = coords.split(",");
      map.jumpTo({
        center: [parseFloat(splittedCoods[1]), parseFloat(splittedCoods[0])],
        zoom: parseFloat(splittedCoods[2]),
      });
    }
  }
});
