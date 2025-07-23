import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import uploadRoutes from "./routes/upload.js";
import parcelsRoutes from "./routes/parcels.js";
import countiesRoutes from "./routes/counties.js";
import municipalitiesRoutes from "./routes/municipalities.js";
import foodAccessRoutes from "./routes/foodAccess.js";
import filesRoutes from "./routes/files.js";
import exportRoutes from "./routes/export.js";
import slrParcelsRoutes from "./routes/slrParcels.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "gip-community-hub.netlify.app",
  "https://es-community-hub.netlify.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/upload", uploadRoutes);
app.use("/api/parcels", parcelsRoutes);
app.use("/api/counties", countiesRoutes);
app.use("/api/municipalities", municipalitiesRoutes);
app.use("/api/foodaccesspoints", foodAccessRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/slrparcels", slrParcelsRoutes);

export default app;