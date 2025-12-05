export const mapState = {
    map: null, // use for the base map (layer)
    DbGeoJsonPlots: [], // store DB-fetched plots

    editableLayers: null, // layer that holds single polygon selected for editing
    allPlotsLayer: null, // layer that holds all plots from DB

    newGeoJsonData: null, // data of the newly drawn polygon
    newlyDrawnLayers: [], // holds the newly drawn polygons; not yet saved to DB
};
