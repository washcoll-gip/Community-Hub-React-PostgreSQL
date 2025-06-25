import express from "express";
import cors from "cors";

import countyRoutes from "./routes/counties.js";
import municipalityRoutes from "./routes/municipalities.js";
import parcelRoutes from "./routes/parcels.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/counties", countyRoutes);
app.use("/api/municipalities", municipalityRoutes);
app.use("/api/parcels", parcelRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});