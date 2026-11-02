#!/bin/bash
# Пълна (повторна) инициализация на Laravel: пакети, ключ, миграции, тестови данни, кеш.
# Контейнерите трябва да са пуснати (./start.sh).

cd "$(dirname "$0")" || exit 1

if ! docker compose ps | grep -q "Up"; then
    echo "❌ Контейнерите не работят. Първо пуснете ./start.sh"
    exit 1
fi

[ -f backend/.env ] || cp backend/.env.example backend/.env

echo "🔒 Права за storage и bootstrap/cache..."
docker compose exec -T -u root php_fpm chown -R laravel:laravel /var/www/html/storage /var/www/html/bootstrap/cache

echo "📦 Composer пакети..."
docker compose exec php_fpm composer install --no-interaction

if ! grep -q "^APP_KEY=base64:" backend/.env; then
    echo "🔑 Генериране на APP_KEY..."
    docker compose exec php_fpm php artisan key:generate
fi

echo "🗄️  Миграции..."
docker compose exec php_fpm php artisan migrate --force
docker compose exec php_fpm php artisan storage:link 2>/dev/null

read -p "🌱 Да заредя ли тестовите данни (акаунти и инструменти)? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose exec php_fpm php artisan db:seed && touch backend/storage/app/.seeded
fi

echo "🧹 Изчистване на кеша..."
docker compose exec php_fpm php artisan optimize:clear

echo "✅ Laravel е готов!"
