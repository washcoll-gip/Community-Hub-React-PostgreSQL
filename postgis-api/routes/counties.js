import express from "express";
import pool from "../db/pool.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *, ST_AsGeoJSON(geom)::json AS geometry 
      FROM county
      ORDER BY name ASC
    `);

    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map(({ geometry, geom, ...props }) => ({
        type: "Feature",
        geometry,
        properties: props,
      })),
    };

    res.json(geojson);
  } catch (err) {
    console.error("Error fetching counties:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;