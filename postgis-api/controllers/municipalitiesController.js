import pool from "../db/pool.js";

export const getMunicipalities = async (req, res) => {
  const { county } = req.query;

  try {
    let result;
    if (county) {
      result = await pool.query(`
        SELECT m.*
        FROM municipality m
        JOIN municipality_county mc ON m.id = mc.municipality_id
        JOIN county c ON mc.county_id = c.id
        WHERE LOWER(c.name) = LOWER($1)
        ORDER BY m.id
      `, [county]);
    } else {
      result = await pool.query("SELECT * FROM municipality ORDER BY name");
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching municipalities:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};