# GPS Tracker Frontend

Современный React фронтенд для системы GPS трекинга, построенный с использованием TypeScript, Tailwind CSS и React Query.

## Технологии

- **React 18** - Основная библиотека для UI
- **TypeScript** - Типизированный JavaScript
- **Tailwind CSS** - Utility-first CSS фреймворк
- **React Router** - Маршрутизация
- **React Query** - Управление состоянием и кэширование
- **React Hook Form** - Управление формами
- **Axios** - HTTP клиент
- **Leaflet** - Интерактивные карты

## Структура проекта

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── Layout.tsx      # Основной layout с навигацией
│   ├── Map.tsx         # Компонент карты
│   ├── ProtectedRoute.tsx # Защищенные маршруты
│   └── TrackViewer.tsx # Просмотр трека
├── contexts/           # React контексты
│   └── AuthContext.tsx # Контекст аутентификации
├── pages/              # Страницы приложения
│   ├── DashboardPage.tsx    # Главная страница
│   ├── LoginPage.tsx        # Страница входа
│   ├── RegisterPage.tsx     # Страница регистрации
│   ├── TracksPage.tsx       # Список треков
│   ├── LocationsPage.tsx    # Список местоположений
│   └── NewTrackPage.tsx     # Создание нового трека
├── services/           # API сервисы
│   └── api.ts         # HTTP клиент и API методы
├── types/              # TypeScript типы
│   └── index.ts       # Интерфейсы и типы
├── App.tsx            # Главный компонент
└── index.tsx          # Точка входа
```

## 🚀 Быстрый старт

### С использованием Docker (рекомендуется)

#### Запуск в составе полного приложения

```bash
# В корне проекта
docker-compose up --build
```

Фронтенд будет доступен по адресу: http://localhost:3000

#### Отдельный запуск фронтенда

```bash
# Сборка образа
docker build -t gps-tracker-frontend .

# Запуск контейнера
docker run -p 3000:80 gps-tracker-frontend
```

### Локальная разработка

#### Предварительные требования

- Node.js 16+ 
- npm или yarn
- Запущенный бэкенд на порту 8000

#### Установка зависимостей

```bash
cd frontend
npm install
```

#### Запуск в режиме разработки

```bash
npm start
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

#### Сборка для продакшена

```bash
npm run build
```

## 🐳 Docker особенности

### Многоэтапная сборка

Dockerfile использует многоэтапную сборку для оптимизации размера образа:

1. **Этап сборки**: Node.js для компиляции React приложения
2. **Этап продакшена**: Nginx для раздачи статических файлов

### Конфигурация Nginx

Файл `nginx.conf` настроен для:

- Проксирования API запросов к бэкенду
- Обработки React Router (SPA)
- Gzip сжатия
- Кэширования статических файлов
- Безопасности (CSP, XSS защита)

### Переменные окружения

```env
REACT_APP_API_URL=http://localhost:8000
```

## Функциональность

### Аутентификация
- Регистрация новых пользователей
- Вход в систему с JWT токенами
- Защищенные маршруты
- Автоматическое перенаправление

### Дашборд
- Общая статистика (треки, расстояние, время)
- Последние треки
- Текущее местоположение на карте
- Быстрые действия

### Управление треками
- Просмотр списка всех треков
- Создание новых треков с GPS отслеживанием
- Детальный просмотр трека с картой
- Статистика трека (расстояние, время, скорость)

### Местоположения
- Просмотр всех сохраненных местоположений
- Детальная информация о каждом местоположении
- Карта всех местоположений
- Ссылки на OpenStreetMap

### Карты
- Интерактивные карты с Leaflet
- Отображение треков как полилиний
- Маркеры начала и конца треков
- Текущее местоположение пользователя

## API интеграция

Фронтенд интегрирован с FastAPI бэкендом через следующие эндпоинты:

- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход
- `GET /dashboard/stats` - Статистика дашборда
- `GET /tracks` - Список треков
- `POST /tracks` - Создание трека
- `GET /tracks/{id}` - Детали трека
- `POST /tracks/points` - Добавление точек трека
- `GET /locations` - Список местоположений
- `POST /locations` - Добавление местоположения

## Переменные окружения

Создайте файл `.env` в корне фронтенда:

```env
REACT_APP_API_URL=http://localhost:8000
```

## Разработка

### Добавление новых страниц

1. Создайте компонент в папке `pages/`
2. Добавьте маршрут в `App.tsx`
3. Обновите навигацию в `Layout.tsx` при необходимости

### Добавление новых API методов

1. Добавьте метод в `services/api.ts`
2. Создайте соответствующие типы в `types/index.ts`
3. Используйте React Query для кэширования

### Стилизация

Используйте Tailwind CSS классы для стилизации. Основные цвета:
- `primary-*` - Основной цвет (синий)
- `gray-*` - Нейтральные цвета
- `red-*` - Ошибки и предупреждения
- `green-*` - Успешные действия

## Структура данных

### Трек
```typescript
interface Track {
  id: number;
  name?: string;
  description?: string;
  distance?: number;
  duration?: number;
  created_at: string;
  user_id: number;
  points?: TrackPoint[];
}
```

### Местоположение
```typescript
interface Location {
  id: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  altitude?: number;
  heading?: number;
  timestamp: string;
  created_at: string;
  user_id: number;
  name?: string;
  description?: string;
}
```

## Производительность

- React Query для кэширования API запросов
- Ленивая загрузка компонентов
- Оптимизированные изображения карт
- Мемоизация компонентов где необходимо

## Безопасность

- JWT токены для аутентификации
- Защищенные маршруты
- Валидация форм на клиенте
- Безопасные HTTP заголовки

## Поддержка браузеров

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Команды Docker

### Сборка образа
```bash
docker build -t gps-tracker-frontend .
```

### Запуск контейнера
```bash
docker run -p 3000:80 gps-tracker-frontend
```

### Просмотр логов
```bash
docker logs <container_id>
```

### Остановка контейнера
```bash
docker stop <container_id>
```

## Отладка

### Локальная разработка
```bash
npm start
```

### Просмотр логов в Docker
```bash
docker-compose logs -f frontend
```

### Проверка конфигурации Nginx
```bash
docker exec -it <container_id> nginx -t
```

## Лицензия

MIT 