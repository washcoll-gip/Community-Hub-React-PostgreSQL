import dotenv from "dotenv";

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});


const upload = multer({ dest: "uploads/" });

function toCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/[_\s]+(.)/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (_, c) => c.toLowerCase());
}

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    const rawName = path.basename(originalName).split("_")[0];
    const municipalityName = toCamelCase(rawName);

    const raw = fs.readFileSync(filePath);
    const geojson = JSON.parse(raw);

    const muniResult = await pool.query(
      "SELECT id FROM municipality WHERE LOWER(name) = LOWER($1)",
      [municipalityName]
    );

    let municipalityId;
    if (muniResult.rows.length > 0) {
      municipalityId = muniResult.rows[0].id;
    } else {
      const insertResult = await pool.query(
        "INSERT INTO municipality (name) VALUES ($1) RETURNING id",
        [municipalityName]
      );
      municipalityId = insertResult.rows[0].id;
    }

    for (const feature of geojson.features) {
      const geom = JSON.stringify(feature.geometry);
      const props = feature.properties;

      await pool.query(`
        INSERT INTO parcel (
          municipality_id, objectid, mergeid, address, yearbuilt, calc_area, u3value, vpa,
          landvpa, txbl_val, jurscode, acctid, city, zipcode, ownname1, ownname2,
          landuseu3, lu, desclu, descstyl, descbldg, nfmlndvl, nfmimpvl, nfmttlvl,
          bldg_story, resident, merge_, new_merge, notes, downtown, fid1, cityname,
          insidecore, outsidecore, yearbuiltcat, impvalperacre, dt_easton, developed, geom
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24,
          $25, $26, $27, $28, $29, $30, $31, $32,
          $33, $34, $35, $36, $37, $38,
          ST_SetSRID(ST_GeomFromGeoJSON($39), 4326)
        )
      `, [
        municipalityId,
        props.OBJECTID, props.MergeID, props.ADDRESS, props.YearBuilt, props.CALC_AREA, props.U3Value, props.VPA,
        props.LandVPA, props.Txbl_Val, props.JURSCODE, props.ACCTID, props.CITY, props.ZIPCODE, props.OWNNAME1, props.OWNNAME2,
        props.LandUseU3, props.LU, props.DESCLU, props.DESCSTYL, props.DESCBLDG, props.NFMLNDVL, props.NFMIMPVL, props.NFMTTLVL,
        props.BLDG_STORY, props.RESIDENT, props.Merge_, props.New_Merge, props.Notes, props.Downtown, props.FID1, props.CityName,
        props.InsideCore, props.OutsideCore, props.YearBuiltCat, props.ImpValPerAcre, props.DT_Easton, props.developed, geom
      ]);
    }

    fs.unlinkSync(filePath);

    res.status(200).json({
      message: "GeoJSON uploaded and inserted into DB successfully",
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/api/parcels", async (req, res) => {
  try {
    const { municipality } = req.query;

    let baseQuery = `
      WITH filtered_parcels AS (
        SELECT p.*, m.name AS municipality_name
        FROM parcel p
        JOIN municipality m ON p.municipality_id = m.id
        ${municipality ? `WHERE LOWER(m.name) = LOWER($1)` : ""}
      ),
      parcels_with_decile AS (
        SELECT *,
          NTILE(10) OVER (ORDER BY vpa) AS vpa_decile
        FROM filtered_parcels
      )
      SELECT
        id, municipality_id, objectid, mergeid, address, yearbuilt, calc_area, u3value, vpa,
        landvpa, txbl_val, jurscode, acctid, city, zipcode, ownname1, ownname2,
        landuseu3, lu, desclu, descstyl, descbldg, nfmlndvl, nfmimpvl, nfmttlvl,
        bldg_story, resident, merge_, new_merge, notes, downtown, fid1, cityname,
        insidecore, outsidecore, yearbuiltcat, impvalperacre, dt_easton, developed, geom,
        municipality_name, vpa_decile,
        ST_AsGeoJSON(geom)::json AS geometry
      FROM parcels_with_decile
    `;

    const params = municipality ? [municipality] : [];

    const result = await pool.query(baseQuery, params);

    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row) => {
        const { geometry, ...properties } = row;
        return {
          type: "Feature",
          geometry,
          properties,
        };
      }),
    };

    res.json(geojson);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/municipalities", async (req, res) => {
  try {
    const result = await pool.query("SELECT name FROM municipality ORDER BY name");
    res.json(result.rows.map(row => row.name));
  } catch (err) {
    console.error("Error fetching municipalities:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});