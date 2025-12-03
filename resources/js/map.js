import { route } from "ziggy-js";

let map; // use for the base map (layer)
let DbGeoJsonPlots; // store DB-fetched plots
let editableLayers; // The feature group for edit control
let newGeoJsonData;
let newlyDrawnLayers = []; // Track newly drawn layers

document.addEventListener("DOMContentLoaded", function () {
    initializeMap();
});

const initializeMap = () => {
    map = L.map("map").setView([14.3052681, 120.9758], 18);

    // 🗺️ Add Google Satellite Tiles (Layer 1)
    L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
        maxZoom: 30,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(map);

    // ✅ Initialize editableLayers BEFORE initializing draw control
    editableLayers = new L.FeatureGroup();
    map.addLayer(editableLayers);

    console.log("editableLayers initialized:", editableLayers); // Debug

    // Initialize draw control AFTER editableLayers is created
    initializeDrawControl();

    // Set up event handlers first
    handleDrawEvent();
    handleDeleteEvent();

    // Fetch DB data last
    fetchDBGeoJson();
};

const fetchDBGeoJson = () => {
    // 📥 Fetch plots from backend (Laravel route | Layer 2)
    fetch(route("plots.geojson"))
        .then((response) => response.json())
        .then((data) => {
            DbGeoJsonPlots = data; // <-- store the DB plots here

            // Convert MultiPolygon to Polygon and validate
            const processedFeatures = data.features
                .map((feature) => {
                    // Convert MultiPolygon to Polygon if needed
                    if (feature.geometry.type === "MultiPolygon") {
                        // MultiPolygon: [[[[lng,lat]]]] -> Polygon: [[[lng,lat]]]
                        feature.geometry = {
                            type: "Polygon",
                            coordinates: feature.geometry.coordinates[0],
                        };
                    }
                    return feature;
                })
                .filter((feature) => {
                    // Validate coordinates
                    if (!feature.geometry || !feature.geometry.coordinates) {
                        console.warn("Feature missing coordinates:", feature);
                        return false;
                    }

                    const coords = feature.geometry.coordinates;

                    // For Polygon geometry
                    if (feature.geometry.type === "Polygon") {
                        // Check if coordinates array exists and has valid structure
                        if (
                            !Array.isArray(coords) ||
                            !coords[0] ||
                            !Array.isArray(coords[0])
                        ) {
                            console.warn(
                                "Invalid polygon coordinates:",
                                feature
                            );
                            return false;
                        }

                        // Check each coordinate pair
                        const isValid = coords[0].every((coord) => {
                            if (!Array.isArray(coord) || coord.length < 2) {
                                return false;
                            }
                            const [lng, lat] = coord;
                            // Check if coordinates are valid numbers
                            return (
                                typeof lng === "number" &&
                                typeof lat === "number" &&
                                !isNaN(lng) &&
                                !isNaN(lat) &&
                                lng !== null &&
                                lat !== null &&
                                Math.abs(lat) <= 90 &&
                                Math.abs(lng) <= 180
                            );
                        });

                        if (!isValid) {
                            console.warn("Invalid coordinate values:", feature);
                        }

                        return isValid;
                    }

                    return true;
                });

            console.log(
                `Loaded ${processedFeatures.length} valid features out of ${data.features.length}`
            );

            // Create GeoJSON with processed features
            L.geoJSON(
                { ...data, features: processedFeatures },
                {
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

                        // Add each individual layer to editableLayers
                        if (editableLayers) {
                            editableLayers.addLayer(layer);
                        }
                    },
                }
            );
        })
        .catch((err) => console.error("Error loading GeoJSON:", err));
};

const initializeDrawControl = () => {
    const drawControl = new L.Control.Draw({
        draw: {
            polygon: true,
            marker: false,
            circle: false, // Disable circle to avoid coordinate issues
            rectangle: true,
            polyline: false,
            circlemarker: false,
        },
        edit: {
            featureGroup: editableLayers, // pass a proper FeatureGroup
            remove: true, // enables delete mode
            edit: true, // enables edit mode
        },
    });

    map.addControl(drawControl);
};

const handleDrawEvent = () => {
    map.on(L.Draw.Event.CREATED, function (e) {
        console.log("Draw event fired, editableLayers:", editableLayers); // Debug

        const layer = e.layer;

        // Safety check
        if (!editableLayers) {
            console.error("editableLayers is undefined!");
            return;
        }

        // Add to editableLayers
        editableLayers.addLayer(layer);

        // Track this as a newly drawn layer
        newlyDrawnLayers.push(layer);

        // Convert the Leaflet shape to GeoJSON
        const geojson = layer.toGeoJSON();
        newGeoJsonData = geojson;

        // Update the Admin Panel UI
        const geojsonOutput = document.getElementById("geojson-output");
        if (geojsonOutput) {
            geojsonOutput.textContent = JSON.stringify(
                geojson.geometry.coordinates,
                null,
                2
            );
        }

        // Update the Admin Panel UI
        const saveBtn = document.getElementById("save-plot-btn");
        const saveBtnText = document.getElementById("save-plot-text");

        if (saveBtn) {
            saveBtn.classList.remove("opacity-50", "cursor-not-allowed");
            saveBtn.disabled = false;
        }

        if (saveBtnText) {
            saveBtnText.textContent = "Save New Plot to Database";
        }
    });
};

const handleDeleteEvent = () => {
    map.on(L.Draw.Event.DELETED, function (e) {
        const deletedLayers = e.layers;

        // Check if any newly drawn layers were deleted
        deletedLayers.eachLayer((layer) => {
            const index = newlyDrawnLayers.indexOf(layer);
            if (index > -1) {
                newlyDrawnLayers.splice(index, 1);
            }
        });

        // If no newly drawn layers remain, reset the UI
        if (newlyDrawnLayers.length === 0) {
            newGeoJsonData = null;

            const geojsonOutput = document.getElementById("geojson-output");
            if (geojsonOutput) {
                geojsonOutput.textContent = "No polygon drawn yet.";
            }

            const saveBtn = document.getElementById("save-plot-btn");
            const saveBtnText = document.getElementById("save-plot-text");

            if (saveBtn) {
                saveBtn.classList.add("opacity-50", "cursor-not-allowed");
                saveBtn.classList.remove("hover:bg-emerald-600");
                saveBtn.disabled = true;
            }

            if (saveBtnText) {
                saveBtnText.textContent = "Draw a Plot to Enable Save";
            }
        }
    });

    // Handle the SAVE button click
    // document
    //     .getElementById("save-plot-btn")
    //     .addEventListener("click", saveNewPlot);
    // // Handle Clear Path button click
    // document
    //     .getElementById("clear-path-btn")
    //     .addEventListener("click", clearPath);
};
