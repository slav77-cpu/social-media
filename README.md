# Гараж — социална мрежа за автомобили

Социална мрежа, в която потребителите публикуват колите си, коментират и харесват
чужди постове. Коментарите минават през AI модерация, преди да бъдат публикувани.

Проектът е учебен — писан на ръка, за да упражня документна база (MongoDB),
ORM (Prisma) и интеграция с външен AI доставчик.

## Технологии

**Сървър:** Node.js, Express 5, TypeScript, Prisma 6, MongoDB Atlas, JWT, bcrypt, Google Gemini
**Клиент:** React 19, TypeScript, Vite, React Router, Context API

## Функционалности

- Регистрация и вход с JWT токен (парола, хеширана с bcrypt)
- Публикуване, изтриване на постове (само от автора им)
- Коментари, вградени в документа на поста
- Харесвания
- Профили с брой последователи и публикации
- Следване на потребители и отделен feed само от следваните
- Качване на снимки към постовете (валидация за тип и размер до 5 MB)
- AI модерация на коментарите (Google Gemini) — обиди и спам се отхвърлят
- AI описание на снимка (Gemini vision) — предлага текст и хаштагове
- Пагинация на feed-а

## Структура

```
server/
  prisma/schema.prisma    Моделите на базата
  src/routes/             auth, post, user, upload, ai
  src/middlewares/        requireAuth (JWT)
  src/lib/ai.ts           AI модерация и описание на снимки
  uploads/                качените файлове (не влизат в git)
client/
  src/pages/              Feed, Login, Profile
  src/components/         PostCard
  src/context/            AuthContext
  src/lib/api.ts          Обвивка около fetch с токена
```

## Локално стартиране

1. Създай база в MongoDB Atlas и вземи connection string.
2. `server/.env`:

```
DATABASE_URL="mongodb+srv://user:parola@cluster.mongodb.net/social"
JWT_SECRET="dulug-sluchaen-niz"
GEMINI_API_KEY="klyuch-ot-google-ai-studio"
GEMINI_MODEL="gemini-3.6-flash"
```

3. Сървър:

```
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```

4. Клиент (в отделен терминал):

```
cd client
npm install
npm run dev
```

## API

| Метод | Път | Достъп | Описание |
|---|---|---|---|
| POST | /api/auth/register | публичен | Регистрация, връща токен |
| POST | /api/auth/login | публичен | Вход, връща токен |
| GET | /api/posts | публичен | Feed (`?take`, `?skip`, `?following=true`) |
| GET | /api/posts/:id | публичен | Един пост |
| POST | /api/posts | с токен | Нов пост |
| DELETE | /api/posts/:id | автор | Изтриване |
| POST | /api/posts/:id/comments | с токен | Коментар (минава през AI модерация) |
| POST | /api/posts/:id/like | с токен | Харесване (toggle) |
| GET | /api/users/me | с токен | Текущият потребител |
| GET | /api/users/:username | публичен | Профил и постове |
| POST | /api/users/:id/follow | с токен | Следване (toggle) |
| POST | /api/upload | с токен | Качване на снимка (multipart, поле `image`) |
| POST | /api/ai/caption | с токен | AI описание и хаштагове по снимка |

## Решения и компромиси

- **Коментарите са вградени в документа на поста**, а не отделна колекция — четат се
  заедно с него, без JOIN. Компромисът е, че името на автора се дублира във всеки
  коментар и не се променя, ако човекът се преименува.
- **Следването се пази двупосочно** (`following` у мен, `followers` у него) — две
  записвания вместо релационна таблица, но без сканиране при въпроса "кой ме следва".
- **AI модерацията е fail-open** — ако Gemini не отговори, коментарът минава.
  Модерацията е удобство, не защита.
- **Снимките се пазят локално** в `uploads/`. За продукция трябва облачно хранилище
  (S3, Cloudinary), защото дискът на повечето хостинги е ефимерен.

## Предстои

- Тестове (Vitest)
- Деплой (Render + MongoDB Atlas + облачно хранилище за снимките)
