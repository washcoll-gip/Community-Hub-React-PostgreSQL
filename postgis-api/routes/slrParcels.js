import express from "express";
import { getSLRParcels } from "../controllers/slrParcelsController.js";

const router = express.Router();

router.get("/", getSLRParcels);

export default router;