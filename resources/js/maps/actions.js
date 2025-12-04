import { route } from "ziggy-js";

export async function storePlot(newGeoJsonData) {
    if (!newGeoJsonData) {
        console.error("Cannot save: No GeoJSON data or User ID is available.");
        document.getElementById("save-status").textContent =
            "Error: Cannot save (missing data).";
        document.getElementById("save-status").classList.add("text-red-500");
        return;
    }

    const statusElement = document.getElementById("save-status");
    statusElement.textContent = "Saving...";
    statusElement.classList.remove("text-red-500", "text-green-500");
    statusElement.classList.add("text-yellow-600");

    const newPlotData = {
        section_id: 1,
        geometry: JSON.stringify(newGeoJsonData.geometry),
    };

    fetch(route("plot.store"), {
        method: "POST",
        body: JSON.stringify(newPlotData),
        headers: {
            "Content-type": "application/json; charset=UTF-8",
        },
    })
        .then((res) =>
            res.json().then((data) => ({ status: res.status, body: data }))
        )
        .then((obj) => {
            console.log(obj);

            // 🔥 SUCCESS — now refresh map
            window.refreshMap();
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

export async function updatePlot(plotId, geometry) {
    const payload = {
        plot_id: plotId,
        geometry: JSON.stringify(geometry),
    };

    fetch(route("plot.update"), {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })
        .then((res) => res.json())
        .then((data) => {
            console.log("Plot updated:", data);

            // Refresh map after editing
            window.refreshMap();
        })
        .catch((err) => {
            console.error("Error saving updated plot:", err);
        });
}
