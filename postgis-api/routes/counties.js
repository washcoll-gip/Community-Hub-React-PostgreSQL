import express from "express";
import { getCounties } from "../controllers/countiesController.js";

const router = express.Router();

router.get("/", getCounties);

export default router;