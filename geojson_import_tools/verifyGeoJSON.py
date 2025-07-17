import json

def is_geojson(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    return (
        isinstance(data, dict)
        and data.get("type") == "FeatureCollection"
        and isinstance(data.get("features"), list)
    )

file_path = "SLR_2ft_Remaining_Parcels.json"

if is_geojson(file_path):
    print("✅ This is a valid GeoJSON file.")
else:
    print("❌ This is NOT a valid GeoJSON file.")