# 🚀 Full Workflow Guide — Real-Time Chat

## 📁 Первый запуск (с нуля)

```powershell
# 1. Клонируй
git clone https://github.com/Ashot-js/realChatBot.git
cd realChatBot

# 2. Установи зависимости
cd server; npm install
cd ..\client; npm install

# 3. Создай .env
cd server
Copy-Item .env.example .env
# Открой .env в VS Code → вставь свои MONGO_URI, JWT_SECRET

# 4. Запусти локально
# Терминал 1:
cd C:\Users\ashgr\Desktop\real-time-chat\server; npm run dev
# Терминал 2 (Ctrl+Shift+5):
cd C:\Users\ashgr\Desktop\real-time-chat\client; npm run dev

# 5. Открой http://localhost:5173
```

---

## 🔄 Изменил код — перезапусти

### Только клиент
Vite сам обновит (HMR). Если нет — `F5` в браузере.

### Только сервер
`Ctrl+C` → `npm run dev`

### И сервер и клиент
Сервер: `Ctrl+C` → `npm run dev`
Клиент: сам обновится

---

## 📤 Запушить изменения в Git

```powershell
cd C:\Users\ashgr\Desktop\real-time-chat

# Добавь изменённые файлы
git add .

# Закоммить
git commit -m "описание изменений"

# Запушить
git push
```

---

## 🚀 Задеплоить (после пуша)

### Бэкенд (Render)
1. [dashboard.render.com](https://dashboard.render.com) → `realchatbot`
2. **Manual Deploy → Deploy latest commit**

Render сам подхватит новый код из GitHub.

### Фронтенд (Firebase)
```powershell
cd C:\Users\ashgr\Desktop\real-time-chat\client
npm run build
firebase deploy --only hosting
```

---

## 🎯 Быстрый редеплой (одной командой)

```powershell
cd C:\Users\ashgr\Desktop\real-time-chat
git add . && git commit -m "update" && git push
# Потом:
cd client && npm run build && firebase deploy --only hosting
# И на Render: Manual Deploy
```

---

## 🔗 Ссылки

| Что | URL |
|---|---|
| Чат | https://realchatbot-app.web.app |
| Бэкенд | https://realchatbot.onrender.com |
| GitHub | https://github.com/Ashot-js/realChatBot |
| Render | https://dashboard.render.com/web/srv-d8m55ksvikkc73c4uu50 |
| Firebase | https://console.firebase.google.com/project/realchatbot-app |
| MongoDB | https://cloud.mongodb.com |
