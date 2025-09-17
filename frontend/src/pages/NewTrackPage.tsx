import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { NewTrackForm } from '../types';

export const NewTrackPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [trackPoints, setTrackPoints] = useState<Array<[number, number]>>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewTrackForm>();

  const createTrackMutation = useMutation({
    mutationFn: (data: NewTrackForm) => api.post('/tracks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      navigate('/tracks');
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: (locationData: any) => api.post('/locations', locationData),
  });

  const addTrackPointMutation = useMutation({
    mutationFn: (pointData: any) => api.post('/tracks/points', pointData),
  });

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером');
      return;
    }

    setIsTracking(true);
    setTrackPoints([]);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition(position);
        const { latitude, longitude } = position.coords;
        
        // Добавляем точку в трек
        const newPoint = [latitude, longitude] as [number, number];
        setTrackPoints(prev => [...prev, newPoint]);

        // Отправляем местоположение на сервер
        updateLocationMutation.mutate({
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          timestamp: new Date(position.timestamp).toISOString(),
        });

        // Добавляем точку в трек
        addTrackPointMutation.mutate({
          latitude,
          longitude,
          timestamp: new Date(position.timestamp).toISOString(),
        });
      },
      (error) => {
        console.error('Ошибка геолокации:', error);
        alert('Ошибка получения местоположения');
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Сохраняем ID для остановки отслеживания
    return watchId;
  };

  const stopTracking = () => {
    setIsTracking(false);
    setCurrentPosition(null);
  };

  const onSubmit = async (data: NewTrackForm) => {
    if (trackPoints.length === 0) {
      alert('Начните отслеживание перед сохранением трека');
      return;
    }

    try {
      await createTrackMutation.mutateAsync({
        ...data,
        points: trackPoints.map((point, index) => ({
          latitude: point[0],
          longitude: point[1],
          timestamp: new Date(Date.now() - (trackPoints.length - index) * 1000).toISOString(),
        })),
      });
    } catch (error) {
      console.error('Ошибка создания трека:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Новый трек</h1>
        <p className="mt-1 text-sm text-gray-500">
          Создайте новый GPS трек для отслеживания маршрута
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Форма создания трека */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Информация о треке
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Название трека
                </label>
                <input
                  {...register('name', { required: 'Название обязательно' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Мой маршрут"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Описание (необязательно)
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Описание маршрута..."
                />
              </div>

              {/* Управление отслеживанием */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Отслеживание</h4>
                
                <div className="flex items-center space-x-4 mb-4">
                  {!isTracking ? (
                    <button
                      type="button"
                      onClick={startTracking}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Начать отслеживание
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopTracking}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                      Остановить отслеживание
                    </button>
                  )}
                </div>

                {/* Статус отслеживания */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Статус: {isTracking ? 'Отслеживание активно' : 'Отслеживание остановлено'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Точек в треке: {trackPoints.length}
                      </p>
                    </div>
                    {isTracking && (
                      <div className="flex items-center">
                        <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm text-red-600">Запись...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Текущее местоположение */}
                {currentPosition && (
                  <div className="mt-4 bg-blue-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">Текущее местоположение</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Широта:</span>
                        <span className="ml-2 text-blue-900">
                          {currentPosition.coords.latitude.toFixed(6)}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">Долгота:</span>
                        <span className="ml-2 text-blue-900">
                          {currentPosition.coords.longitude.toFixed(6)}
                        </span>
                      </div>
                      {currentPosition.coords.accuracy && (
                        <div>
                          <span className="text-blue-700">Точность:</span>
                          <span className="ml-2 text-blue-900">
                            ±{currentPosition.coords.accuracy.toFixed(1)}м
                          </span>
                        </div>
                      )}
                      {currentPosition.coords.speed && (
                        <div>
                          <span className="text-blue-700">Скорость:</span>
                          <span className="ml-2 text-blue-900">
                            {(currentPosition.coords.speed * 3.6).toFixed(1)} км/ч
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Кнопки действий */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={!isTracking || trackPoints.length === 0 || createTrackMutation.isPending}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {createTrackMutation.isPending ? 'Сохранение...' : 'Сохранить трек'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/tracks')}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Предварительный просмотр трека */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Предварительный просмотр
            </h3>
            <div className="h-64 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {trackPoints.length > 0 ? (
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    Трек содержит {trackPoints.length} точек
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Карта будет доступна после сохранения
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    Начните отслеживание для создания трека
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 