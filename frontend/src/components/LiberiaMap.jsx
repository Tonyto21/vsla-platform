
import React, { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Liberia counties data (simplified coordinates)
const counties = [
  { name: 'Montserrado', capital: 'Monrovia', lat: 6.316, lng: -10.8, groups: 5, savings: 125000, loans: 45000 },
  { name: 'Lofa', capital: 'Voinjama', lat: 8.35, lng: -9.75, groups: 3, savings: 68000, loans: 22000 },
  { name: 'Bong', capital: 'Gbarnga', lat: 7.0, lng: -9.5, groups: 4, savings: 89000, loans: 31000 },
  { name: 'Nimba', capital: 'Sanniquellie', lat: 6.9, lng: -8.7, groups: 6, savings: 142000, loans: 52000 },
  { name: 'Grand Bassa', capital: 'Buchanan', lat: 6.0, lng: -10.0, groups: 3, savings: 56000, loans: 19000 },
  { name: 'Maryland', capital: 'Harper', lat: 4.7, lng: -7.7, groups: 2, savings: 34000, loans: 11000 },
  { name: 'Grand Gedeh', capital: 'Zwedru', lat: 5.9, lng: -8.1, groups: 2, savings: 28000, loans: 9000 },
  { name: 'Sinoe', capital: 'Greenville', lat: 5.0, lng: -9.0, groups: 1, savings: 15000, loans: 5000 },
];

const LiberiaMap = ({ onCountySelect, selectedCounty }) => {
  const [hoveredCounty, setHoveredCounty] = useState(null);

  // Create GeoJSON style function
  const getStyle = (feature) => {
    const countyName = feature?.properties?.name;
    const isSelected = countyName === selectedCounty;
    const isHovered = countyName === hoveredCounty;
    
    return {
      fillColor: isSelected ? '#3b82f6' : (isHovered ? '#60a5fa' : '#1f2937'),
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#fff' : '#6b7280',
      fillOpacity: isSelected ? 0.7 : (isHovered ? 0.5 : 0.3),
    };
  };

  // Create GeoJSON data from counties
  const geoJsonData = {
    type: 'FeatureCollection',
    features: counties.map((county, index) => ({
      type: 'Feature',
      properties: {
        name: county.name,
        capital: county.capital,
        groups: county.groups,
        savings: county.savings,
        loans: county.loans,
      },
      geometry: {
        type: 'Point',
        coordinates: [county.lng, county.lat],
      },
    })),
  };

  const onEachFeature = (feature, layer) => {
    const county = counties.find(c => c.name === feature.properties.name);
    if (county) {
      layer.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-gray-900">${county.name} County</h3>
          <p class="text-sm text-gray-600">Capital: ${county.capital}</p>
          <p class="text-sm text-gray-600">Groups: ${county.groups}</p>
          <p class="text-sm text-gray-600">Savings: $${county.savings.toLocaleString()}</p>
          <p class="text-sm text-gray-600">Loans: $${county.loans.toLocaleString()}</p>
        </div>
      `);
      
      layer.on({
        mouseover: () => setHoveredCounty(county.name),
        mouseout: () => setHoveredCounty(null),
        click: () => onCountySelect(county.name),
      });
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <h3 className="text-white font-semibold mb-3">Liberia County Map</h3>
      <p className="text-gray-400 text-xs mb-3">Click on any county to view detailed reports</p>
      <div className="h-[400px] rounded-lg overflow-hidden">
        <MapContainer
          center={[6.5, -9.5]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB'
          />
          {geoJsonData.features.map((feature, idx) => (
            <GeoJSON
              key={idx}
              data={feature}
              style={getStyle}
              onEachFeature={onEachFeature}
            />
          ))}
        </MapContainer>
      </div>
      <div className="mt-3 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-600 rounded"></div><span className="text-gray-400">No Data</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400 rounded"></div><span className="text-gray-400">Hover</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-600 rounded"></div><span className="text-gray-400">Selected</span></div>
      </div>
    </div>
  );
};

export default LiberiaMap;