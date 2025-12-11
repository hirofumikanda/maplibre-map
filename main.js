import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const initialCenter = [139.766966, 35.681163];
const initailZoom = 15;
const map = new maplibregl.Map({
  container: "map",
  zoom: initailZoom,
  hash: true,
  center: initialCenter,
  minZoom: 4,
  maxZoom: 18,
  style: "styles/gsi_std.json",
});

window.map = map;

map.on("load", async () => {
  map.addControl(new maplibregl.NavigationControl());
  map.showTileBoundaries = true;
  map.on("move", () => {
    const center = map.getCenter();
    document.getElementById("fly").value =
      center.lat.toFixed(6) +
      ", " +
      center.lng.toFixed(6) +
      ", " +
      map.getZoom().toFixed(2);
  });
  // === レイヤグループ定義（style.jsonのレイヤIDに合わせて適宜編集） ===
  const styleLayers = map.getStyle().layers;
  const layerGroups = {};
  for (const layer of styleLayers) {
    const sourceLayer = layer["source-layer"];
    const layerId = layer.id;

    if (sourceLayer) {
      if (!layerGroups[sourceLayer]) {
        layerGroups[sourceLayer] = [];
      }
      layerGroups[sourceLayer].push(layerId);
    }
  }

  // === チェックボックスUI生成 ===
  const controlsContainer = document.getElementById("layer-controls");
  for (const [groupName, layerIds] of Object.entries(layerGroups)) {
    const label = document.createElement("label");
    label.style.display = "block";
    label.style.marginBottom = "5px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.id = `toggle-${groupName}`;
    checkbox.dataset.group = groupName;

    const span = document.createElement("span");
    span.textContent = `${groupName}`;

    label.appendChild(checkbox);
    label.appendChild(span);
    controlsContainer.appendChild(label);
  }

  // === チェックボックスイベント処理 ===
  controlsContainer.addEventListener("change", (e) => {
    if (e.target.matches("input[type='checkbox']")) {
      const group = e.target.dataset.group;
      const visible = e.target.checked ? "visible" : "none";

      for (const layerId of layerGroups[group]) {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", visible);
        }
      }
    }
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
    const lineFeatures = features.filter(
      (f) => "layer" in f && f.layer.type === "line"
    );
    if (lineFeatures.length > 0) {
      map.getSource("highlight-source-line").setData({
        type: "FeatureCollection",
        features: lineFeatures,
      });
    }
    const fillFeatures = features.filter(
      (f) => "layer" in f && f.layer.type === "fill" && f.layer.id !== "land"
    );
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

// 注記衝突判定
document.getElementById("annotation-overlap-toggle").addEventListener("click", function () {
  // まず1つのsymbolレイヤから現在の設定を取得（なければデフォルト false）
  const layers = map.getStyle().layers.filter((layer) => layer.type === "symbol");
  const currentSetting = layers[0] ? map.getLayoutProperty(layers[0].id, "text-allow-overlap") : false;

  // すべてのsymbolレイヤに対して切り替え
  layers.forEach((layer) => {
    map.setLayoutProperty(layer.id, "text-allow-overlap", !currentSetting);
    map.setLayoutProperty(layer.id, "icon-allow-overlap", !currentSetting);
  });

  // ボタンの表示を更新
  this.textContent = currentSetting ? "注記衝突判定OFF" : "注記衝突判定ON";
});

document.getElementById("fly").value =
  initialCenter[1] + ", " + initialCenter[0] + ", " + initailZoom;

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
