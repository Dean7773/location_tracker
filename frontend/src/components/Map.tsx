import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TrackPoint } from '../types';

// Исправляем проблему с иконками Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Создаем красную иконку для выбранных точек
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Создаем синюю иконку для обычных точек
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapProps {
  center: [number, number];
  zoom: number;
  trackPoints?: Array<[number, number]>;
  markers?: Array<{ position: [number, number]; title: string; isSelected?: boolean }>;
  height?: string;
  isSatellite?: boolean;
  onSatelliteChange?: (isSatellite: boolean) => void;
  showMapToggle?: boolean;
  onMove?: (center: [number, number]) => void;
  onZoom?: (zoom: number) => void;
  lockView?: boolean;
  panTo?: [number, number];
}

export const Map: React.FC<MapProps> = ({
  center,
  zoom,
  trackPoints = [],
  markers = [],
  height = "400px",
  isSatellite = false,
  onSatelliteChange,
  showMapToggle = true,
  onMove,
  onZoom,
  lockView = true,
  panTo,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const osmLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  // Для lockView=false: локальное состояние центра и зума
  const initialCenter = useRef(center);
  const initialZoom = useRef(zoom);

  // Инициализация карты
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(lockView ? center : initialCenter.current, lockView ? zoom : initialZoom.current);
    mapInstanceRef.current = map;

    osmLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    });
    satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
    });

    (isSatellite ? satelliteLayerRef.current : osmLayerRef.current)?.addTo(map);

    markerGroupRef.current = L.layerGroup().addTo(map);

    if (trackPoints.length > 0) {
      polylineRef.current = L.polyline(trackPoints, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.8,
      }).addTo(map);
      map.fitBounds(polylineRef.current.getBounds());
    }

    markers.forEach(({ position, title, isSelected }) => {
      const icon = isSelected ? redIcon : blueIcon;
      L.marker(position, { icon }).addTo(markerGroupRef.current!).bindPopup(title);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Для lockView=false: при смене key (маунт нового трека) обновить initialCenter/initialZoom
  useEffect(() => {
    if (!lockView) {
      initialCenter.current = center;
      initialZoom.current = zoom;
    }
  }, [center, zoom, lockView]);

  // Переключение слоя карты (сохраняем центр и зум только если lockView=true)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !osmLayerRef.current || !satelliteLayerRef.current) return;
    if (isSatellite) {
      map.removeLayer(osmLayerRef.current);
      satelliteLayerRef.current.addTo(map);
    } else {
      map.removeLayer(satelliteLayerRef.current);
      osmLayerRef.current.addTo(map);
    }
    if (lockView) {
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      map.setView(currentCenter, currentZoom);
    }
  }, [isSatellite, lockView]);

  // Обновление трека и маркеров при изменении данных
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    if (trackPoints.length > 0) {
      polylineRef.current = L.polyline(trackPoints, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.8,
      }).addTo(map);
      map.fitBounds(polylineRef.current.getBounds());
    }
    if (markerGroupRef.current) {
      markerGroupRef.current.clearLayers();
      markers.forEach(({ position, title, isSelected }) => {
        const icon = isSelected ? redIcon : blueIcon;
        L.marker(position, { icon }).addTo(markerGroupRef.current!).bindPopup(title);
      });
    }
  }, [trackPoints, markers]);

  // Слушатели событий карты
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const handleMove = () => {
      const c = map.getCenter();
      onMove?.([c.lat, c.lng]);
    };
    const handleZoom = () => {
      onZoom?.(map.getZoom());
    };
    map.on('moveend', handleMove);
    map.on('zoomend', handleZoom);
    return () => {
      map.off('moveend', handleMove);
      map.off('zoomend', handleZoom);
    };
  }, [onMove, onZoom]);

  // Центрирование и масштабирование при изменении пропсов (только если lockView=true)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!lockView) return;
    const current = map.getCenter();
    if (current.lat !== center[0] || current.lng !== center[1]) {
      map.panTo(center);
    }
    if (map.getZoom() !== zoom) {
      map.setZoom(zoom);
    }
  }, [center, zoom, lockView]);

  // Центрирование на panTo (только если lockView=false)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !panTo || lockView) return;
    map.panTo(panTo);
  }, [panTo, lockView]);

  return (
    <div className="relative">
      <div ref={mapRef} style={{ height, width: '100%' }} />
      {showMapToggle && onSatelliteChange && (
        <button
          onClick={() => onSatelliteChange(!isSatellite)}
          className="absolute top-2 right-2 z-[1000] inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          title={isSatellite ? 'Переключить на карту' : 'Переключить на спутник'}
        >
          {isSatellite ? '🗺️ Карта' : '🛰️ Спутник'}
        </button>
      )}
    </div>
  );
}; 