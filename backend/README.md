# Backend – AI Tools Hub (Laravel API)

Laravel 12 + Sanctum. Работи в Docker на http://localhost:8201.

Инструкциите за инсталация, ролите и API-то са в главния [README.md](../README.md).
Архитектурата и правилата за разработка са в [CLAUDE.md](../CLAUDE.md).

```bash
docker compose exec php_fpm php artisan test
docker compose exec php_fpm php artisan route:list --except-vendor
```
