import dotenv from "dotenv";
import app from "./app.js";
import { createTables } from "./db/initTables.js";
import importCounties from "./scripts/importEasternShore.js";

dotenv.config();

const port = process.env.PORT || 5000;

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  
  await createTables();
  await importCounties();
});