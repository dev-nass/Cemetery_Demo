import { route } from "ziggy-js";
import { storePlot } from "./maps/actions.js";
import {
    handleDrawEvent,
    handleDeleteEvent,
    handleEditEvent,
} from "./maps/handlers.js";
import { mapState } from "./maps/state.js";

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
    layer.bindPopup(`
        <strong>Plot: ${feature.properties.plot_id}</strong><br>
        Section: ${feature.properties.section_id}<br>
        Status: ${feature.properties.status}<br>
        Area: ${feature.properties.area_sqm} sq.m
    `);

    // Add to editableLayers for editing capability
    mapState.editableLayers.addLayer(layer);
}

function initializeMap() {
    mapState.map = L.map("map", {
        renderer: L.canvas(),
        preferCanvas: true,
    }).setView([14.3052681, 120.9758], 18);

    L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
        maxZoom: 30,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(mapState.map);

    mapState.editableLayers = new L.FeatureGroup();
    mapState.map.addLayer(mapState.editableLayers);

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
                onEachFeature: attachPlotPopup,
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

window.refreshMap = function () {
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
