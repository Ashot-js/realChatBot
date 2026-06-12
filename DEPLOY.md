# 🚀 Deployment Guide + Pre-Push Checklist

> **ОС:** Windows 11 Pro | **Редактор:** Visual Studio Code | **Терминал:** PowerShell  
> **ВНИМАНИЕ:** Перед пушем в Git и деплоем — обязательно пройди этот чеклист!

---

## 🖥️ Советы по VS Code на Windows 11

| Действие | Горячие клавиши |
|---|---|
| Открыть терминал | `` Ctrl + ` `` |
| Разделить терминал | `Ctrl + Shift + 5` |
| Новый терминал | `` Ctrl + Shift + ` `` |
| Открыть папку проекта | `code C:\Users\ashgr\Desktop\real-time-chat` |
| Source Control (Git) | `Ctrl + Shift + G` |

### Как запускать сервер + клиент одновременно

В VS Code открой **два терминала рядом**:

1. `` Ctrl + ` `` — открыть терминал
2. `Ctrl + Shift + 5` — разделить пополам
3. Левый терминал → `cd server; npm run dev`
4. Правый терминал → `cd client; npm run dev`

### Рекомендуемые расширения VS Code

- **ES7+ React/Redux/React-Native snippets** (dsky)
- **Tailwind CSS IntelliSense** (Tailwind Labs)
- **Prettier** (форматирование кода)
- **Thunder Client** (тестирование API — вместо Postman)

### Windows 11: права администратора

Если npm выдаёт ошибки прав доступа (`EACCES`), запусти VS Code от администратора (ПКМ → Запуск от имени администратора).

---

## 🔒 Pre-Push Checklist (перед `git push`)

### 1. Убедись, что `.env` в `.gitignore`

Проверь, что `server\.env` **НЕ** попадёт в коммит.

В VS Code: `Ctrl + Shift + G` → посмотри список изменённых файлов.  
Или в терминале:

```powershell
git status
```

В корневом `.gitignore` уже прописаны `*.env` и `.env.*`. Если видишь `server/.env` в staged — немедленно удали:

```powershell
git rm --cached server/.env
```

### 2. Установи сильный `JWT_SECRET`

Скопируй `server\.env.example` в `server\.env`:

```powershell
# В терминале PowerShell (из корня проекта):
Copy-Item server\.env.example server\.env
```

Теперь сгенерируй случайный ключ и вставь его в `server\.env`:

```powershell
# Способ 1 — через Node.js (работает везде):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Способ 2 — чисто PowerShell (если Node ещё не установлен):
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
```

Скопируй результат и вставь в `server\.env`:

```env
JWT_SECRET=сгенерированная-строка-сюда
```

**Важно:** открой `server\.env` в VS Code и замени **все** `<...>` плейсхолдеры на реальные значения!

### 3. Проверь работоспособность локально

Открой VS Code → раздели терминал (`Ctrl + Shift + 5`):

**Левый терминал — сервер:**
```powershell
cd server
npm run dev
```

**Правый терминал — клиент:**
```powershell
cd client
npm run dev
```

- [ ] Регистрация работает
- [ ] Вход работает
- [ ] Приватный чат работает
- [ ] Групповой чат создаётся
- [ ] Файлы загружаются

### 4. Проверь сборку клиента

```powershell
cd client
npm run build
```

Если сборка проходит без ошибок — ✅.  
В Проводнике появится папка `client\dist\`.

### 5. Проверь компиляцию сервера

```powershell
cd server
npm run build
```

Убедись, что в `server\dist\` появились скомпилированные файлы.

### 6. Проверь `.gitignore` ещё раз

Убедись, что **эти папки не коммитятся:**
- `node_modules\`
- `server\dist\`
- `client\dist\`
- `server\uploads\`

### 7. Финальная проверка перед пушем

```powershell
git status
git diff --staged
```

В staged должны быть **только твои исходники**, никаких `.env`, `node_modules`, `dist`.

### 8. Git Push (терминал VS Code)

```powershell
git add .
git commit -m "Initial commit: Real-Time Chat full project"
git push
```

---

## ☁️ Deployment (Деплой)

### Архитектура деплоя

| Компонент | Платформа | Стоимость |
|---|---|---|
| **Frontend** (React) | Firebase Hosting | Бесплатно |
| **Backend** (Node + Socket.IO) | Render | Бесплатно |
| **Database** (MongoDB) | MongoDB Atlas | Бесплатно (512 MB) |
| **Cache** (Redis) | Upstash Redis | Бесплатно (256 MB) |

---

### Шаг 1: MongoDB Atlas

1. Открой браузер → [cloud.mongodb.com](https://cloud.mongodb.com) → Create Free Cluster
2. После создания: **Database Access** → Add User (логин/пароль)
3. **Network Access** → Add IP `0.0.0.0/0` (разрешить отовсюду)
4. **Connect** → Drivers → Скопируй connection string:

```
mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/real-time-chat?retryWrites=true&w=majority
```

Замени `<user>` и `<password>` на свои.

### Шаг 2: Upstash Redis

1. Открой [console.upstash.com](https://console.upstash.com) → Sign Up (через GitHub/Google)
2. **Create Database** → регион: **`eu-west-1`** (Ирландия — лучший пинг для РФ/Армении) → Create
3. После создания — скопируй **REDIS_URL** (кнопка Copy):

```
redis://default:password@your-db.upstash.io:6379
```

Всё! Upstash не требует ручного добавления пароля — URL уже готов.

### Шаг 3: Render (Backend)

1. Открой [render.com](https://render.com) → Sign Up (через GitHub)
2. **New → Web Service**
3. Подключи свой GitHub репозиторий
4. Настройки:

| Поле | Значение |
|---|---|
| **Name** | `real-time-chat-api` |
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

5. **Environment Variables** (кнопка Add Environment Variable):

```
MONGO_URI        = твой MongoDB Atlas URI
REDIS_URL        = твой Redis Cloud URL
JWT_SECRET       = твой секретный ключ
NODE_ENV         = production
PORT             = 5000
CLIENT_URL       = https://твой-проект.web.app
```

6. Нажми **Create Web Service**. Render выдаст URL вида:
   `https://real-time-chat-api.onrender.com`

