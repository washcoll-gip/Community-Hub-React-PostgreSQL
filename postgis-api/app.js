import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import countiesRouter from "./routes/counties.js";
import municipalitiesRouter from "./routes/municipalities.js";
import parcelsRouter from "./routes/parcels.js";
import uploadRouter from "./routes/upload.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/counties", countiesRouter);
app.use("/api/municipalities", municipalitiesRouter);
app.use("/api/parcels", parcelsRouter);
app.use("/api/upload", uploadRouter);

export default app;