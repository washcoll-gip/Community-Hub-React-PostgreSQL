import express from "express";
import { getFoodAccessPoints } from "../controllers/foodAccessController.js";

const router = express.Router();

router.get("/", getFoodAccessPoints);

export default router;