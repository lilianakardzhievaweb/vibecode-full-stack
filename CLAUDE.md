# CLAUDE.md – контекст за AI агент за разработка

Този файл се чете автоматично от Claude Code (и може да се даде на Cursor, Copilot и други агенти).
Описва проекта, за да може агентът да продължи разработката, без да го обясняваме отначало.

## Проектът

**AI Tools Hub** е вътрешна платформа за споделяне на AI инструменти в екип: каталог, роли, одобрение от администратор, 2FA, одит лог, рейтинг и коментари.
Езикът на интерфейса, съобщенията за грешки и коментарите в кода е **български**.

## Стек и портове

- `frontend/`: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS 4, http://localhost:8200
- `backend/`: Laravel 12 + Sanctum (SPA вход с бисквитки) + Breeze API, http://localhost:8201
- MySQL 8 (8203), Redis 7 (8204, кеш и сесии). Всичко работи в Docker Compose.

## Команди

```bash
./start.sh                                            # стартира всичко (миграции, тестови данни първия път)
./start.sh --seed                                     # зарежда отново тестовите данни
docker compose exec php_fpm php artisan test          # backend тестове - пускай ги след промяна в backend
docker compose exec php_fpm php artisan migrate       # нови миграции
docker compose exec php_fpm php artisan route:list --except-vendor
docker compose exec frontend npm run lint             # ESLint за frontend
docker compose logs -f frontend                       # грешки при компилация на Next.js
```

Artisan и composer **винаги** през `docker compose exec php_fpm ...`, не локално.

## Архитектура

### Backend (`backend/app`)
- `Models/Tool.php`: статуси `pending`, `approved`, `rejected`. Scope-ове `visibleTo($user)` и `withRatingInfo($userId)`. Кешът на статистиките се изчиства в `booted()` и с `Tool::flushStatsCache()` (след `sync()` на връзки, защото те не пускат model events).
- `Models/User.php`: `ROLES`, `isOwner()`, `hasRole()`, `hasTwoFactorEnabled()`. 2FA полетата са с cast `encrypted`.
- `Http/Middleware/EnsureUserHasRole.php`: alias `role` (`->middleware('role:owner')`).
- `Policies/ToolPolicy.php`: `view`, `update`, `delete`, `interact` (коментари и рейтинг само за одобрени).
- `Services/TwoFactorAuthenticator.php`: собствена TOTP реализация (RFC 6238), без външни пакети.
- `Services/ActivityLogger.php`: `ActivityLogger::log($action, $subject, $description, $properties)`. **Всяко ново действие, което променя данни, се логва.**
- `Http/Controllers/Admin/*`: само за owner, под `routes/api.php → prefix('admin')`.
- Входът е в `Auth/AuthenticatedSessionController` (при 2FA връща `{two_factor:true}`) и в `Auth/TwoFactorChallengeController`.

### Frontend (`frontend/src`)
- `lib/api.ts`: `apiFetch()` (CSRF + бисквитки) и `apiJson<T>()`, който хвърля `ApiError` с `.errors` и `.firstMessage`. **Използвай `apiJson` за нови заявки.**
- `lib/types.ts`: типовете на отговорите от API-то. Обновявай ги заедно с `ToolResource`.
- `lib/roles.ts`: етикети на ролите и `NAV_ITEMS` (кое меню вижда всяка роля).
- `context/UserContext.tsx`: `useUser({ redirectToLogin, roles })`. `context/ToastContext.tsx`: `useToast().success/error/info`.
- Компоненти: `Card`, `Badge`/`StatusBadge`, `Modal`, `ToolCard`, `ToolForm`, `StarRating`, `QrCode`, `States` (Loading, EmptyState).
- Стилове: Tailwind 4 + собствени utility класове в `app/globals.css` (`btn-primary`, `btn-secondary`, `btn-danger`, `btn-success`, `btn-sm`, `input`, `label`, `page`, `page-title`).

## Правила

1. Защитата на данни и права е **в Laravel** (middleware, policy, validation). Frontend-ът само скрива недостъпното.
2. Съобщенията за валидация са на български (вижте `ToolRequest::messages()`).
3. Нова таблица или колона = нова миграция. Старите миграции не се редактират.
4. Нов endpoint = маршрут в `routes/api.php` + Feature тест в `backend/tests/Feature` + ред в таблицата „API“ в `README.md`.
5. UI: мобилен изглед първо (`sm:`, `md:`, `lg:`), видими етикети или `sr-only` за полета, контраст поне AA, toast след успешно действие.
6. Тестови акаунти: `<роля>@example.com` / `password` (`DatabaseSeeder::TEST_USERS`). Seeder-ите трябва да могат да се пускат многократно (`updateOrCreate`).
7. Не комитвай `.env`, `vendor/`, `node_modules/`.

## Идеи за следващи стъпки

Вижте `docs/AI_AGENTS.md` → „Начални промптове“.
