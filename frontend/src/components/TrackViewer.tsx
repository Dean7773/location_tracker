import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Map } from './Map';

export const TrackViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6176]);
  const [mapZoom] = useState(13);

  const { data: track, isLoading, error } = useQuery({
    queryKey: ['track', id],
    queryFn: () => api.get(`/tracks/${id}`),
    enabled: !!id,
  });

  useEffect(() => {
    if (track?.data?.track_points && track.data.track_points.length > 0) {
      setMapCenter([
        track.data.track_points[0].latitude,
        track.data.track_points[0].longitude,
      ]);
    }
  }, [track?.data?.id]);

  useEffect(() => {
    if (selectedPoint && selectedPoint.latitude && selectedPoint.longitude) {
      setMapCenter([selectedPoint.latitude, selectedPoint.longitude]);
    }
  }, [selectedPoint]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-700">
          Ошибка загрузки трека: {error.message}
        </div>
      </div>
    );
  }

  if (!track?.data) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900">Трек не найден</h3>
        <p className="mt-1 text-sm text-gray-500">
          Запрашиваемый трек не существует или был удален.
        </p>
        <div className="mt-6">
          <Link
            to="/tracks"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Вернуться к списку треков
          </Link>
        </div>
      </div>
    );
  }

  const trackData = track.data;
  const trackPoints = trackData.track_points || [];

  const calculateDistance = (points: any[]) => {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      const R = 6371e3; // радиус Земли в метрах
      const φ1 = (prev.latitude * Math.PI) / 180;
      const φ2 = (curr.latitude * Math.PI) / 180;
      const Δφ = ((curr.latitude - prev.latitude) * Math.PI) / 180;
      const Δλ = ((curr.longitude - prev.longitude) * Math.PI) / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      totalDistance += R * c;
    }
    
    return totalDistance;
  };

  const calculateDuration = (points: any[]) => {
    if (points.length < 2) return 0;
    
    const firstPoint = new Date(points[0].timestamp);
    const lastPoint = new Date(points[points.length - 1].timestamp);
    
    return (lastPoint.getTime() - firstPoint.getTime()) / 1000; // в секундах
  };

  const distance = calculateDistance(trackPoints);
  const duration = calculateDuration(trackPoints);

  return (
    <div className="space-y-6">
      {/* Заголовок и дата */}
      <div className="flex items-center space-x-3">
        <Link to="/tracks" className="text-primary-600 hover:text-primary-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{trackData.name || `Трек ${trackData.id}`}</h1>
      </div>
      <p className="mt-1 mb-2 text-sm text-gray-500">
        {new Date(trackData.created_at).toLocaleDateString('ru-RU', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
        })}
      </p>

      {/* Основной блок: статистика + карта */}
      <div className="flex flex-row gap-6 mb-6 items-stretch">
        {/* Левая колонка: статистика + карта */}
        <div className="flex flex-col flex-grow">
          {/* Блок статистики */}
          <div className="bg-white shadow rounded-lg px-6 py-4 mb-3 w-full">
            <div className="flex flex-row gap-6 items-center">
              <div className="flex items-center gap-2 text-base py-1">
                <span className="inline-flex items-center"><svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>Дистанция:</span>
                <span className="text-gray-900 font-semibold text-lg">{(distance / 1000).toFixed(2)} км</span>
              </div>
              <div className="flex items-center gap-2 text-base py-1">
                <span className="inline-flex items-center"><svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Время:</span>
                <span className="text-gray-900 font-semibold text-lg">{Math.round(duration / 60)} мин</span>
              </div>
              <div className="flex items-center gap-2 text-base py-1">
                <span className="inline-flex items-center"><svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" /></svg>Точек:</span>
                <span className="text-gray-900 font-semibold text-lg">{trackPoints.length}</span>
              </div>
              <div className="flex items-center gap-2 text-base py-1">
                <span className="inline-flex items-center"><svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>Ср. скорость:</span>
                <span className="text-gray-900 font-semibold text-lg">{duration > 0 ? ((distance / 1000) / (duration / 3600)).toFixed(1) : 0} км/ч</span>
              </div>
            </div>
          </div>
          {/* Карта */}
          <div className="bg-white shadow rounded-lg flex flex-col flex-grow h-[500px]">
            <div className="px-6 pt-4 pb-6 h-full">
              <div className="h-full rounded-lg overflow-hidden">
                {trackPoints.length > 0 && (
                  <Map
                    key={trackData.id}
                    center={mapCenter}
                    zoom={mapZoom}
                    trackPoints={trackPoints.map((point: any) => [point.latitude, point.longitude])}
                    markers={selectedPoint ? [{
                      position: [selectedPoint.latitude, selectedPoint.longitude],
                      title: `Точка ${trackPoints.findIndex((p: any) => p.id === selectedPoint.id) + 1}`,
                    }] : []}
                    height="500px"
                    isSatellite={isSatellite}
                    onSatelliteChange={setIsSatellite}
                    showMapToggle
                    lockView={false}
                    panTo={selectedPoint ? [selectedPoint.latitude, selectedPoint.longitude] : undefined}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Список точек справа */}
        <div className="bg-white shadow rounded-lg max-w-xs w-full h-[620px] flex flex-col">
          <div className="px-4 pt-4 pb-4">
            <div className="flex flex-row gap-2 mb-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Экспорт
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Редактировать
              </button>
            </div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Точки маршрута</h3>
          </div>
          <div className="flex-1 px-4 pb-4 h-0 overflow-y-auto">
            {trackPoints.map((point: any, index: number) => (
              <div
                key={point.id || index}
                className={`border rounded-lg p-2 cursor-pointer transition-colors ${
                  selectedPoint?.id === point.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPoint(point)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-900">Точка {index + 1}</p>
                    <p className="text-xs text-gray-500">{point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</p>
                    <p className="text-xs text-gray-500">{new Date(point.timestamp).toLocaleTimeString('ru-RU')}</p>
                  </div>
                  <div className="text-right">
                    {point.altitude && (
                      <p className="text-xs text-gray-500">{point.altitude.toFixed(0)} м</p>
                    )}
                    {point.speed && (
                      <p className="text-xs text-gray-500">{(point.speed * 3.6).toFixed(1)} км/ч</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {trackPoints.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">Нет точек в треке</p>
            )}
          </div>
        </div>
      </div>

      {/* Детальная информация о треке */}
      <div className="bg-white shadow rounded-lg mt-6">
        <div className="px-6 pt-4 pb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-3 pt-1">Детальная информация</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Название</dt>
              <dd className="text-sm text-gray-900 mb-2">{trackData.name || `Трек ${trackData.id}`}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Дата</dt>
              <dd className="text-sm text-gray-900 mb-2">{new Date(trackData.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Дистанция</dt>
              <dd className="text-sm text-gray-900 mb-2">{(distance / 1000).toFixed(2)} км</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Время в пути</dt>
              <dd className="text-sm text-gray-900 mb-2">{Math.round(duration / 60)} мин</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Средняя скорость</dt>
              <dd className="text-sm text-gray-900 mb-2">{duration > 0 ? ((distance / 1000) / (duration / 3600)).toFixed(1) : 0} км/ч</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Количество точек</dt>
              <dd className="text-sm text-gray-900 mb-2">{trackPoints.length}</dd>
            </div>
            {trackData.description && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Описание</dt>
                <dd className="text-sm text-gray-900">{trackData.description}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}; 