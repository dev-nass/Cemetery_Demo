import { route } from "ziggy-js";

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
