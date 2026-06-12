# 🚀 Quick Deploy — Real-Time Chat

> **Windows 11 Pro | VS Code | PowerShell**

---

## 📋 Pre-Deploy Checklist

Пройди каждый пункт перед `git push`:

### 1. `.env` НЕ коммитится
```powershell
git status
```
Видишь `server/.env`? → `git rm --cached server/.env`

### 2. Сильный JWT_SECRET
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Скопируй результат → вставь в `server\.env`:
```env
JWT_SECRET=скопированный-ключ-сюда
```

### 3. Проверь локально
- [x] Регистрация работает
- [x] Приватный чат работает
- [x] Сообщения доходят

### 4. Собери оба проекта
```powershell
cd C:\Users\ashgr\Desktop\real-time-chat\server; npm run build
cd C:\Users\ashgr\Desktop\real-time-chat\client; npm run build
```

### 5. Git Push
```powershell
git init
git add .
git commit -m "Real-Time Chat — MVP ready"
git push
```

---

## ☁️ Deploy Steps

### Step 1: MongoDB Atlas
- Уже создан ✅
- Кластер: `cluster0.vldpczl.mongodb.net`
- User: `ashgr`
- IP: `0.0.0.0/0`

### Step 2: Render (Backend)

1. [render.com](https://render.com) → **New Web Service**
2. Connect GitHub repo
3. Settings:

| Field | Value |
|---|---|
| Name | `real-time-chat-api` |
| Root Directory | `server` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Instance | Free |

4. **Environment Variables:**
```
MONGO_URI=mongodb+srv://ashgr:ТВОЙ_ПАРОЛЬ@cluster0.vldpczl.mongodb.net/real-time-chat?retryWrites=true&w=majority
REDIS_URL=
JWT_SECRET=ТВОЙ_КЛЮЧ
NODE_ENV=production
PORT=5000
CLIENT_URL=https://ТВОЙ_ПРОЕКТ.web.app
```

### Step 3: Firebase Hosting (Frontend)

```powershell
npm install -g firebase-tools
cd C:\Users\ashgr\Desktop\real-time-chat\client
firebase login
firebase init hosting
# → Use existing project
# → Public: dist
# → SPA: Yes
```

Create `client\.env.production`:
```env
VITE_SOCKET_URL=https://real-time-chat-api.onrender.com
```

```powershell
npm run build
firebase deploy --only hosting
```

### Step 4: Update Render

Go back to Render → Environment → Update:
```
CLIENT_URL=https://ТВОЙ_ПРОЕКТ.web.app
```
→ **Manual Deploy → Deploy latest commit**

---

## 🔧 Troubleshooting

| Problem | Fix |
|---|---|
| Server sleeps | Render free tier sleeps after 15min; first request wakes it (30s delay) |
| CORS error | `CLIENT_URL` without trailing `/` |
| Socket not connecting | Check `VITE_SOCKET_URL` matches Render URL |

---

## 📊 Free Limits

| Service | Limit |
|---|---|
| MongoDB Atlas | 512 MB |
| Render | 750 hrs/mo |
| Firebase | 10 GB/mo |
