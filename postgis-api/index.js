import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { Pool } from "pg";
import multer from "multer";
import fs from "fs";
import path from "path";

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

function toTitleCase(str) {
  return str
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

app.get("/api/counties", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        *, ST_AsGeoJSON(geom)::json AS geometry 
      FROM county
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
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    const rawName = path.basename(originalName).replace(/_VPA.*$/i, "");
    const sanitizedRawName = rawName.replace(/[^a-zA-Z0-9_ ]/g, "");
    const municipalityName = toTitleCase(sanitizedRawName);

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
          insidecore, outsidecore, yearbuiltcat, impvalperacre, dt_easton, developed, geom,
          vpa_decile
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24,
          $25, $26, $27, $28, $29, $30, $31, $32,
          $33, $34, $35, $36, $37, $38,
          ST_SetSRID(ST_GeomFromGeoJSON($39), 4326),
          NULL
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

    await pool.query(`
      UPDATE parcel
      SET vpa_decile = 0
      WHERE municipality_id = $1 AND vpa = 0
    `, [municipalityId]);

    await pool.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (ORDER BY vpa) AS rn,
          COUNT(*) OVER () AS total
        FROM parcel
        WHERE municipality_id = $1 AND vpa > 0
      ),
      deciles AS (
        SELECT
          id,
          CASE
            WHEN rn <= total * 10.0 / 55 THEN 1
            WHEN rn <= total * (10.0 + 9) / 55 THEN 2
            WHEN rn <= total * (10.0 + 9 + 8) / 55 THEN 3
            WHEN rn <= total * (10.0 + 9 + 8 + 7) / 55 THEN 4
            WHEN rn <= total * (10.0 + 9 + 8 + 7 + 6) / 55 THEN 5
            WHEN rn <= total * (10.0 + 9 + 8 + 7 + 6 + 5) / 55 THEN 6
            WHEN rn <= total * (10.0 + 9 + 8 + 7 + 6 + 5 + 4) / 55 THEN 7
            WHEN rn <= total * (10.0 + 9 + 8 + 7 + 6 + 5 + 4 + 3) / 55 THEN 8
            WHEN rn <= total * (10.0 + 9 + 8 + 7 + 6 + 5 + 4 + 3 + 2) / 55 THEN 9
            ELSE 10
          END AS vpa_decile
        FROM ranked
      )
      UPDATE parcel p
      SET vpa_decile = d.vpa_decile
      FROM deciles d
      WHERE p.id = d.id;
    `, [municipalityId]);

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
      SELECT 
        p.id, p.municipality_id, p.objectid, p.mergeid, p.address, p.yearbuilt, p.calc_area, p.u3value, p.vpa,
        p.landvpa, p.txbl_val, p.jurscode, p.acctid, p.city, p.zipcode, p.ownname1, p.ownname2,
        p.landuseu3, p.lu, p.desclu, p.descstyl, p.descbldg, p.nfmlndvl, p.nfmimpvl, p.nfmttlvl,
        p.bldg_story, p.resident, p.merge_, p.new_merge, p.notes, p.downtown, p.fid1, p.cityname,
        p.insidecore, p.outsidecore, p.yearbuiltcat, p.impvalperacre, p.dt_easton, p.developed,
        ST_AsGeoJSON(p.geom)::json AS geometry,
        p.vpa_decile
      FROM parcel p
      JOIN municipality m ON p.municipality_id = m.id
      ${municipality ? `WHERE LOWER(m.name) = LOWER($1)` : ""}
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
    console.error("Error fetching parcels:", error);
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