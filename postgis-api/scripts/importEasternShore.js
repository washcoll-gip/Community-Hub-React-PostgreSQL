import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pool from "../db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const geojsonPath = path.resolve(__dirname, "../../geojson_archive/Eastern_Shore_Counties.geojson");

const importCounties = async () => {
  if (!fs.existsSync(geojsonPath)) {
    console.warn(`GeoJSON file not found at: ${geojsonPath}`);
    return;
  }

  try {
    const raw = fs.readFileSync(geojsonPath);
    const data = JSON.parse(raw);

    for (const feature of data.features) {
      const props = feature.properties;
      const geom = JSON.stringify(feature.geometry);
      const countyName = props?.COUNTY;

      if (!countyName) continue;

      await pool.query(`
        UPDATE county SET
          district = $1,
          tsd_id = $2,
          objectid = $3,
          county_fip = $4,
          county_num = $5,
          shape_area = $6,
          shape_length = $7,
          geom = ST_SetSRID(ST_GeomFromGeoJSON($8), 4326)
        WHERE name = $9
      `, [
        props?.DISTRICT,
        props?.TSD_ID,
        props?.OBJECTID_1,
        props?.COUNTY_FIP,
        props?.COUNTYNUM,
        props?.Shape__Area,
        props?.Shape__Length,
        geom,
        countyName
      ]);
    }
  } catch (err) {
    console.error("Error importing Eastern Shore counties:", err);
  }
};

export default importCounties;