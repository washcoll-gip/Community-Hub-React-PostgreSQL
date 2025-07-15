import express from "express";
import {
  getMunicipalities,
  getMunicipalityById,
  getVpaDecileBreakpoints,
  getVpaSubdecileBreakpoints
} from "../controllers/municipalitiesController.js";

const router = express.Router();

router.get("/", getMunicipalities);
router.get("/:id", getMunicipalityById);
router.get("/:id/vpa-deciles", getVpaDecileBreakpoints);
router.get("/:id/vpa-deciles/:decile/subdeciles", getVpaSubdecileBreakpoints);

export default router;