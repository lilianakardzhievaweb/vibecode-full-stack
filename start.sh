#!/bin/bash
# Стартира целия проект: Docker контейнери, зависимости, база данни и тестови данни.
# Употреба:  ./start.sh          - нормално стартиране
#            ./start.sh --seed   - зарежда отново тестовите данни (акаунти, инструменти)

cd "$(dirname "$0")" || exit 1

MYSQL_PASSWORD="vibecode-full-stack-starter-kit_mysql_pass"
SEED_FLAG="backend/storage/app/.seeded"

echo "🚀 Стартиране на AI Tools Hub..."

if ! docker ps &>/dev/null; then
    echo "❌ Docker не работи. Стартирайте Docker Desktop и опитайте отново."
    exit 1
fi

# 1. Настройки на Laravel (създава се само първия път)
if [ ! -f backend/.env ]; then
    echo "📝 Създаване на backend/.env от backend/.env.example..."
    cp backend/.env.example backend/.env
fi

# 2. Контейнери
echo "🐳 Стартиране на контейнерите..."
docker compose up -d --build || exit 1

# 3. Изчакваме MySQL да е готова (до 90 секунди)
echo "⏳ Изчакване на базата данни..."
for i in $(seq 1 45); do
    if docker compose exec -T mysql mysqladmin ping -uroot -p"$MYSQL_PASSWORD" --silent &>/dev/null; then
        break
    fi
    sleep 2
done

# 4. Права за папките, в които Laravel пише (логове, кеш, качени снимки)
docker compose exec -T -u root php_fpm chown -R laravel:laravel /var/www/html/storage /var/www/html/bootstrap/cache

# 5. PHP пакети
if [ ! -f backend/vendor/autoload.php ]; then
    echo "📦 Инсталиране на Composer пакетите (1-2 минути)..."
    docker compose exec -T php_fpm composer install --no-interaction --prefer-dist || exit 1
fi

# 6. Таен ключ на приложението
if ! grep -q "^APP_KEY=base64:" backend/.env; then
    echo "🔑 Генериране на APP_KEY..."
    docker compose exec -T php_fpm php artisan key:generate --force
fi

# 7. Таблици в базата и връзка към качените снимки
echo "🗄️  Миграции..."
docker compose exec -T php_fpm php artisan migrate --force || exit 1
docker compose exec -T php_fpm php artisan storage:link &>/dev/null || true

# 8. Тестови данни - първия път или при ./start.sh --seed
if [ ! -f "$SEED_FLAG" ] || [ "$1" == "--seed" ]; then
    echo "🌱 Зареждане на тестови данни..."
    docker compose exec -T php_fpm php artisan db:seed --force && touch "$SEED_FLAG"
fi

# 9. Изчистваме стар кеш на настройките (в разработка не кешираме config/routes)
docker compose exec -T php_fpm php artisan optimize:clear &>/dev/null

echo ""
echo "✅ Готово!"
echo ""
echo "🌐 Frontend:  http://localhost:8200   (Next.js стартира за ~30 сек. при първо пускане)"
echo "🔧 Backend:   http://localhost:8201"
echo ""
echo "👤 Тестови акаунти (парола: password):"
echo "   owner@example.com     - Owner (администратор, админ панел)"
echo "   backend@example.com   frontend@example.com   pm@example.com"
echo "   qa@example.com        designer@example.com"
echo ""
echo "📋 Полезни команди:"
echo "   docker compose ps                              # статус"
echo "   docker compose logs -f frontend                # логове на Next.js"
echo "   docker compose exec php_fpm php artisan test   # тестове"
echo "   ./stop.sh                                      # спиране"
