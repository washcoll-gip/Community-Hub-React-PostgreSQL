import archiver from "archiver";
import pool from "../db/pool.js";

export const exportData = async (req, res) => {
  const { county, municipality } = req.query;

  try {
    let queries = [];

    if (!county && !municipality) {
      const { rows } = await pool.query(`
        SELECT name, id FROM municipality
      `);
      queries = rows.map(r => ({
        filename: `${r.name.toUpperCase().replace(/ /g, "_")}_VPA.geojson`,
        query: `
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
        `,
        params: [r.id]
      }));
    } else if (county && !municipality) {
      const { rows } = await pool.query(`
        SELECT m.id, m.name
        FROM municipality m
        JOIN municipality_county mc ON m.id = mc.municipality_id
        JOIN county c ON mc.county_id = c.id
        WHERE c.name = $1
      `, [county]);

      if (rows.length === 0) {
        return res.status(404).json({ error: `No municipalities found for county ${county}.` });
      }

      queries = rows.map(r => ({
        filename: `${r.name.toUpperCase().replace(/ /g, "_")}_VPA.geojson`,
        query: `
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
        `,
        params: [r.id]
      }));
    } else if (municipality) {
      const { rows } = await pool.query(
        "SELECT id FROM municipality WHERE LOWER(name) = LOWER($1)",
        [municipality]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: `Municipality ${municipality} not found.` });
      }

      const id = rows[0].id;
      queries.push({
        filename: `${municipality.toUpperCase().replace(/ /g, "_")}_VPA.geojson`,
        query: `
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
        `,
        params: [id]
      });
    }

    if (queries.length === 0) {
      return res.status(404).json({ error: "No data available for export." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=landvpa-export.zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const q of queries) {
      const { rows } = await pool.query(q.query, q.params);
      const geojson = rows[0]?.row_to_json;
      if (geojson) {
        archive.append(JSON.stringify(geojson, null, 2), { name: q.filename });
      }
    }

    archive.finalize();
  } catch (err) {
    console.error("Error generating dynamic export:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const exportFullData = async (req, res) => {
  try {
    const filesToExport = [];

    const muniResult = await pool.query(`SELECT id, name FROM municipality`);
    for (const row of muniResult.rows) {
      const { id, name } = row;
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
      `, [id]);

      if (rows[0]?.row_to_json) {
        const filename = `landvpa/${name.toUpperCase().replace(/ /g, "_")}_VPA.geojson`;
        filesToExport.push({ name: filename, content: JSON.stringify(rows[0].row_to_json, null, 2) });
      }
    }

    const foodResult = await pool.query(`
      SELECT row_to_json(fc)
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
      ) AS fc
    `);

    if (foodResult.rows[0]?.row_to_json) {
      filesToExport.push({
        name: "food-access-points/food_access_points.geojson",
        content: JSON.stringify(foodResult.rows[0].row_to_json, null, 2)
      });
    }

    if (filesToExport.length === 0) {
      return res.status(404).json({ error: "No data available for full export." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=full-data-export.zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    filesToExport.forEach(file => {
      archive.append(file.content, { name: file.name });
    });

    archive.finalize();
  } catch (err) {
    console.error("Error exporting full data:", err);
    res.status(500).json({ error: "Internal server error exporting full data." });
  }
};