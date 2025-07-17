import json

def infer_sql_type(value):
    if isinstance(value, bool):
        return "BOOLEAN"
    elif isinstance(value, int):
        return "INTEGER"
    elif isinstance(value, float):
        return "REAL"
    elif value is None:
        return "TEXT"
    else:
        return "TEXT"

def analyze_geojson(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        geojson = json.load(f)

    features = geojson.get("features", [])
    if not features:
        print("⚠️ No features found in the file.")
        return

    geometry_types = set()
    column_types = {}

    for i, feature in enumerate(features, start=1):
        geometry = feature.get("geometry")
        if geometry:
            geometry_types.add(geometry.get("type", "UNKNOWN"))

        properties = feature.get("properties", {})
        for key, value in properties.items():
            if key not in column_types and value is not None:
                column_types[key] = infer_sql_type(value)

    # Display results
    print(f"\n🔍 File analysis: {filepath}")
    print(f"🔢 Total features: {len(features)}")
    print(f"🧭 Geometry types found: {', '.join(geometry_types) if geometry_types else 'None'}")

    if column_types:
        print("\n📌 Detected columns and suggested SQL types:")
        for col, col_type in column_types.items():
            print(f"  {col} -> {col_type}")
    else:
        print("\n❌ No columns found in 'properties'.")

geojson_path = "SLR_2ft_Remaining_Parcels.json"
analyze_geojson(geojson_path)