import json
from collections import defaultdict

input_file = "SLR_1ft_Remaining_Parcels.geojson"

# Load the full GeoJSON
with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Group features by the "County" property
counties = defaultdict(list)

for feature in data['features']:
    county = feature['properties'].get('County', 'Unknown').replace(" ", "_")
    counties[county].append(feature)

# Write a separate GeoJSON file for each county
for county, features in counties.items():
    output = {
        "type": "FeatureCollection",
        "features": features
    }
    filename = f"{county}.geojson"
    with open(filename, 'w', encoding='utf-8') as f_out:
        json.dump(output, f_out, indent=2)
    print(f"Saved {filename} with {len(features)} features.")