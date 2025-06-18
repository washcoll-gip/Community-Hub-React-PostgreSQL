import geopandas as gpd

gdf = gpd.read_file("Eastern_Shore_Counties.json")

gdf = gdf.to_crs(epsg=4326)

gdf.to_file("Eastern_Shore_Counties.geojson", driver="GeoJSON")