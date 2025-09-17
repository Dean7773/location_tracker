import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Map } from '../components/Map';

export const TracksPage: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6176]);
  const [mapZoom] = useState(13);
  const queryClient = useQueryClient();

  const { data: tracks, isLoading, error } = useQuery({
    queryKey: ['tracks'],
    queryFn: () => api.get('/tracks'),
  });

  const { data: trackDetails, isLoading: trackDetailsLoading } = useQuery({
    queryKey: ['track-details', selectedTrack?.id],
    queryFn: () => api.get(`/tracks/${selectedTrack.id}`),
    enabled: !!selectedTrack,
  });

  const deleteTrackMutation = useMutation({
    mutationFn: (trackId: number) => api.delete(`/tracks/${trackId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      if (selectedTrack) {
        setSelectedTrack(null);
      }
    },
  });

  const handleDeleteTrack = (trackId: number, trackName: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить трек "${trackName}"?`)) {
      deleteTrackMutation.mutate(trackId);
    }
  };

  const handleSelectTrack = (track: any) => {
    setSelectedTrack(track);
    if (track && track.track_points && track.track_points.length > 0) {
      setMapCenter([track.track_points[0].latitude, track.track_points[0].longitude]);
    }
  };

  // Функция для расчета статистики трека
  const calculateTrackStats = (points: any[]) => {
    if (!points || points.length < 2) return null;

    let totalDistance = 0;
    let totalTime = 0;
    let maxSpeed = 0;
    let totalElevation = 0;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      // Расчет расстояния (формула гаверсинуса)
      const lat1 = prev.latitude * Math.PI / 180;
      const lat2 = curr.latitude * Math.PI / 180;
      const deltaLat = (curr.latitude - prev.latitude) * Math.PI / 180;
      const deltaLon = (curr.longitude - prev.longitude) * Math.PI / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = 6371 * c; // Радиус Земли в км
      totalDistance += distance;

      // Расчет времени
      if (prev.timestamp && curr.timestamp) {
        const timeDiff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
        totalTime += timeDiff / 1000; // в секундах
      }

      // Максимальная скорость
      if (curr.speed && curr.speed > maxSpeed) {
        maxSpeed = curr.speed;
      }

      // Общий набор высоты
      if (prev.altitude && curr.altitude) {
        const elevation = curr.altitude - prev.altitude;
        if (elevation > 0) {
          totalElevation += elevation;
        }
      }
    }

    const avgSpeed = totalTime > 0 ? (totalDistance / totalTime) * 3600 : 0; // км/ч

    return {
      totalDistance: totalDistance.toFixed(2),
      totalTime: Math.round(totalTime / 60), // в минутах
      avgSpeed: avgSpeed.toFixed(1),
      maxSpeed: maxSpeed.toFixed(1),
      totalElevation: Math.round(totalElevation),
      pointsCount: points.length,
    };
  };

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
          Ошибка загрузки треков: {error.message}
        </div>
      </div>
    );
  }

  const trackStats = trackDetails?.data?.track_points ? 
    calculateTrackStats(trackDetails.data.track_points) : null;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Треки</h1>
          <p className="mt-1 text-sm text-gray-500">
            Управление вашими GPS треками и маршрутами
          </p>
        </div>
        <Link
          to="/tracks/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Новый трек
        </Link>
      </div>

      <div className="flex flex-row gap-6 min-h-screen">
        {/* Список треков */}
        <div className="bg-white shadow rounded-lg flex-1 min-w-[320px] max-w-md">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Список треков ({tracks?.data?.length || 0})
            </h3>
            <div className="space-y-4">
              {tracks?.data?.map((track: any) => (
                <div
                  key={track.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTrack?.id === track.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectTrack(track)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {track.name || `Трек ${track.id}`}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(track.created_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {typeof track.points_count === 'number' ? `${track.points_count} точек` : '0 точек'}
                      </p>
                    </div>
                  </div>
                  {track.description && (
                    <p className="mt-2 text-sm text-gray-600">{track.description}</p>
                  )}
                  <div className="mt-3 flex justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTrack(track.id, track.name || `Трек ${track.id}`);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      disabled={deleteTrackMutation.isPending}
                    >
                      {deleteTrackMutation.isPending ? 'Удаление...' : 'Удалить'}
                    </button>
                  </div>
                </div>
              ))}
              {(!tracks?.data || tracks.data.length === 0) && (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Нет треков</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Начните с создания нового трека.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/tracks/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Создать трек
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Карта и детали sticky с прокруткой */}
        <div className="flex flex-col gap-4 max-w-3xl w-full ml-auto lg:sticky lg:top-6 lg:max-h-[calc(100vh-48px)] lg:overflow-auto">
          {/* Карта трека */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Маршрут трека
                </h3>
              </div>
              <div className="h-80 rounded-lg overflow-hidden">
                {selectedTrack && trackDetails?.data?.track_points && trackDetails.data.track_points.length > 0 ? (
                  <Map
                    key={selectedTrack?.id}
                    center={mapCenter}
                    zoom={mapZoom}
                    trackPoints={trackDetails.data.track_points.map((point: any) => [
                      point.latitude,
                      point.longitude,
                    ])}
                    isSatellite={isSatellite}
                    onSatelliteChange={setIsSatellite}
                    showMapToggle={true}
                    lockView={false}
                  />
                ) : selectedTrack && trackDetailsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">Выберите трек для просмотра маршрута</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Детали трека */}
          {selectedTrack && (
            <div className="bg-white shadow rounded-lg max-w-3xl mx-0">
              <div className="px-6 py-6 sm:p-8">
                <h3 className="text-xl leading-6 font-semibold text-gray-900 mb-4">
                  Детали трека
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dl>
                      <dt className="text-xs font-medium text-gray-500">Название</dt>
                      <dd className="text-sm text-gray-900 mb-2">{selectedTrack.name || `Трек ${selectedTrack.id}`}</dd>
                      <dt className="text-xs font-medium text-gray-500">Дата создания</dt>
                      <dd className="text-sm text-gray-900 mb-2">{new Date(selectedTrack.created_at).toLocaleDateString('ru-RU')}</dd>
                      <dt className="text-xs font-medium text-gray-500">Количество точек</dt>
                      <dd className="text-sm text-gray-900 mb-2">{typeof selectedTrack.points_count === 'number' ? selectedTrack.points_count : 0}</dd>
                      {selectedTrack.description && (
                        <>
                          <dt className="text-xs font-medium text-gray-500">Описание</dt>
                          <dd className="text-sm text-gray-900 mb-2">{selectedTrack.description}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                  {trackStats && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded p-2">
                        <dt className="text-xs font-medium text-gray-500">Общее расстояние</dt>
                        <dd className="text-base font-semibold text-gray-900">{trackStats.totalDistance} км</dd>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <dt className="text-xs font-medium text-gray-500">Время в пути</dt>
                        <dd className="text-base font-semibold text-gray-900">{trackStats.totalTime} мин</dd>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <dt className="text-xs font-medium text-gray-500">Средняя скорость</dt>
                        <dd className="text-base font-semibold text-gray-900">{trackStats.avgSpeed} км/ч</dd>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <dt className="text-xs font-medium text-gray-500">Максимальная скорость</dt>
                        <dd className="text-base font-semibold text-gray-900">{trackStats.maxSpeed} км/ч</dd>
                      </div>
                      {trackStats.totalElevation > 0 && (
                        <div className="bg-gray-50 rounded p-2 col-span-2">
                          <dt className="text-xs font-medium text-gray-500">Общий набор высоты</dt>
                          <dd className="text-base font-semibold text-gray-900">{trackStats.totalElevation} м</dd>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex space-x-3">
                  <Link
                    to={`/tracks/${selectedTrack.id}`}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium text-center"
                  >
                    Подробный просмотр
                  </Link>
                  <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Экспорт GPX
                  </button>
                </div>
              </div>
            </div>
          )}

          {!selectedTrack && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Выберите трек</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Выберите трек из списка слева для просмотра деталей и маршрута.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 