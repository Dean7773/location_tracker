@echo off
chcp 65001 >nul

echo 🚀 Запуск GPS Location Tracker...

REM Проверяем наличие Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker не установлен. Пожалуйста, установите Docker.
    pause
    exit /b 1
)

REM Проверяем наличие Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose не установлен. Пожалуйста, установите Docker Compose.
    pause
    exit /b 1
)

REM Создаем .env файл если его нет
if not exist .env (
    echo 📝 Создание .env файла...
    copy env.example .env
    echo ✅ .env файл создан. Отредактируйте его при необходимости.
)

REM Останавливаем существующие контейнеры
echo 🛑 Остановка существующих контейнеров...
docker-compose down

REM Спрашиваем про удаление образов
set /p remove_images="🗑️  Удалить старые образы? (y/N): "
if /i "%remove_images%"=="y" (
    echo 🧹 Удаление старых образов...
    docker-compose down --rmi all
)

REM Собираем и запускаем контейнеры
echo 🔨 Сборка и запуск контейнеров...
docker-compose up --build -d

REM Ждем запуска сервисов
echo ⏳ Ожидание запуска сервисов...
timeout /t 10 /nobreak >nul

REM Проверяем статус
echo 📊 Статус сервисов:
docker-compose ps

echo.
echo 🎉 GPS Location Tracker запущен!
echo.
echo 📱 Доступные сервисы:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo    API документация: http://localhost:8000/docs
echo.
echo 📋 Полезные команды:
echo    Просмотр логов: docker-compose logs -f
echo    Остановка: docker-compose down
echo    Перезапуск: docker-compose restart
echo.

pause 