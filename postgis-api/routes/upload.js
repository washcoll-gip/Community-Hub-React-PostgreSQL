import express from "express";
import multer from "multer";
import { uploadFoodAccessPoints, uploadLandVPA, uploadSLRParcels } from "../controllers/uploadController.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/foodaccesspoints", upload.single("file"), uploadFoodAccessPoints);
router.post("/landvpa", upload.single("file"), uploadLandVPA);
router.post("/slr", upload.single("file"), uploadSLRParcels);

export default router;