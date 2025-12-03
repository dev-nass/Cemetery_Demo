import { route } from "ziggy-js";

let map;
let drawnItems;
let newGeoJsonData;

document.addEventListener("DOMContentLoaded", function () {
    map = L.map("map").setView([14.3052681, 120.9758], 18);

    // 🗺️ Add Google Satellite Tiles (Layer 1)
    L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
        maxZoom: 30,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(map);

    // ✅ Initialize drawnItems FeatureGroup (Layer 3)
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    fetchDBGeoJson();
    initializeDrawControl();
    handleDrawEvent();
});

const fetchDBGeoJson = () => {
    // 📥 Fetch plots from backend (Laravel route | Layer 2)
    fetch(route("plots.geojson"))
        .then((response) => response.json())
        .then((data) => {
            L.geoJSON(data, {
                style: (feature) => ({
                    fillColor:
                        {
                            available: "#90EE90",
                            occupied: "#FFB6C6",
                            reserved: "#FFE66D",
                        }[feature.properties.status] || "#CCCCCC",
                    weight: 1,
                    color: "white",
                    fillOpacity: 0.7,
                }),
                onEachFeature: (feature, layer) => {
                    layer.bindPopup(`
                        <strong>Plot: ${feature.properties.plot_id}</strong><br>
                        Section: ${feature.properties.section_id}<br>
                        Status: ${feature.properties.status}<br>
                        Area: ${feature.properties.area_sqm} sq.m
                    `);
                },
            }).addTo(map);
        })
        .catch((err) => console.error("Error loading GeoJSON:", err));
};

const initializeDrawControl = () => {
    const drawControl = new L.Control.Draw({
        draw: {
            polygon: true,
            marker: false,
            circle: true,
            rectangle: false,
        },
    });

    map.addControl(drawControl);
};

const handleDrawEvent = () => {
    map.on(L.Draw.Event.CREATED, (e) => {
        const layer = e.layer;
        drawnItems.addLayer(layer);

        // Convert the Leaflet shape to GeoJSON
        const geojson = layer.toGeoJSON();
        newGeoJsonData = geojson;

        // Update the Admin Panel UI
        document.getElementById("geojson-output").textContent = JSON.stringify(
            geojson.geometry.coordinates,
            null,
            2
        );

        // Update the Admin Panel UI
        document
            .getElementById("save-plot-btn")
            .classList.remove("opacity-50", "cursor-not-allowed");
        document.getElementById("save-plot-btn").disabled = false;
        document.getElementById("save-plot-text").textContent =
            "Save New Plot to Database";
    });
};

// // Handle DELETED event (to reset panel if the *last* drawn shape is deleted)
// map.on(L.Draw.Event.DELETED, (e) => {
//     // Check how many layers are left that are NOT the original mock plots
//     // The correct check is if there are only the original mock plots remaining
//     const remainingLayersCount = drawnItems.getLayers().length;
//     const originalMockCount = MOCK_GEOJSON.features.length;

//     if (remainingLayersCount === originalMockCount) {
//         newGeoJsonData = null;
//         document.getElementById("geojson-output").textContent =
//             "No polygon drawn yet.";
//         document
//             .getElementById("save-plot-btn")
//             .classList.add("opacity-50", "cursor-not-allowed");
//         document
//             .getElementById("save-plot-btn")
//             .classList.remove("hover:bg-emerald-600");
//         document.getElementById("save-plot-btn").disabled = true;
//         document.getElementById("save-plot-text").textContent =
//             "Draw a Plot to Enable Save";
//     }
// });

// // Handle the SAVE button click
// document.getElementById("save-plot-btn").addEventListener("click", saveNewPlot);
// // Handle Clear Path button click
// document.getElementById("clear-path-btn").addEventListener("click", clearPath);
