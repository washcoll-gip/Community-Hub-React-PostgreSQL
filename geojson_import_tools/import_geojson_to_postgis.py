import os
from dotenv import load_dotenv
import json
import psycopg2

load_dotenv()

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)
cur = conn.cursor()

with open("BERLIN_VPA.geojson", "r") as f:
    data = json.load(f)

for feature in data["features"]:
    geom = json.dumps(feature["geometry"])
    props = feature["properties"]
    props["geom"] = geom

    cur.execute("""
        INSERT INTO barclay_vpa (
            objectid, mergeid, address, yearbuilt, calc_area, u3value, vpa,
            landvpa, txbl_val, jurscode, acctid, city, zipcode,
            ownname1, ownname2, landuseu3, lu, desclu, descstyl, descbldg,
            nfmlndvl, nfmimpvl, nfmttlvl, bldg_story, resident,
            merge_, new_merge, notes, downtown, fid1, cityname,
            insidecore, outsidecore, yearbuiltcat, impvalperacre,
            dt_easton, developed, geom
        )
        VALUES (
            %(OBJECTID)s, %(MergeID)s, %(ADDRESS)s, %(YearBuilt)s, %(CALC_AREA)s, %(U3Value)s, %(VPA)s,
            %(LandVPA)s, %(Txbl_Val)s, %(JURSCODE)s, %(ACCTID)s, %(CITY)s, %(ZIPCODE)s,
            %(OWNNAME1)s, %(OWNNAME2)s, %(LandUseU3)s, %(LU)s, %(DESCLU)s, %(DESCSTYL)s, %(DESCBLDG)s,
            %(NFMLNDVL)s, %(NFMIMPVL)s, %(NFMTTLVL)s, %(BLDG_STORY)s, %(RESIDENT)s,
            %(Merge_)s, %(New_Merge)s, %(Notes)s, %(Downtown)s, %(FID1)s, %(CityName)s,
            %(InsideCore)s, %(OutsideCore)s, %(YearBuiltCat)s, %(ImpValPerAcre)s,
            %(DT_Easton)s, %(developed)s, ST_GeomFromGeoJSON(%(geom)s)
        );
    """, props)

conn.commit()
cur.close()
conn.close()