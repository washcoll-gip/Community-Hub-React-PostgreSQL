import express from "express";
import multer from "multer";
import { uploadFoodAccessPoints, uploadLandVPA } from "../controllers/uploadController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/foodaccesspoints", upload.single("file"), uploadFoodAccessPoints);
router.post("/landvpa", upload.single("file"), uploadLandVPA);

export default router;