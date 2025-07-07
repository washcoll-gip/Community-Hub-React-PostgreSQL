import express from "express";
import { exportData, exportFullData } from "../controllers/exportController.js";

const router = express.Router();

router.get("/", exportData);
router.get("/full", exportFullData);

export default router;