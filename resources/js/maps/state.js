export const mapState = {
    map: null, // use for the base map (layer)
    DbGeoJsonPlots: [], // store DB-fetched plots

    editableLayers: null, // holds the polygons that's avaibale for editing; data from DB + newly drawn
    allPlotsLayer: null, // layer that holds all plots from DB (purpose: not all plots are editable only the available)

    newGeoJsonData: null, // data of the newly drawn polygon
    newlyDrawnLayers: [], // holds the newly drawn polygons; not yet saved to DB
};
