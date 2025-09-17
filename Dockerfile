# syntax=docker/dockerfile:1
FROM python:3.11-slim

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    postgresql-client \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Установка рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY requirements.txt .

# Установка Python зависимостей
RUN pip install --no-cache-dir -r requirements.txt

# Копирование исходного кода
COPY . .

# Создание скрипта для запуска с миграциями
RUN echo '#!/bin/bash\n\
echo "Waiting for database..."\n\
while ! pg_isready -h db -p 5432 -U tracker_user; do\n\
  sleep 2\n\
done\n\
echo "Database is ready!"\n\
\n\
echo "Running database migrations..."\n\
alembic upgrade head\n\
\n\
echo "Starting application..."\n\
uvicorn app.main:app --host 0.0.0.0 --port 8000\n\
' > /app/start.sh && chmod +x /app/start.sh

# Открытие порта
EXPOSE 8000

# Запуск приложения с миграциями
CMD ["/app/start.sh"] 