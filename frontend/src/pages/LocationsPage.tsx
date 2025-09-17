import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Map } from '../components/Map';

export const LocationsPage: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6176]);
  const [mapZoom, setMapZoom] = useState(10);
  const queryClient = useQueryClient();

  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['locations'],
    queryFn: () => api.get('/locations'),
  });

  // Центрирование карты при выборе местоположения
  const handleSelectLocation = (location: any) => {
    setSelectedLocation(location);
    setMapCenter([location.latitude, location.longitude]);
  };

  // Мутация для удаления
  const deleteLocationMutation = useMutation({
    mutationFn: (locationId: number) => api.delete(`/locations/${locationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      if (selectedLocation) setSelectedLocation(null);
    },
  });

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
          Ошибка загрузки местоположений: {error.message}
        </div>
      </div>
    );
  }

  const allMarkers = locations?.data?.map((location: any) => ({
    position: [location.latitude, location.longitude],
    title: location.name || `Местоположение ${location.id}`,
    isSelected: selectedLocation?.id === location.id,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Местоположения</h1>
        <p className="mt-1 text-sm text-gray-500">
          Просмотр всех сохраненных местоположений
        </p>
      </div>

      <div className="flex flex-row gap-6 min-h-screen">
        {/* Список местоположений */}
        <div className="bg-white shadow rounded-lg flex-1 min-w-[320px] max-w-md">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Список местоположений
            </h3>
            <div className="space-y-4">
              {locations?.data?.map((location: any) => (
                <div
                  key={location.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedLocation?.id === location.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectLocation(location)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {location.name || `Местоположение ${location.id}`}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(() => {
                          const date = new Date(location.timestamp);
                          return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                        })()}
                      </p>
                    </div>
                    <div className="text-right">
                      {location.accuracy && (
                        <p className="text-sm text-gray-500">
                          Точность: ±{location.accuracy}m
                        </p>
                      )}
                      {location.speed && (
                        <p className="text-sm text-gray-500">
                          Скорость: {location.speed.toFixed(1)} км/ч
                        </p>
                      )}
                    </div>
                    <button
                      className="ml-2 text-red-600 hover:text-red-800 text-xs font-medium"
                      title="Удалить местоположение"
                      onClick={e => {
                        e.stopPropagation();
                        if (window.confirm('Удалить это местоположение?')) {
                          deleteLocationMutation.mutate(location.id);
                        }
                      }}
                      disabled={deleteLocationMutation.isPending}
                    >
                      {deleteLocationMutation.isPending ? 'Удаление...' : 'Удалить'}
                    </button>
                  </div>
                  {location.description && (
                    <p className="mt-2 text-sm text-gray-600">{location.description}</p>
                  )}
                </div>
              ))}
              {(!locations?.data || locations.data.length === 0) && (
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Нет местоположений</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Местоположения появятся после начала отслеживания.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Карта и детали sticky с прокруткой */}
        <div className="flex flex-col gap-4 max-w-3xl w-full ml-auto lg:sticky lg:top-6 lg:max-h-[calc(100vh-48px)] lg:overflow-auto">
          {/* Карта всех местоположений */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Карта местоположений
                </h3>
              </div>
              <div className="h-80 rounded-lg overflow-hidden">
                {allMarkers.length > 0 && (
                  <Map
                    center={mapCenter}
                    zoom={mapZoom}
                    onMove={setMapCenter}
                    onZoom={setMapZoom}
                    markers={allMarkers}
                    showMapToggle={true}
                    isSatellite={isSatellite}
                    onSatelliteChange={setIsSatellite}
                    lockView={false}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Детали выбранного местоположения */}
          {selectedLocation && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Детали местоположения
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Название</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedLocation.name || `Местоположение ${selectedLocation.id}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Дата</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {(() => {
                        const date = new Date(selectedLocation.timestamp);
                        return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU');
                      })()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Широта</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedLocation.latitude.toFixed(6)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Долгота</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedLocation.longitude.toFixed(6)}
                    </dd>
                  </div>
                  {selectedLocation.accuracy && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Точность</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        ±{selectedLocation.accuracy} метров
                      </dd>
                    </div>
                  )}
                  {selectedLocation.speed && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Скорость</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedLocation.speed.toFixed(1)} км/ч
                      </dd>
                    </div>
                  )}
                  {selectedLocation.altitude && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Высота</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedLocation.altitude.toFixed(0)} м
                      </dd>
                    </div>
                  )}
                  {selectedLocation.heading && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Направление</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedLocation.heading.toFixed(0)}°
                      </dd>
                    </div>
                  )}
                  {selectedLocation.description && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Описание</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedLocation.description}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-6">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${selectedLocation.latitude}&mlon=${selectedLocation.longitude}&zoom=15`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Открыть в OpenStreetMap
                  </a>
                </div>
              </div>
            </div>
          )}

          {!selectedLocation && (
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Выберите местоположение</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Выберите местоположение из списка слева для просмотра деталей.
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