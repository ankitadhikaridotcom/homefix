import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon path issue in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Red Pin Icon for Provider or Selected Location
const customPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks & dragging
function MapClickHandler({ onPositionChange, interactive }) {
  useMapEvents({
    click(e) {
      if (interactive && onPositionChange) {
        onPositionChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component to dynamically re-center map when props change
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
}

export default function LeafletMap({
  center = [29.3803, 79.5126], // Default Haldwani, Uttarakhand
  zoom = 13,
  markerPosition,
  onPositionChange,
  radius, // Service radius in km
  interactive = true,
  height = '350px',
  useCustomRedIcon = false,
}) {
  const validCenter = (center && center[0] && center[1]) ? center : [29.3803, 79.5126];
  const activeMarkerPos = markerPosition || validCenter;

  const handleDragEnd = (event) => {
    if (!interactive || !onPositionChange) return;
    const marker = event.target;
    if (marker) {
      const latLng = marker.getLatLng();
      onPositionChange(latLng.lat, latLng.lng);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-inner border border-gray-200" style={{ height }}>
      <MapContainer
        center={validCenter}
        zoom={zoom}
        scrollWheelZoom={interactive}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={validCenter} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {activeMarkerPos && activeMarkerPos[0] && activeMarkerPos[1] && (
          <Marker
            position={activeMarkerPos}
            draggable={interactive}
            icon={useCustomRedIcon ? customPinIcon : new L.Icon.Default()}
            eventHandlers={{ dragend: handleDragEnd }}
          />
        )}

        {/* Optional Radius Circle in Meters */}
        {radius && activeMarkerPos && activeMarkerPos[0] && (
          <Circle
            center={activeMarkerPos}
            radius={radius * 1000} // radius in meters
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
        )}

        <MapClickHandler onPositionChange={onPositionChange} interactive={interactive} />
      </MapContainer>

      {/* Attribution footer overlay notice */}
      <div className="absolute bottom-1 right-1 bg-white/80 backdrop-blur-sm text-[10px] text-gray-600 px-2 py-0.5 rounded shadow z-[1000] pointer-events-none">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}
