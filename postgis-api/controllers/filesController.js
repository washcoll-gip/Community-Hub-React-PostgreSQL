import fs from "fs";
import path from "path";
import pool from "../db/pool.js";

export const getUploadedFiles = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT filename, upload_type, upload_date FROM uploaded_files ORDER BY upload_date DESC"
    );

    const grouped = {};
    for (const row of result.rows) {
      const type = row.upload_type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push({
        filename: row.filename,
        upload_date: row.upload_date,
      });
    }

    res.json(grouped);
  } catch (err) {
    console.error("Error fetching uploaded files:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const downloadFile = async (req, res) => {
  const { filename } = req.params;

  try {
    const landVpaMatch = filename.match(/^(.+)_VPA\.geojson$/);
    const isLandVpa = !!landVpaMatch;

    if (isLandVpa) {
      const municipality = landVpaMatch[1].replace(/_/g, " ");

      const muniResult = await pool.query(
        `SELECT id FROM municipality WHERE UPPER(name) = UPPER($1)`,
        [municipality]
      );
      if (muniResult.rows.length === 0) {
        return res.status(404).json({ error: `Municipality ${municipality} not found.` });
      }

      const municipalityId = muniResult.rows[0].id;
      const { rows } = await pool.query(`
        SELECT row_to_json(fc)
        FROM (
          SELECT 
            'FeatureCollection' AS type,
            array_to_json(array_agg(f)) AS features
          FROM (
            SELECT 
              'Feature' AS type,
              ST_AsGeoJSON(geom)::json AS geometry,
              to_jsonb(t) - 'geom' AS properties
            FROM (
              SELECT * FROM parcel WHERE municipality_id = $1
            ) AS t
          ) AS f
        ) AS fc
      `, [municipalityId]);

      if (!rows[0]?.row_to_json) {
        return res.status(404).json({ error: `No data found for ${municipality}.` });
      }

      res.setHeader("Content-Type", "application/geo+json");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.send(JSON.stringify(rows[0].row_to_json, null, 2));
      return;
    }

    const foodResult = await pool.query(
      `SELECT row_to_json(fc)
       FROM (
         SELECT 
           'FeatureCollection' AS type,
           array_to_json(array_agg(f)) AS features
         FROM (
           SELECT 
             'Feature' AS type,
             ST_AsGeoJSON(geometry)::json AS geometry,
             to_jsonb(t) - 'geometry' AS properties
           FROM (
             SELECT * FROM food_access_points
           ) AS t
         ) AS f
       ) AS fc`
    );

    if (!foodResult.rows[0]?.row_to_json) {
      return res.status(404).json({ error: "No food access point data found." });
    }

    res.setHeader("Content-Type", "application/geo+json");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(JSON.stringify(foodResult.rows[0].row_to_json, null, 2));
  } catch (err) {
    console.error("Error in downloadFile:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};