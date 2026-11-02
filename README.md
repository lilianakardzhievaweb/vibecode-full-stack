# AI Tools Hub

Вътрешна платформа, в която екипът споделя AI инструментите, с които работи: кой инструмент за какво е подходящ, за коя роля, как се използва и колко е полезен според колегите.

Проектът е изграден в рамките на **Vibecode Academy** върху Full Stack Starter Kit (Laravel + Next.js + Docker).

**Автор:** Лилиана Кърджиева · [github.com/lilianakardzhievaweb](https://github.com/lilianakardzhievaweb)

---

## Съдържание

1. [Функционалности](#функционалности)
2. [Технологии](#технологии)
3. [Инсталация и стартиране с Docker](#инсталация-и-стартиране-с-docker)
4. [Тестови акаунти](#тестови-акаунти)
5. [Ролева система и права](#ролева-система-и-права)
6. [Как се добавят инструменти](#как-се-добавят-инструменти)
7. [Двуфакторна автентикация (2FA)](#двуфакторна-автентикация-2fa)
8. [Админ панел](#админ-панел)
9. [Кеширане и одит лог](#кеширане-и-одит-лог)
10. [API](#api)
11. [Структура на проекта](#структура-на-проекта)
12. [Тестове](#тестове)
13. [AI агенти и документация](#ai-агенти-и-документация)
14. [Чести проблеми](#чести-проблеми)

---

## Функционалности

| Област | Какво има |
|---|---|
| **Вход и сигурност** | Вход с имейл и парола (Laravel Sanctum, бисквитки), **2FA с Google Authenticator**, резервни кодове, ограничение на опитите за вход |
| **Роли** | 6 роли (owner, backend, frontend, pm, qa, designer). Менюто и достъпът зависят от ролята. Route-овете се пазят с middleware `role:` |
| **AI инструменти** | Добавяне, редакция и изтриване. Описание, начин на употреба, примери, линкове, документация (markdown), до 5 снимки, ниво на трудност |
| **Каталог** | Карти с инструменти, търсене, филтри по роля, категория и таг, подреждане по дата, рейтинг или име, страници |
| **Одобрение** | Новите предложения чакат одобрение от администратор. Авторът вижда статуса и причината при отказ |
| **Админ панел** | Всички инструменти с филтри по статус, категория и роля, одобрение и отказ, смяна на ролите, одит лог |
| **Кеширане** | Категориите и броят на инструментите се кешират в Redis и се изчистват автоматично при промяна |
| **Одит лог** | Кой какво е направил и кога: вход, добавяне, редакция, одобрение, смяна на роли, 2FA |
| **Коментари и рейтинг** (бонус) | Оценка от 1 до 5 звезди и коментари към всеки одобрен инструмент |
| **Интерфейс** | Tailwind CSS, адаптивен за мобилни устройства, модални прозорци, toast съобщения, достъпност (контраст, етикети, навигация с клавиатура) |

## Технологии

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, порт **8200**
- **Backend:** Laravel 12, PHP 8.2, Laravel Sanctum, Laravel Breeze (API), порт **8201**
- **База данни:** MySQL 8.0, порт 8203
- **Кеш и сесии:** Redis 7, порт 8204
- **Среда:** Docker Compose (nginx + php-fpm + mysql + redis + node)

## Инсталация и стартиране с Docker

### Какво ви трябва

- [Docker Desktop](https://www.docker.com/products/docker-desktop/), стартиран
- Git (на Windows: Git Bash, за да работят `.sh` скриптовете)
- Свободни портове 8200–8205

### Стъпки

```bash
# 1. Клонирайте проекта
git clone https://github.com/lilianakardzhievaweb/vibecode-full-stack.git
cd vibecode-full-stack

# 2. Стартирайте всичко с една команда
./start.sh
```

`start.sh` прави следното, като пропуска вече направеното:

1. създава `backend/.env` от `backend/.env.example`;
2. стартира контейнерите (`docker compose up -d --build`);
3. инсталира Composer пакетите;
4. генерира `APP_KEY`;
5. пуска миграциите и `storage:link` (за снимките);
6. при първо стартиране зарежда тестовите данни: потребители, категории, инструменти, оценки.

След това отворете **http://localhost:8200**. При първото пускане Next.js инсталира npm пакетите и компилира, затова изчакайте около 30–60 секунди.

### Ръчно, без скрипта

```bash
cp backend/.env.example backend/.env
docker compose up -d --build
docker compose exec php_fpm composer install
docker compose exec php_fpm php artisan key:generate
docker compose exec php_fpm php artisan migrate --seed
docker compose exec php_fpm php artisan storage:link
```

### Други команди

```bash
./stop.sh                                        # спира контейнерите
./start.sh --seed                                # зарежда отново тестовите данни
docker compose logs -f frontend                  # логове на Next.js
docker compose exec php_fpm php artisan test     # backend тестове
./db-manage.sh connect                           # MySQL конзола
docker compose down -v                           # спира и ИЗТРИВА базата (чисто начало)
```

## Тестови акаунти

Паролата на всички е **`password`**. На страницата за вход има бутони, които попълват формата.

| Имейл | Роля | Какво може да тества |
|---|---|---|
| `owner@example.com` | Owner (администратор) | Админ панел, одобрение и отказ, смяна на роли, одит лог |
| `backend@example.com` | Backend Developer | Добавяне на инструмент (отива за одобрение), рейтинг, коментари |
| `frontend@example.com` | Frontend Developer | Има чакащо предложение („v0 by Vercel“) |
| `pm@example.com` | Project Manager | Каталог, филтри, рейтинг |
| `qa@example.com` | QA | Има **отказано** предложение („Testim“) с причина и може да го поправи |
| `designer@example.com` | Designer | Има чакащо предложение („Figma AI“) |

Акаунтите се създават от `backend/database/seeders/DatabaseSeeder.php`.

## Ролева система и права

| Действие | owner | останалите роли |
|---|:---:|:---:|
| Преглед на одобрените инструменти, рейтинг, коментари | ✅ | ✅ |
| Предлагане на нов инструмент | ✅ публикува се веднага | ✅ чака одобрение |
| Редакция и изтриване на **свой** инструмент | ✅ | ✅ |
| Редакция и изтриване на **чужд** инструмент | ✅ | ❌ |
| Изтриване на чужд коментар | ✅ | ❌ |
| Админ панел (`/admin`, `/api/admin/*`) | ✅ | ❌ (403) |
| Смяна на роли на потребители | ✅ (без собствената) | ❌ |

Как е реализирано:

- **Middleware** `EnsureUserHasRole` (`backend/app/Http/Middleware`), регистриран като `role` в `bootstrap/app.php`. Употреба: `Route::middleware('role:owner')`.
- **Policies:** `ToolPolicy` (view, update, delete, interact) и `ToolCommentPolicy` (delete).
- **Frontend:** `src/lib/roles.ts` описва кои секции от менюто вижда всяка роля (`NAV_ITEMS`). Защитата винаги е и в Laravel, а frontend-ът само скрива недостъпното.

Нова роля се добавя в `User::ROLES` (backend) и `ROLE_LABELS` (frontend). За да е избираема като „подходяща роля“ за инструмент, се добавя и в `RoleSeeder`.

## Как се добавят инструменти

1. Влезте и натиснете **„Добави“** в менюто (или „+ Добави инструмент“).
2. Попълнете задължителните полета: **Име**, **Линк**, **Описание**, **Как се използва**, поне една **роля** и една **категория**. Липсваща категория може да добавите директно от формата.
3. По желание добавете тагове (разделени със запетая), примери, линкове, документация в markdown, снимки (до 5 по 2 MB), видео и ниво на трудност.
4. Натиснете **„Добави инструмента“**:
   - ако сте **owner**, инструментът се публикува веднага;
   - иначе получава статус **„Чака одобрение“** и се вижда само от вас (в „Профил → Моите предложения“) и от администратора.
5. Администраторът го одобрява или отказва от **Админ панел**. При отказ виждате причината, а след редакция инструментът отива отново за преглед.

Чрез API: `POST /api/tools` с `multipart/form-data` (вижте [API](#api)).

## Двуфакторна автентикация (2FA)

Използва стандарта **TOTP (RFC 6238)**, същия като на Google Authenticator, Microsoft Authenticator и Authy. Реализацията е собствена, без външни пакети: `backend/app/Services/TwoFactorAuthenticator.php`. Проверена е с официалните тестови стойности от RFC 6238.

**Включване:** Профил → „Включи 2FA“ → сканирайте QR кода → въведете 6-цифрения код → запазете 8-те резервни кода.

**Вход с 2FA:**

1. `POST /login` с вярна парола връща `{"two_factor": true}`, без да влиза.
2. Frontend-ът показва поле за код.
3. `POST /two-factor-challenge` с `code` (или `recovery_code`) завършва входа.

Тайният ключ и резервните кодове се пазят **криптирани** в базата. Опитите за код са ограничени до 5 в минута. Всеки резервен код важи само веднъж. Изключването изисква паролата.

## Админ панел

Достъпен на **http://localhost:8200/admin** само за роля `owner`.

- **Инструменти:** филтри по статус (с броячи), категория, роля и име. Бутони „Одобри“ и „Откажи“, като при отказ се отваря модален прозорец за причината.
- **Потребители:** списък с роля, 2FA статус и брой инструменти. Ролята се сменя от падащо меню.
- **Одит лог:** хронология на действията с филтър по тип, потребител, IP и час.

## Кеширане и одит лог

**Кеш (Redis):**

| Ключ | Съдържание | Валидност | Изчиства се при |
|---|---|---|---|
| `categories.all` | Списъкът с категории | 1 час | нова/променена категория (`Category::booted`) |
| `tools.stats` | Брой инструменти по статус и топ категории | 10 мин. | всяка промяна на инструмент (`Tool::flushStatsCache`) |

Кешът се използва в `CategoryController@index`, `StatsController` (таблото) и броячите в админ панела.

**Одит лог:** таблица `activity_logs`. Записва се с `ActivityLogger::log('tool.approved', $tool, 'Одобри ...')`. Действия: `auth.login`, `auth.logout`, `tool.created`, `tool.updated`, `tool.deleted`, `tool.approved`, `tool.rejected`, `tool.rated`, `comment.created`, `comment.deleted`, `category.created`, `user.role_changed`, `two_factor.enabled`, `two_factor.disabled`, `profile.updated`.

## API

Всички `/api/*` маршрути изискват вход (Sanctum, бисквитки).

| Метод | Адрес | Описание |
|---|---|---|
| POST | `/login`, `/logout` | Вход и изход |
| POST | `/two-factor-challenge` | Втора стъпка на входа (2FA) |
| GET | `/api/user` | Текущият потребител |
| PUT | `/api/profile` | Смяна на име и парола |
| POST / DELETE | `/api/two-factor` | Започва включване / изключва 2FA |
| POST | `/api/two-factor/confirm` | Потвърждава 2FA с код |
| GET | `/api/stats` | Статистики за таблото (кеширани) |
| GET | `/api/tools` | Списък. Параметри: `search`, `role`, `category`, `tag`, `sort` (latest, rating, name), `mine=1`, `per_page` |
| POST | `/api/tools` | Нов инструмент |
| GET / PUT / DELETE | `/api/tools/{id}` | Преглед, редакция, изтриване |
| GET / POST | `/api/tools/{id}/comments` | Коментари |
| DELETE | `/api/comments/{id}` | Изтриване на коментар |
| PUT | `/api/tools/{id}/rating` | Оценка `{ "rating": 1-5 }` |
| GET / POST | `/api/categories` | Категории (кеширани) |
| GET | `/api/roles`, `/api/tags` | Роли и тагове |
| GET | `/api/admin/tools` | **owner:** всички инструменти + броячи по статус |
| POST | `/api/admin/tools/{id}/approve` | **owner:** одобрение |
| POST | `/api/admin/tools/{id}/reject` | **owner:** отказ `{ "reason": "..." }` |
| GET | `/api/admin/users` | **owner:** потребители |
| PUT | `/api/admin/users/{id}/role` | **owner:** смяна на роля |
| GET | `/api/admin/activity` | **owner:** одит лог (`action`, `user_id`) |

## Структура на проекта

```
vibecode-full-stack/
├── backend/                       Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/      ToolController, StatsController, TwoFactorController...
│   │   │   ├── Admin/             ToolModeration, User, ActivityLog
│   │   │   └── Auth/              вход, изход, 2FA challenge (Breeze)
│   │   ├── Http/Middleware/       EnsureUserHasRole
│   │   ├── Models/                User, Tool, Category, Role, Tag, ToolComment, ToolRating, ActivityLog
│   │   ├── Policies/              ToolPolicy, ToolCommentPolicy
│   │   └── Services/              TwoFactorAuthenticator (TOTP), ActivityLogger
│   ├── database/migrations/       таблици
│   ├── database/seeders/          тестови акаунти и данни
│   ├── routes/api.php, auth.php   маршрути
│   └── tests/Feature/             тестове
├── frontend/                      Next.js 15
│   └── src/
│       ├── app/                   страници: dashboard, tools, profile, admin, login
│       ├── components/            Header, ToolCard, ToolForm, Modal, StarRating, QrCode...
│       ├── context/               UserContext (влезлият потребител), ToastContext
│       └── lib/                   api.ts, types.ts, roles.ts, qrcode.ts
├── docs/                          ръководства по дни + AI_AGENTS.md
├── docker/, nginx/                конфигурация на контейнерите
├── docker-compose.yml
├── start.sh / stop.sh             стартиране и спиране
└── CLAUDE.md                      контекст за AI агент за разработка
```

## Тестове

```bash
docker compose exec php_fpm php artisan test
```

Тестовете (`backend/tests/Feature`) покриват:

- вход, изход и регистрация (Breeze);
- одобрение: нов инструмент е pending, скрит е за другите, owner одобрява и отказва, достъпът до `/api/admin/*` е 403 за други роли;
- 2FA: тестовите стойности от RFC 6238, включване, вход с код, грешен код, резервен код, изключване;
- коментари и рейтинг;
- кешираните статистики се обновяват след промяна.

Тестовете ползват SQLite в паметта (`phpunit.xml`), затова не пипат базата за разработка.

## AI агенти и документация

- **[`CLAUDE.md`](CLAUDE.md)** – контекст за AI агент за разработка (Claude Code, Cursor, Copilot): архитектура, команди и правила на проекта. Агентите го четат автоматично.
- **[`docs/AI_AGENTS.md`](docs/AI_AGENTS.md)** – как беше използван AI по време на обучението, кои агенти са подходящи и **готови начални промптове** за продължаване на разработката.
- `docs/Ден6_…docx`, `docs/Ден7_…docx` – ръководства стъпка по стъпка за вход и роли и за AI инструментите.

## Чести проблеми

| Проблем | Решение |
|---|---|
| Frontend-ът показва „Няма връзка с бекенда“ | `docker compose ps`: всички контейнери трябва да са `Up`. Вижте `docker compose logs php_fpm` |
| 419 / CSRF грешка при вход | В `backend/.env`: `SANCTUM_STATEFUL_DOMAINS=localhost:8200` и `SESSION_DOMAIN=localhost`, после `docker compose exec php_fpm php artisan optimize:clear` |
| След `git pull` нова страница дава „route not found“ | Next.js не е видял новите папки (Docker на Windows): `docker compose restart frontend` |
| Снимките не се показват | `docker compose exec php_fpm php artisan storage:link` |
| Няма тестови акаунти | `./start.sh --seed` |
| 2FA кодът се отхвърля | Часът на телефона трябва да е автоматичен (кодът зависи от точното време) |
| Порт е зает | Спрете приложението, което го използва, или сменете портовете в `docker-compose.yml` |
| Искам чиста база | `docker compose down -v && ./start.sh --seed` |
