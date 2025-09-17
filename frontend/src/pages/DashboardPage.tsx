import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Map } from '../components/Map';

export const DashboardPage: React.FC = () => {
  const [isSatellite, setIsSatellite] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats'),
  });

  const { data: recentTracks } = useQuery({
    queryKey: ['recent-tracks'],
    queryFn: () => api.get('/tracks/recent'),
  });

  const { data: currentLocation } = useQuery({
    queryKey: ['current-location'],
    queryFn: () => api.get('/locations/current'),
  });

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
        <p className="mt-1 text-sm text-gray-500">
          Обзор вашей активности и последних треков
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Всего треков
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.data?.total_tracks || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Общее расстояние
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.data?.total_distance ? `${(stats.data.total_distance / 1000).toFixed(1)} км` : '0 км'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Время в пути
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.data?.total_duration ? `${Math.round(stats.data.total_duration / 3600)}ч` : '0ч'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Карта и последние треки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Карта */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Текущее местоположение
              </h3>
              <button
                onClick={() => setIsSatellite(!isSatellite)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                title={isSatellite ? 'Переключить на карту' : 'Переключить на спутник'}
              >
                {isSatellite ? '🗺️ Карта' : '🛰️ Спутник'}
              </button>
            </div>
            <div className="h-64 rounded-lg overflow-hidden">
              {currentLocation?.data && (
                <Map
                  center={[currentLocation.data.latitude, currentLocation.data.longitude]}
                  zoom={13}
                  markers={[
                    {
                      position: [currentLocation.data.latitude, currentLocation.data.longitude],
                      title: 'Текущее местоположение',
                    },
                  ]}
                  showMapToggle={false}
                  isSatellite={isSatellite}
                  onSatelliteChange={setIsSatellite}
                />
              )}
            </div>
          </div>
        </div>

        {/* Последние треки */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Последние треки
              </h3>
              <Link
                to="/tracks"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Посмотреть все
              </Link>
            </div>
            <div className="space-y-4">
              {recentTracks?.data?.slice(0, 5).map((track: any) => (
                <div key={track.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {track.name || `Трек ${track.id}`}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(track.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {track.distance ? `${(track.distance / 1000).toFixed(1)} км` : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {track.duration ? `${Math.round(track.duration / 60)} мин` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {(!recentTracks?.data || recentTracks.data.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Нет треков для отображения
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Быстрые действия
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/tracks/new"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Создать трек
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Начать новый трек для отслеживания маршрута
                </p>
              </div>
            </Link>

            <Link
              to="/locations"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Местоположения
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Просмотр сохраненных местоположений
                </p>
              </div>
            </Link>

            <Link
              to="/tracks"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Все треки
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Просмотр всех ваших треков и маршрутов
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}; 