import pool from "../db/pool.js";

export const getCounties = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        *, ST_AsGeoJSON(geom)::json AS geometry 
      FROM county
      ORDER BY name ASC
    `);

    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map(row => {
        const { geometry, geom, ...properties } = row;
        return {
          type: "Feature",
          geometry,
          properties
        };
      })
    };

    res.json(geojson);
  } catch (error) {
    console.error("Error fetching counties:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};