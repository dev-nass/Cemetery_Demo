import { updatePlot } from "./actions";
import { mapState } from "./state.js";
import { updateSaveButton, updateGeoJsonOutput } from "../map.js";

export function handleDrawEvent(map) {
    map.on(L.Draw.Event.CREATED, function (e) {
        const layer = e.layer;

        // Add to map immediately for visual feedback
        mapState.editableLayers.addLayer(layer);
        mapState.newlyDrawnLayers.push(layer);

        const geojson = layer.toGeoJSON();
        mapState.newGeoJsonData = geojson;

        updateSaveButton(true);
        updateGeoJsonOutput(geojson.geometry.coordinates);
    });
}

export function handleDeleteEvent(map) {
    map.on(L.Draw.Event.DELETED, function (e) {
        const deletedLayers = e.layers;

        // Check if any newly drawn layers were deleted
        deletedLayers.eachLayer((layer) => {
            const index = mapState.newlyDrawnLayers.indexOf(layer);
            if (index > -1) {
                mapState.newlyDrawnLayers.splice(index, 1);
            }
        });

        // If no newly drawn layers remain, reset the UI
        if (mapState.newlyDrawnLayers.length === 0) {
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

    // Handle Clear Path button click
    // document
    //     .getElementById("clear-path-btn")
    //     .addEventListener("click", clearPath);
}

export function handleEditEvent(map) {
    map.on(L.Draw.Event.EDITED, (e) => {
        e.layers.eachLayer((layer) => {
            const updatedGeoJSON = layer.toGeoJSON();
            const plotId = layer.feature.properties.plot_id;
            updatePlot(plotId, updatedGeoJSON.geometry);
        });
    });
}
