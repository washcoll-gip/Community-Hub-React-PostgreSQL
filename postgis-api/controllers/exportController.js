import fs from "fs";
import archiver from "archiver";
import pool from "../db/pool.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const LANDVPA_DIR = path.join(UPLOADS_DIR, "landvpa");

export const exportData = async (req, res) => {
  const { county, municipality } = req.query;
  let filesToDownload = [];

  try {
    if (!county && !municipality) {
      if (fs.existsSync(LANDVPA_DIR)) {
        filesToDownload = fs.readdirSync(LANDVPA_DIR).map(f => ({
          path: path.join(LANDVPA_DIR, f),
          name: f,
        }));
      }
      if (filesToDownload.length === 0) {
        return res.status(404).json({ error: "No landvpa data available for download." });
      }
    } 
    else if (county && !municipality) {
      const { rows } = await pool.query(
        `SELECT m.name FROM municipality m
         JOIN municipality_county mc ON m.id = mc.municipality_id
         JOIN county c ON mc.county_id = c.id
         WHERE c.name = $1`, 
         [county]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: `No municipalities found for county ${county}.` });
      }

      const municipalityNames = rows.map(r =>
        r.name.toUpperCase().replace(/ /g, "_")
      );

      if (fs.existsSync(LANDVPA_DIR)) {
        const allFiles = fs.readdirSync(LANDVPA_DIR);
        filesToDownload = allFiles
          .filter(filename => {
            return municipalityNames.some(mun => filename.includes(mun + "_VPA"));
          })
          .map(f => ({
            path: path.join(LANDVPA_DIR, f),
            name: f,
          }));
      }

      if (filesToDownload.length === 0) {
        return res.status(404).json({ error: `No landvpa files found for county ${county}.` });
      }
    } 
    else if (municipality) {
      const munNormalized = municipality.toUpperCase().replace(/ /g, "_");
      const filename = `${munNormalized}_VPA.geojson`;
      const filepath = path.join(LANDVPA_DIR, filename);

      if (fs.existsSync(filepath)) {
        filesToDownload.push({ path: filepath, name: filename });
      }

      if (filesToDownload.length === 0) {
        return res.status(404).json({ error: `No landvpa data available for municipality ${municipality}.` });
      }
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=landvpa-export.zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    filesToDownload.forEach(file => {
      archive.file(file.path, { name: file.name });
    });

    archive.finalize();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const exportFullData = async (req, res) => {
  const foodDir = path.join(UPLOADS_DIR, "food-access-points");

  try {
    const filesToDownload = [];

    if (fs.existsSync(LANDVPA_DIR)) {
      const landFiles = fs.readdirSync(LANDVPA_DIR);
      landFiles.forEach(f => filesToDownload.push({ path: path.join(LANDVPA_DIR, f), name: `landvpa/${f}` }));
    }
    if (fs.existsSync(foodDir)) {
      const foodFiles = fs.readdirSync(foodDir);
      foodFiles.forEach(f => filesToDownload.push({ path: path.join(foodDir, f), name: `food-access-points/${f}` }));
    }

    if (filesToDownload.length === 0) {
      return res.status(404).json({ error: "No data available for full export." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=full-data-export.zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    filesToDownload.forEach(file => {
      archive.file(file.path, { name: file.name });
    });

    archive.finalize();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error exporting full data." });
  }
};