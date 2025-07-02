import pool from "../db/pool.js";

export const getParcels = async (req, res) => {
  try {
    const { municipality, county } = req.query;

    let baseQuery = `
      SELECT 
        p.id, p.municipality_id, p.objectid, p.mergeid, p.address, p.yearbuilt, p.calc_area, p.u3value, p.vpa,
        p.landvpa, p.txbl_val, p.jurscode, p.acctid, p.city, p.zipcode, p.ownname1, p.ownname2,
        p.landuseu3, p.lu, p.desclu, p.descstyl, p.descbldg, p.nfmlndvl, p.nfmimpvl, p.nfmttlvl,
        p.bldg_story, p.resident, p.merge_, p.new_merge, p.notes, p.downtown, p.fid1, p.cityname,
        p.insidecore, p.outsidecore, p.yearbuiltcat, p.impvalperacre, p.dt_easton, p.developed,
        ST_AsGeoJSON(p.geom)::json AS geometry,
        p.vpa_decile
      FROM parcel p
      JOIN municipality m ON p.municipality_id = m.id
    `;
    
    const params = [];

    if (municipality) {
      baseQuery += ` WHERE LOWER(m.name) = LOWER($1)`;
      params.push(municipality);
    } else if (county) {
      baseQuery += `
        JOIN municipality_county mc ON m.id = mc.municipality_id
        JOIN county c ON c.id = mc.county_id
        WHERE LOWER(c.name) = LOWER($1)
      `;
      params.push(county);
    } else {
      return res.json({ type: "FeatureCollection", features: [] });
    }

    const result = await pool.query(baseQuery, params);

    const geojson = {
      type: "FeatureCollection",
      features: result.rows.map((row) => {
        const { geometry, ...properties } = row;
        return {
          type: "Feature",
          geometry,
          properties,
        };
      }),
    };

    res.json(geojson);
  } catch (error) {
    console.error("Error fetching parcels:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};