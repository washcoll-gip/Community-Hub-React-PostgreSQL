import pool from "../db/pool.js";

export const getSLRParcels = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        VPA,
        ST_AsGeoJSON(geom) AS geometry -- convert geometry to GeoJSON string
      FROM slr_parcels
    `);

    const features = rows.map(row => ({
      type: "Feature",
      geometry: JSON.parse(row.geometry),
      properties: {
        id: row.id,
        VPA: row.vpa
      }
    }));

    const geojson = {
      type: "FeatureCollection",
      features: features
    };

    res.json(geojson);
  } catch (err) {
    console.error("Error fetching SLR parcels:", err);
    res.status(500).json({ error: "Failed to load SLR parcels" });
  }
};