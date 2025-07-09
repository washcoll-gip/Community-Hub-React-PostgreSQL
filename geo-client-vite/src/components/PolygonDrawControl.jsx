import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

/**
 * RectangleDrawControl: Adds a Leaflet draw control to the map for drawing rectangles.
 * Props:
 *   onRectangleDrawn: function(geojson) called when a rectangle is finished
 *   active: boolean, whether drawing mode is enabled
 *   onCancel: function() called if drawing is cancelled
 */
const RectangleDrawControl = ({ onRectangleDrawn, active, onCancel }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    let drawnLayer = null;
    let drawControl = null;

    // Add draw control only once
    if (!map._drawControlAddedRect) {
      drawControl = new L.Control.Draw({
        draw: {
          rectangle: {
            shapeOptions: { color: '#1976d2', weight: 2 },
            repeatMode: false,
          },
          polygon: false,
          polyline: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
        edit: false,
      });
      map.addControl(drawControl);
      map._drawControlAddedRect = true;
    }

    // Listen for rectangle creation
    const handleCreated = (e) => {
      if (drawnLayer) {
        map.removeLayer(drawnLayer);
      }
      if (e.layerType === 'rectangle') {
        drawnLayer = e.layer;
        map.addLayer(drawnLayer);
        if (onRectangleDrawn) {
          onRectangleDrawn(drawnLayer.toGeoJSON());
        }
      }
    };
    map.on(L.Draw.Event.CREATED, handleCreated);

    // Ensure pointer events are enabled on the map container
    if (map._container) {
      map._container.style.pointerEvents = 'auto';
    }

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      if (drawnLayer) map.removeLayer(drawnLayer);
    };
  }, [map, onRectangleDrawn]);

  useEffect(() => {
    if (!active && onCancel) {
      onCancel();
    }
  }, [active, onCancel]);

  return null;
};

export default RectangleDrawControl;
