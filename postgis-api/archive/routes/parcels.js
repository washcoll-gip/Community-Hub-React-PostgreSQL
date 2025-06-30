import express from "express";
import pool from "../db/pool.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { municipality, county } = req.query;

  try {
    let query = `
      SELECT 
        p.*, ST_AsGeoJSON(p.geom)::json AS geometry
      FROM parcel p
      JOIN municipality m ON p.municipality_id = m.id
    `;

    const params = [];

    if (municipality) {
      query += ` WHERE LOWER(m.name) = LOWER($1)`;
      params.push(municipality);
    } else if (county) {
      query += `
        JOIN municipality_county mc ON m.id = mc.municipality_id
        JOIN county c ON mc.county_id = c.id
        WHERE LOWER(c.name) = LOWER($1)
      `;
      params.push(county);
    } else {
      return res.json({ type: "FeatureCollection", features: [] });
    }

    const result = await pool.query(query, params);

    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map(({ geometry, ...props }) => ({
        type: "Feature",
        geometry,
        properties: props,
      })),
    };

    res.json(geojson);
  } catch (err) {
    console.error("Error fetching parcels:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;