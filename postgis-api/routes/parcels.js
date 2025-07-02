import express from "express";
import { getParcels } from "../controllers/parcelsController.js";

const router = express.Router();

router.get("/", getParcels);

export default router;