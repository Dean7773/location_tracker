import folium
from typing import List, Tuple, Optional

from app import models


def create_location_map(location: models.Location, zoom: int = 15) -> str:
    """Создает карту с текущим местоположением"""
    map_obj = folium.Map(
        location=[location.latitude, location.longitude],
        zoom_start=zoom,
        tiles='OpenStreetMap'
    )
    
    # Добавляем маркер текущего местоположения
    folium.Marker(
        location=[location.latitude, location.longitude],
        popup=f"<b>{location.name}</b><br>Текущее местоположение",
        tooltip="Нажмите для информации",
        icon=folium.Icon(color='red', icon='info-sign')
    ).add_to(map_obj)
    
    return map_obj._repr_html_()


def create_track_map(track: models.Track, track_points: List[models.TrackPoint], zoom: int = 13) -> str:
    """Создает карту с треком"""
    if not track_points:
        return "<p>Нет данных трека для отображения</p>"
    
    # Получаем координаты для центрирования карты
    coordinates = [(point.latitude, point.longitude) for point in track_points]
    center_lat = sum(coord[0] for coord in coordinates) / len(coordinates)
    center_lon = sum(coord[1] for coord in coordinates) / len(coordinates)
    
    map_obj = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=zoom,
        tiles='OpenStreetMap'
    )
    
    # Добавляем линию трека
    folium.PolyLine(
        coordinates,
        weight=3,
        color='blue',
        opacity=0.8,
        tooltip=f"Трек: {track.name}"
    ).add_to(map_obj)
    
    # Добавляем маркеры начала и конца
    if len(coordinates) >= 2:
        # Маркер начала
        folium.Marker(
            coordinates[0],
            popup=f"<b>Начало трека</b><br>{track.name}",
            tooltip="Начало",
            icon=folium.Icon(color='green', icon='play')
        ).add_to(map_obj)
        
        # Маркер конца
        folium.Marker(
            coordinates[-1],
            popup=f"<b>Конец трека</b><br>{track.name}",
            tooltip="Конец",
            icon=folium.Icon(color='red', icon='stop')
        ).add_to(map_obj)
    
    # Добавляем промежуточные точки (каждую 10-ю для экономии места)
    for i, point in enumerate(track_points[1:-1]):
        if i % 10 == 0:  # Показываем каждую 10-ю точку
            folium.CircleMarker(
                location=[point.latitude, point.longitude],
                radius=3,
                color='blue',
                fill=True,
                popup=f"Точка {i+1}<br>Время: {point.timestamp.strftime('%H:%M:%S')}"
            ).add_to(map_obj)
    
    return map_obj._repr_html_()


def create_multi_track_map(tracks: List[models.Track], zoom: int = 12) -> str:
    """Создает карту с несколькими треками"""
    if not tracks:
        return "<p>Нет треков для отображения</p>"
    
    # Находим границы всех треков
    all_coordinates = []
    for track in tracks:
        for point in track.track_points:
            all_coordinates.append((point.latitude, point.longitude))
    
    if not all_coordinates:
        return "<p>Нет данных треков для отображения</p>"
    
    # Центрируем карту
    center_lat = sum(coord[0] for coord in all_coordinates) / len(all_coordinates)
    center_lon = sum(coord[1] for coord in all_coordinates) / len(all_coordinates)
    
    map_obj = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=zoom,
        tiles='OpenStreetMap'
    )
    
    # Цвета для разных треков
    colors = ['blue', 'red', 'green', 'purple', 'orange', 'darkred', 'lightred', 'beige', 'darkblue', 'darkgreen']
    
    for i, track in enumerate(tracks):
        if not track.track_points:
            continue
            
        coordinates = [(point.latitude, point.longitude) for point in track.track_points]
        color = colors[i % len(colors)]
        
        # Добавляем линию трека
        folium.PolyLine(
            coordinates,
            weight=2,
            color=color,
            opacity=0.7,
            tooltip=f"Трек: {track.name}"
        ).add_to(map_obj)
        
        # Добавляем маркеры начала и конца
        if len(coordinates) >= 2:
            folium.Marker(
                coordinates[0],
                popup=f"<b>Начало</b><br>{track.name}",
                tooltip=f"Начало: {track.name}",
                icon=folium.Icon(color='green', icon='play')
            ).add_to(map_obj)
            
            folium.Marker(
                coordinates[-1],
                popup=f"<b>Конец</b><br>{track.name}",
                tooltip=f"Конец: {track.name}",
                icon=folium.Icon(color='red', icon='stop')
            ).add_to(map_obj)
    
    return map_obj._repr_html_()


def create_stats_map(locations: List[models.Location], zoom: int = 12) -> str:
    """Создает карту со статистикой местоположений"""
    if not locations:
        return "<p>Нет данных местоположений для отображения</p>"
    
    # Центрируем карту
    center_lat = sum(loc.latitude for loc in locations) / len(locations)
    center_lon = sum(loc.longitude for loc in locations) / len(locations)
    
    map_obj = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=zoom,
        tiles='OpenStreetMap'
    )
    
    # Добавляем маркеры для каждого местоположения
    for location in locations:
        folium.CircleMarker(
            location=[location.latitude, location.longitude],
            radius=8,
            color='red',
            fill=True,
            popup=f"<b>{location.name}</b><br>Время: {location.timestamp.strftime('%Y-%m-%d %H:%M:%S')}",
            tooltip=location.name
        ).add_to(map_obj)
    
    return map_obj._repr_html_() 