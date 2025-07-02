import express from "express";
import { getUploadedFiles, downloadFile } from "../controllers/filesController.js";

const router = express.Router();

router.get("/", getUploadedFiles);
router.get("/download/:filename", downloadFile);

export default router;