### Шаг 4: Firebase Hosting (Frontend)

1. Открой [console.firebase.google.com](https://console.firebase.google.com)
2. Create Project → Назови, например, `real-time-chat-app`
3. Установи Firebase CLI **в терминале VS Code (PowerShell)**:

```powershell
npm install -g firebase-tools
```

> **Важно для Windows:** если `firebase` не распознаётся после установки — закрой и открой терминал заново.

4. Логин в Firebase и инициализация:

```powershell
cd client
firebase login
firebase init hosting
```

Ответь на вопросы:
- **Use an existing project** → выбери созданный проект
- **Public directory** → `dist`
- **Single-page app** → Yes
- **Overwrite index.html** → No

5. Создай файл `client\.env.production` (в VS Code: ПКМ в папке client → New File):

```env
VITE_SOCKET_URL=https://real-time-chat-api.onrender.com
```

6. Собери и деплой:

```powershell
npm run build
firebase deploy --only hosting
```

Firebase выдаст URL: `https://real-time-chat-app.web.app`

### Шаг 5: Обнови CLIENT_URL на Render

После деплоя фронтенда, вернись в Render → Environment → обнови:

```
CLIENT_URL = https://real-time-chat-app.web.app
```

Нажми **Save Changes** и **Manual Deploy → Deploy latest commit**.

---

## 🔧 Устранение проблем (Windows)

### PowerShell: политика выполнения скриптов

Если видишь ошибку «выполнение сценариев отключено»:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js не установлен

Скачай с [nodejs.org](https://nodejs.org) → версия **LTS** (20.x или 22.x).  
При установке отметь галочку **«Automatically install the necessary tools»**.

### VS Code: терминал по умолчанию

Проверь, что в VS Code выбран PowerShell:
1. `` Ctrl + Shift + P ``
2. Напиши: `Terminal: Select Default Profile`
3. Выбери **PowerShell**

### Socket.IO не подключается

- Проверь, что `CLIENT_URL` на Render совпадает с Firebase-доменом
- Проверь, что в `client\.env.production` стоит правильный `VITE_SOCKET_URL`
- Render free tier засыпает после 15 мин неактивности — первый запрос разбудит (30 сек задержка)

### CORS ошибка

- Убедись, что `CLIENT_URL` в env Render указан без слеша в конце:
  ```
  ✅ https://my-app.web.app
  ❌ https://my-app.web.app/
  ```

### Файлы не загружаются

- Render free tier даёт только 1 GB диска — не храни много файлов
- Для продакшена лучше использовать Cloudinary, S3 или Firebase Storage

### Пути в Windows (\ vs /)

В PowerShell работают **оба** варианта. Но в `package.json` скриптах используй `/` (кроссплатформенно).  
В терминале PowerShell можно писать `cd server` или `cd .\server\` — без разницы.

---

## 📊 Бесплатные лимиты

| Сервис | Лимит |
|---|---|
| **MongoDB Atlas** | 512 MB storage, shared RAM |
| **Upstash Redis** | 256 MB, безлимит коннектов |
| **Render** | 750 часов/мес, засыпает при неактивности |
| **Firebase Hosting** | 10 GB/мес трафик, 1 GB storage |

**Итого:** весь стек бесплатный для разработки и небольшого продакшена.  
Комфортно работает на **Windows 11 Pro** в **Visual Studio Code**.

---

## 🎯 Быстрый старт (шпаргалка)

```powershell
# 1. Установка зависимостей
cd C:\Users\ashgr\Desktop\real-time-chat
cd server; npm install
cd ..\client; npm install

# 2. Копируем и заполняем .env
Copy-Item server\.env.example server\.env
# → Открыть server\.env в VS Code, заполнить все поля

# 3. Запуск (два терминала VS Code)
# Терминал 1:
cd C:\Users\ashgr\Desktop\real-time-chat\server; npm run dev
# Терминал 2:
cd C:\Users\ashgr\Desktop\real-time-chat\client; npm run dev

# 4. Открыть в браузере
# http://localhost:5173
```

---

## 🎯 Порядок действий (кратко)

1. ✅ Пройти **Pre-Push Checklist** выше
2. ✅ `git add . && git commit -m "Initial commit" && git push`
3. ✅ Создать MongoDB Atlas кластер
4. ✅ Создать Upstash Redis базу
5. ✅ Залить бэкенд на Render
6. ✅ Залить фронтенд на Firebase
7. ✅ Обновить `CLIENT_URL` на Render
8. ✅ Открыть Firebase URL и тестировать!
