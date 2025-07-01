import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { Pool } from "pg";
import multer from "multer";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors({
  origin: "https://es-community-hub.netlify.app/"
}));
app.use(express.json());

dotenv.config();

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
});

const upload = multer({ dest: "uploads/" });

const createTables = async () => {
  const createSQL = `
    CREATE EXTENSION IF NOT EXISTS postgis;

    DROP TABLE IF EXISTS parcel CASCADE;
    DROP TABLE IF EXISTS municipality CASCADE;
    DROP TABLE IF EXISTS county CASCADE;
    DROP TABLE IF EXISTS municipality_county CASCADE;
    DROP TABLE IF EXISTS food_access_points;
    DROP TABLE IF EXISTS uploaded_files;

    CREATE TABLE IF NOT EXISTS county (
      id SERIAL PRIMARY KEY,
      name TEXT,
      district INTEGER,
      tsd_id INTEGER,
      objectid INTEGER,
      county_fip INTEGER,
      county_num INTEGER,
      shape_area DOUBLE PRECISION,
      shape_length DOUBLE PRECISION,
      geom GEOMETRY(MultiPolygon, 4326)
    );

    CREATE TABLE IF NOT EXISTS municipality (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS municipality_county (
      municipality_id INTEGER NOT NULL REFERENCES municipality(id) ON DELETE CASCADE,
      county_id INTEGER NOT NULL REFERENCES county(id) ON DELETE CASCADE,
      PRIMARY KEY (municipality_id, county_id)
    );

    CREATE TABLE IF NOT EXISTS parcel (
        id SERIAL PRIMARY KEY,
        municipality_id INTEGER REFERENCES municipality(id),
        objectid INTEGER,
        mergeid TEXT,
        address TEXT,
        yearbuilt INTEGER,
        calc_area DOUBLE PRECISION,
        u3value INTEGER,
        vpa DOUBLE PRECISION,
        landvpa INTEGER,
        txbl_val INTEGER,
        jurscode TEXT,
        acctid TEXT,
        city TEXT,
        zipcode TEXT,
        ownname1 TEXT,
        ownname2 TEXT,
        landuseu3 TEXT,
        lu TEXT,
        desclu TEXT,
        descstyl TEXT,
        descbldg TEXT,
        nfmlndvl INTEGER,
        nfmimpvl INTEGER,
        nfmttlvl INTEGER,
        bldg_story INTEGER,
        resident INTEGER,
        merge_ TEXT,
        new_merge TEXT,
        notes TEXT,
        downtown TEXT,
        fid1 TEXT,
        cityname TEXT,
        insidecore TEXT,
        outsidecore TEXT,
        yearbuiltcat TEXT,
        impvalperacre DOUBLE PRECISION,
        dt_easton TEXT,
        developed TEXT,
        geom GEOMETRY(MultiPolygon, 4326),
        vpa_decile INTEGER
    );

    CREATE TABLE IF NOT EXISTS food_access_points ( 
        id SERIAL PRIMARY KEY,
        objectid INTEGER,
        user_name TEXT,
        user_common_names TEXT,
        user_category TEXT,
        user_address TEXT,
        user_city TEXT,
        user_state TEXT,
        user_zip TEXT,
        user_phone TEXT,
        user_website TEXT,
        last_edited_date TIMESTAMP,
        user_latitude DOUBLE PRECISION,
        user_longitude DOUBLE PRECISION,
        geometry GEOMETRY(Point, 4326)
    );

    CREATE TABLE IF NOT EXISTS uploaded_files (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      upload_type TEXT NOT NULL,
      upload_date TIMESTAMP DEFAULT NOW()
    );

    INSERT INTO county (name) VALUES 
    ('Caroline'),
    ('Cecil'),
    ('Dorchester'),
    ('Kent'),
    ('Queen Anne''s'),
    ('Somerset'),
    ('Talbot'),
    ('Wicomico'),
    ('Worchester');

    INSERT INTO municipality (name) VALUES 
    ('Barclay'),
    ('Berlin'),
    ('Betterton'),
    ('Brookview'),
    ('Cambridge'),
    ('Centreville'),
    ('Chestertown'),
    ('Church Creek'),
    ('Church Hill'),
    ('Crisfield'),
    ('Delmar'),
    ('Denton'),
    ('East New Market'),
    ('Easton'),
    ('Eldorado'),
    ('Federalsburg'),
    ('Fruitland'),
    ('Galena'),
    ('Galestown'),
    ('Goldsboro'),
    ('Greensboro'),
    ('Hebron'),
    ('Henderson'),
    ('Hillsboro'),
    ('Hurlock'),
    ('Mardela Springs'),
    ('Marydel'),
    ('Millington'),
    ('Ocean City'),
    ('Oxford'),
    ('Pittsville'),
    ('Pocomoke City'),
    ('Preston'),
    ('Princess Anne'),
    ('Queen Anne'),
    ('Queenstown'),
    ('Ridgely'),
    ('Rock Hall'),
    ('Salisbury'),
    ('Secretary'),
    ('Sharptown'),
    ('Snow Hill'),
    ('St Michaels'),
    ('Sudlersville'),
    ('Templeville'),
    ('Trappe'),
    ('Vienna'),
    ('Willards');

    INSERT INTO municipality_county (municipality_id, county_id)
    SELECT m.id, c.id
    FROM municipality m, county c
    WHERE c.name = 'Caroline' AND m.name IN (
      'Denton', 'Federalsburg', 'Goldboro', 'Greensboro',
      'Henderson', 'Hillsboro', 'Marydel', 'Preston',
      'Ridgely', 'Templeville'
    );

    INSERT INTO municipality_county (municipality_id, county_id)
    SELECT m.id, c.id
    FROM municipality m, county c
    WHERE c.name = 'Dorchester' AND m.name IN (
      'Brookview', 'Cambridge', 'Church Creek', 'East New Market',
      'Eldorado', 'Galestown', 'Hurlock', 'Secretary', 'Vienna'
    );

    INSERT INTO municipality_county (municipality_id, county_id)
    SELECT m.id, c.id
    FROM municipality m, county c
    WHERE c.name = 'Kent' AND m.name IN (
      'Betterton', 'Chestertown', 'Galena', 'Millington', 'Rock Hall'
    );

    INSERT INTO municipality_county (municipality_id, county_id)
    SELECT m.id, c.id
    FROM municipality m, county c
    WHERE c.name = 'Queen Anne''s' AND m.name IN (
      'Barclay', 'Centreville', 'Church Hill', 'Queen Anne',
      'Queenstown', 'Sudlersville', 'Templeville'
    );

    INSERT INTO municipality_county (municipality_id, county_id)
    SELECT m.id, c.id
    FROM municipality m, county c
    WHERE c.name = 'Somerset' AND m.name IN ('Crisfield', 'Princess Anne');

    INSERT INTO municipality_county (municipality_id, county_id)
    SELECT m.id, c.id
    FROM municipality m, county c
    WHERE c.name = 'Talbot' AND m.name IN (
      'Easton', 'Oxford', 'Queen Anne', 'St Michaels', 'Trappe'
    );

    INSERT INTO municipality_county (municipality_id, county_id)
    SELECT m.id, c.id
    FROM municipality m, county c
    WHERE c.name = 'Wicomico' AND m.name IN (
      'Delmar', 'Fruitland', 'Hebron', 'Mardela Springs',
      'Pittsville', 'Salisbury', 'Sharptown', 'Willards'
    );

    INSERT INTO municipality_county (municipality_id, county_id)
    SELECT m.id, c.id
    FROM municipality m, county c
    WHERE c.name = 'Worchester' AND m.name IN (
      'Berlin', 'Ocean City', 'Pocomoke City', 'Snow Hill'
    );
  `;

  try {
    await pool.query(createSQL);
    console.log('Tables created successfully.');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
};

createTables();

app.get("/api/parcels", async (req, res) => {
  try {
    const { municipality, county } = req.query;

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
    `;
    
    const params = [];

    if (municipality) {
      baseQuery += ` WHERE LOWER(m.name) = LOWER($1)`;
      params.push(municipality);
    } else if (county) {
      baseQuery += `
        JOIN municipality_county mc ON m.id = mc.municipality_id
        JOIN county c ON c.id = mc.county_id
        WHERE LOWER(c.name) = LOWER($1)
      `;
      params.push(county);
    } else {
      return res.json({ type: "FeatureCollection", features: [] });
    }

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
  const { county } = req.query;

  try {
    let result;
    if (county) {
      result = await pool.query(`
        SELECT m.name
        FROM municipality m
        JOIN municipality_county mc ON m.id = mc.municipality_id
        JOIN county c ON mc.county_id = c.id
        WHERE LOWER(c.name) = LOWER($1)
        ORDER BY m.name
      `, [county]);
    } else {
      result = await pool.query("SELECT name FROM municipality ORDER BY name");
    }

    res.json(result.rows.map(row => row.name));
  } catch (err) {
    console.error("Error fetching municipalities:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/counties", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        *, ST_AsGeoJSON(geom)::json AS geometry 
      FROM county
      ORDER BY name ASC
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

app.get("/api/foodaccesspoints", async (req, res) => {
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
});

app.post("/api/upload-foodaccesspoints", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File is required" });
  }

  try {
    const originalName = req.file.originalname;
    const tempPath = req.file.path;

    const targetDir = path.join(__dirname, "uploads", "food-access-points");
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const targetPath = path.join(targetDir, originalName);
    fs.renameSync(tempPath, targetPath);

    await pool.query(`
      INSERT INTO uploaded_files (filename, upload_type)
      VALUES ($1, 'foodaccesspoints')
    `, [originalName]);

    const raw = fs.readFileSync(targetPath);
    const geojson = JSON.parse(raw);

    if (!geojson.features || !Array.isArray(geojson.features)) {
      return res.status(400).json({ error: "Invalid GeoJSON: missing or invalid features array" });
    }

    function cleanProps(obj) {
      const cleaned = {};
      for (const key in obj) {
        cleaned[key] = obj[key] !== undefined ? obj[key] : null;
      }
      return cleaned;
    }

    for (const feature of geojson.features) {
      if (!feature.geometry || !feature.properties) {
        continue;
      }

      const props = cleanProps(feature.properties);
      const geom = JSON.stringify(feature.geometry);

      await pool.query(`
        INSERT INTO food_access_points (
          objectid, user_name, user_common_names, user_category,
          user_address, user_city, user_state, user_zip, user_phone,
          user_website, last_edited_date, user_latitude, user_longitude, geometry
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8, $9,
          $10, $11, $12, $13, ST_SetSRID(ST_GeomFromGeoJSON($14), 4326)
        )
      `, [
        props.OBJECTID,
        props.USER_Name,
        props.USER_Common_Names,
        props.USER_Type,
        props.USER_Street,
        props.USER_City,
        props.USER_State,
        props.USER_Zip_Code,
        props.USER_Phone_Number,
        props.USER_Website_Link,
        props.EditDate,
        feature.geometry.coordinates[1] ?? null,
        feature.geometry.coordinates[0] ?? null,
        geom
      ]);
    }

    res.status(200).json({ message: "Food Access Points uploaded and inserted successfully" });
  } catch (err) {
    console.error("Upload foodaccesspoints error:", err);
    res.status(500).json({ error: "Upload foodaccesspoints failed" });
  }
});

app.post("/api/upload-landvpa", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "File is required" });
  }

  try {
    const municipalityRaw = req.body.municipality;
    if (!municipalityRaw) return res.status(400).json({ error: "Municipality is required" });

    const municipalityName = municipalityRaw.trim().toUpperCase().replace(/ /g, "_");

    const tempPath = req.file.path;
    const targetDir = path.join(__dirname, "uploads", "landvpa");
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const targetFileName = `${municipalityName}_VPA.geojson`;
    const targetPath = path.join(targetDir, targetFileName);

    fs.renameSync(tempPath, targetPath);

    await pool.query(`
      INSERT INTO uploaded_files (filename, upload_type)
      VALUES ($1, 'landvpa')
    `, [targetFileName]);

    const raw = fs.readFileSync(targetPath);
    const geojson = JSON.parse(raw);

    if (!geojson.features || !Array.isArray(geojson.features)) {
      return res.status(400).json({ error: "Invalid GeoJSON: missing or invalid features array" });
    }

    const muniResult = await pool.query(
      "SELECT id FROM municipality WHERE LOWER(name) = LOWER($1)",
      [municipalityRaw]
    );

    let municipalityId;
    if (muniResult.rows.length > 0) {
      municipalityId = muniResult.rows[0].id;
    } else {
      const insertResult = await pool.query(
        "INSERT INTO municipality (name) VALUES ($1) RETURNING id",
        [municipalityRaw]
      );
      municipalityId = insertResult.rows[0].id;
    }

    for (const feature of geojson.features) {
      if (!feature.geometry || !feature.properties) {
        console.warn("Skipping invalid feature:", feature);
        continue;
      }

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

    res.status(200).json({ message: `LandVPA for ${municipalityRaw} uploaded and inserted successfully` });
  } catch (err) {
    console.error("Upload landvpa error:", err);
    res.status(500).json({ error: "Upload landvpa failed" });
  }
});

app.get("/api/files", async (req, res) => {
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
});

app.get("/api/files/download/:filename", (req, res) => {
  const filename = req.params.filename;

  const possiblePaths = [
    path.join(__dirname, "uploads", "food-access-points", filename),
    path.join(__dirname, "uploads", "landvpa", filename)
  ];

  let filePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (filePath) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});