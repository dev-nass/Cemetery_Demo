import { route } from "ziggy-js";
import { storePlot } from "./maps/actions.js";
import {
    handleDrawEvent,
    handleDeleteEvent,
    handleEditEvent,
} from "./maps/handlers.js";
import { mapState } from "./maps/state.js";

let sectionGeoJson = {}; // Loaded from server-side blade
let plotGeoJson = {}; // Loaded from server-side blade

const MIN_RENDER_ZOOM = 20;
const RENDER_DEBOUNCE_MS = 150;

// Helper functions
function getPlotStyle(feature) {
    const colors = {
        available: "#90EE90",
        occupied: "#FFB6C6",
        reserved: "#FFE66D",
    };

    return {
        fillColor: colors[feature.properties.status] || "#CCCCCC",
        weight: 1,
        color: "white",
        fillOpacity: 0.7,
    };
}

function attachPlotPopup(feature, layer) {
    // Wait for layer to be added to map before creating popup
    layer.on("add", function () {
        const layerId = layer._leaflet_id;

        const popupContent = `
            <strong>Plot: ${feature.properties.plot_id}</strong><br>
            Section: ${feature.properties.section_id}<br>
            Status: ${feature.properties.status}<br>
            Area: ${feature.properties.area_sqm} sq.m<br>
            <button onclick="selectPolygonForEditing(${layerId})" 
                    class="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                Edit This Plot
            </button>
        `;

        layer.bindPopup(popupContent);

        // Bind a permanent tooltip (label) showing the plot id
        if (feature.properties?.plot_id) {
            layer.bindTooltip(String(feature.properties.plot_id), {
                permanent: true,
                direction: "center",
                className: "plot-label",
                interactive: false,
            });
        }
    });

    // Click handler to select for editing (alternative to button)
    layer.on("click", function (e) {
        if (e.originalEvent.shiftKey) {
            // Hold Shift + Click to edit
            selectPolygonForEditing(layer);
            L.DomEvent.stopPropagation(e);
        }
    });
}

function selectPolygonForEditing(layerOrId) {
    let layer;

    // Handle both layer object and leaflet_id string/number
    if (typeof layerOrId === "string" || typeof layerOrId === "number") {
        const id = parseInt(layerOrId);

        // Search in allPlotsLayer
        mapState.allPlotsLayer.eachLayer((l) => {
            if (l._leaflet_id === id) {
                layer = l;
            }
        });
    } else {
        layer = layerOrId;
    }

    if (!layer) {
        console.error("Layer not found for id:", layerOrId);
        return;
    }

    // Clear previous selection
    mapState.editableLayers.clearLayers();

    // Get the GeoJSON data
    const geojson = layer.toGeoJSON();

    // Create editable layer with styling
    const editableFeatureGroup = L.geoJSON(geojson, {
        style: {
            fillColor: geojson.properties?.status
                ? {
                      available: "#90EE90",
                      occupied: "#FFB6C6",
                      reserved: "#FFE66D",
                  }[geojson.properties.status] || "#CCCCCC"
                : "#CCCCCC",
            color: "#FFD700", // Gold border to show it's selected
            weight: 3,
            fillOpacity: 0.7,
        },
    });

    // Add each layer from the GeoJSON to editableLayers
    editableFeatureGroup.eachLayer((l) => {
        mapState.editableLayers.addLayer(l);
    });

    console.log(`Plot ${geojson.properties?.plot_id} selected for editing`);

    // Close the original layer's popup
    layer.closePopup();
}

// Make function globally accessible for button onclick
window.selectPolygonForEditing = selectPolygonForEditing;

function initializeMap() {
    mapState.map = L.map("map", {
        renderer: L.canvas(),
        preferCanvas: true,
    }).setView([14.3052681, 120.9758], 18);

    L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
        maxZoom: 30,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(mapState.map);

    // Inject minimal CSS for tooltip labels so they are readable on polygons
    const styleEl = document.createElement("style");
    styleEl.textContent = `
        .leaflet-tooltip.plot-label {
            background: rgba(255,255,255,0.85);
            border: 1px solid rgba(0,0,0,0.15);
            color: #000;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 3px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }
        /* remove default tooltip pointer for centered labels */
        .leaflet-tooltip.plot-label::after { display: none; }
    `;
    document.head.appendChild(styleEl);

    mapState.editableLayers = new L.FeatureGroup();
    mapState.map.addLayer(mapState.editableLayers);

    // WILL ADDED SOON
    // let sectionLayer = L.geoJSON(sectionGeoJson, {
    //     style: { color: "blue" },
    // });

    // let plotLayer = L.geoJSON(plotGeoJson, {
    //     style: { color: "green" },
    // });

    // sectionLayer.addTo(mapState.map);
    // plotLayer.addTo(mapState.map);

    // L.control.layers(null, overlays, { collapsed: false }).addTo(mapState.map);

    initializeDrawControl();
    handleDrawEvent(mapState.map);
    handleDeleteEvent(mapState.map);
    handleEditEvent(mapState.map);

    // Debounced zoom handler
    let zoomTimeout;
    mapState.map.on("zoomend", () => {
        clearTimeout(zoomTimeout);
        zoomTimeout = setTimeout(updateLayerVisibility, RENDER_DEBOUNCE_MS);
    });

    fetchDBGeoJson();
}

