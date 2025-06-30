import express from "express";
import pool from "../db/pool.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { county } = req.query;

  try {
    const result = county
      ? await pool.query(
          `
        SELECT m.name
        FROM municipality m
        JOIN municipality_county mc ON m.id = mc.municipality_id
        JOIN county c ON mc.county_id = c.id
        WHERE LOWER(c.name) = LOWER($1)
        ORDER BY m.name
      `,
          [county]
        )
      : await pool.query("SELECT name FROM municipality ORDER BY name");

    res.json(result.rows.map((r) => r.name));
  } catch (err) {
    console.error("Error fetching municipalities:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;