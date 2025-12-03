import { route } from "ziggy-js";

let map;
let drawItems;

document.addEventListener("DOMContentLoaded", function () {
    map = L.map("map").setView([14.3052681, 120.9758], 18);

    // 🗺️ Add Google Satellite Tiles
    L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
        maxZoom: 30,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(map);

    // 📥 Fetch plots from backend (Laravel route)
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

    const drawControl = new L.Control.Draw({});
});