function fetchDBGeoJson() {
    fetch(route("plots.geojson"))
        .then((response) => response.json())
        .then((data) => {
            const processedFeatures = processFeatures(data);
            mapState.DbGeoJsonPlots = processedFeatures;

            // Create the layer ONCE with all data
            if (mapState.allPlotsLayer) {
                mapState.map.removeLayer(mapState.allPlotsLayer);
            }

            mapState.allPlotsLayer = L.geoJSON(processedFeatures, {
                style: getPlotStyle,
                onEachFeature: attachPlotPopup, // Only adds popup, NOT to editableLayers
            });

            // Only add to map if zoom is appropriate
            updateLayerVisibility();

            console.log(`Loaded ${processedFeatures.length} plots`);
        })
        .catch((err) => console.error("Error loading GeoJSON:", err));
}

function processFeatures(data) {
    return data.features
        .map((feature) => {
            if (feature.geometry.type === "MultiPolygon") {
                feature.geometry = {
                    type: "Polygon",
                    coordinates: feature.geometry.coordinates[0],
                };
            }
            return feature;
        })
        .filter(validateFeature);
}

function validateFeature(feature) {
    if (!feature.geometry?.coordinates) return false;

    const coords = feature.geometry.coordinates;

    if (feature.geometry.type === "Polygon") {
        if (!Array.isArray(coords) || !coords[0]) return false;

        return coords[0].every((coord) => {
            if (!Array.isArray(coord) || coord.length < 2) return false;
            const [lng, lat] = coord;
            return (
                typeof lng === "number" &&
                typeof lat === "number" &&
                !isNaN(lng) &&
                !isNaN(lat) &&
                Math.abs(lat) <= 90 &&
                Math.abs(lng) <= 180
            );
        });
    }

    return true;
}

function updateLayerVisibility() {
    const zoom = mapState.map.getZoom();

    if (zoom < MIN_RENDER_ZOOM) {
        if (mapState.map.hasLayer(mapState.allPlotsLayer)) {
            mapState.map.removeLayer(mapState.allPlotsLayer);
            console.log("Plots hidden (zoom too far)");
        }
    } else {
        if (!mapState.map.hasLayer(mapState.allPlotsLayer)) {
            mapState.map.addLayer(mapState.allPlotsLayer);
            console.log("Plots visible");
        }
    }
}

function initializeDrawControl() {
    const drawControl = new L.Control.Draw({
        draw: {
            polygon: true,
            marker: false,
            circle: false,
            rectangle: true,
            polyline: false,
            circlemarker: false,
        },
        edit: {
            featureGroup: mapState.editableLayers,
            remove: true,
            edit: true,
        },
    });

    mapState.map.addControl(drawControl);
}

export function updateSaveButton(enabled) {
    const saveBtn = document.getElementById("save-plot-btn");
    const saveBtnText = document.getElementById("save-plot-text");

    if (saveBtn) {
        if (enabled) {
            saveBtn.classList.remove("opacity-50", "cursor-not-allowed");
            saveBtn.disabled = false;
            if (saveBtnText) {
                saveBtnText.textContent = "Save New Plot to Database";
            }
        } else {
            saveBtn.classList.add("opacity-50", "cursor-not-allowed");
            saveBtn.disabled = true;
            if (saveBtnText) {
                saveBtnText.textContent = "Draw a Plot to Enable Save";
            }
        }
    }
}

export function updateGeoJsonOutput(coordinates) {
    const geojsonOutput = document.getElementById("geojson-output");
    if (geojsonOutput) {
        geojsonOutput.textContent = coordinates
            ? JSON.stringify(coordinates, null, 2)
            : "No polygon drawn yet.";
    }
}

// Global refresh function
window.refreshMap = function () {
    // Clear selection when refreshing
    mapState.editableLayers.clearLayers();

    // Efficient refresh - only update data, don't destroy layers
    fetchDBGeoJson();
    console.log("Map data refreshed");
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializeMap);

// Save button handler
document.getElementById("save-plot-btn")?.addEventListener("click", () => {
    if (mapState.newGeoJsonData) {
        storePlot(mapState.newGeoJsonData);
    }
});
