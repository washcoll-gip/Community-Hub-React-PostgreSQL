import pool from "../db/pool.js";

export const getFoodAccessPoints = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        objectid,
        user_name,
        user_common_names,
        user_category,
        user_address,
        user_city,
        user_state,
        user_zip,
        user_phone,
        user_website,
        last_edited_date,
        user_latitude,
        user_longitude,
        ST_AsGeoJSON(geometry) as geometry
      FROM food_access_points;
    `);

    const features = result.rows.map(row => ({
      type: "Feature",
      geometry: JSON.parse(row.geometry),
      properties: {
        objectid: row.objectid,
        user_name: row.user_name,
        user_common_names: row.user_common_names,
        user_category: row.user_category,
        user_address: row.user_address,
        user_city: row.user_city,
        user_state: row.user_state,
        user_zip: row.user_zip,
        user_phone: row.user_phone,
        user_website: row.user_website,
        last_edited_date: row.last_edited_date,
        user_latitude: row.user_latitude,
        user_longitude: row.user_longitude,
      }
    }));

    const geojson = {
      type: "FeatureCollection",
      features,
    };

    res.json(geojson);
  } catch (error) {
    console.error("Error fetching food access points:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};