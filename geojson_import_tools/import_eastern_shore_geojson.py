import os
from dotenv import load_dotenv
import json
import psycopg2

filename = "Eastern_Shore_Counties.geojson"

geojson_folder = os.path.join(os.path.dirname(__file__), "..", "geojson_archive")
filepath = os.path.abspath(os.path.join(geojson_folder, filename))

load_dotenv()

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)
cur = conn.cursor()

with open(filepath, "r") as f:
    data = json.load(f)

for feature in data["features"]:
    props = feature["properties"]
    geom = json.dumps(feature["geometry"])

    cur.execute("""
        INSERT INTO county (
            name, district, tsd_id, objectid, county_fip, county_num, shape_area, shape_length, geom
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s,
            ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)
        )
    """, (
        props.get("COUNTY"),
        props.get("DISTRICT"),
        props.get("TSD_ID"),
        props.get("OBJECTID_1"),
        props.get("COUNTY_FIP"),
        props.get("COUNTYNUM"),
        props.get("Shape__Area"),
        props.get("Shape__Length"),
        geom
    ))

conn.commit()
cur.close()
conn.close()

print(f"Data from {filename} inserted successfully.")