import express from "express";
import { getMunicipalities } from "../controllers/municipalitiesController.js";

const router = express.Router();

router.get("/", getMunicipalities);

export default router;