import json
import psycopg2
import sys
import os

if len(sys.argv) < 2:
    print("Usage: python import_geojson.py <file.geojson>")
    sys.exit(1)

filename = sys.argv[1]
municipality_name = os.path.basename(filename).split("_")[0].capitalize()

conn = psycopg2.connect(
    dbname="postgis_demo",
    user="postgres",
    password="postgres",
    host="localhost",
    port="5432"
)
cur = conn.cursor()

cur.execute("SELECT id FROM municipality WHERE name = %s", (municipality_name,))
result = cur.fetchone()

if result:
    municipality_id = result[0]
else:
    cur.execute("INSERT INTO municipality (name) VALUES (%s) RETURNING id", (municipality_name,))
    municipality_id = cur.fetchone()[0]
    conn.commit()

with open(filename, "r") as f:
    data = json.load(f)

for feature in data["features"]:
    geom = json.dumps(feature["geometry"])
    props = feature["properties"].copy()

    props["municipality_id"] = municipality_id
    props["geom"] = geom

    cur.execute("""
        INSERT INTO parcel (
            municipality_id, objectid, mergeid, address, yearbuilt, calc_area, u3value, vpa,
            landvpa, txbl_val, jurscode, acctid, city, zipcode, ownname1, ownname2,
            landuseu3, lu, desclu, descstyl, descbldg, nfmlndvl, nfmimpvl, nfmttlvl,
            bldg_story, resident, merge_, new_merge, notes, downtown, fid1, cityname,
            insidecore, outsidecore, yearbuiltcat, impvalperacre, dt_easton, developed, geom
        ) VALUES (
            %(municipality_id)s, %(OBJECTID)s, %(MergeID)s, %(ADDRESS)s, %(YearBuilt)s, %(CALC_AREA)s, %(U3Value)s, %(VPA)s,
            %(LandVPA)s, %(Txbl_Val)s, %(JURSCODE)s, %(ACCTID)s, %(CITY)s, %(ZIPCODE)s, %(OWNNAME1)s, %(OWNNAME2)s,
            %(LandUseU3)s, %(LU)s, %(DESCLU)s, %(DESCSTYL)s, %(DESCBLDG)s, %(NFMLNDVL)s, %(NFMIMPVL)s, %(NFMTTLVL)s,
            %(BLDG_STORY)s, %(RESIDENT)s, %(Merge_)s, %(New_Merge)s, %(Notes)s, %(Downtown)s, %(FID1)s, %(CityName)s,
            %(InsideCore)s, %(OutsideCore)s, %(YearBuiltCat)s, %(ImpValPerAcre)s, %(DT_Easton)s, %(developed)s,
            ST_GeomFromGeoJSON(%(geom)s)
        )
    """, props)

conn.commit()
cur.close()
conn.close()

print(f"Data from {municipality_name} inserted successfully.")