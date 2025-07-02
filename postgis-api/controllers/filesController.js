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

export const downloadFile = (req, res) => {
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
};