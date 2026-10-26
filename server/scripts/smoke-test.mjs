// End-to-end check of the chat API and Socket.IO against a running server.
// Usage: API_BASE=http://localhost:5000 npm run smoke
// Creates three throwaway users (smoke-*) and their chats/messages.
import { io } from 'socket.io-client';

const BASE = process.env.API_BASE || `http://localhost:${process.env.PORT || 5000}`;
let failed = 0;

function check(name, ok, extra = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` ${extra}`}`);
  if (!ok) failed++;
}

async function call(method, path, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body) headers['content-type'] = 'application/json';
  const res = await fetch(BASE + path, { method, headers, body: form ?? (body && JSON.stringify(body)) });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, res };
}

const connect = (token) =>
  new Promise((resolve, reject) => {
    const s = io(BASE, { auth: { token }, transports: ['websocket'], reconnection: false });
    s.on('connect', () => resolve(s));
    s.on('connect_error', reject);
  });

const waitFor = (socket, event, ms = 3000) =>
  new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    socket.once(event, (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });

const stamp = Date.now().toString(36);
const mk = async (n) => {
  const r = await call('POST', '/api/auth/register', {
    body: { username: `smoke-${n}-${stamp}`, email: `smoke-${n}-${stamp}@example.com`, password: 'secret-123' },
  });
  return { token: r.json?.token, id: r.json?.user?._id, status: r.status, user: r.json?.user };
};

// ---- Auth ----
check('health', (await call('GET', '/api/health')).status === 200);
const a = await mk('a');
const b = await mk('b');
const c = await mk('c');
check('register', a.status === 201 && a.token && !('password' in a.user));
check('duplicate register 409', (await call('POST', '/api/auth/register', { body: { username: `smoke-a-${stamp}`, email: `x${stamp}@example.com`, password: 'secret-123' } })).status === 409);
check('bad username 400', (await call('POST', '/api/auth/register', { body: { username: '<b>', email: `y${stamp}@example.com`, password: 'secret-123' } })).status === 400);
check('wrong password 401', (await call('POST', '/api/auth/login', { body: { email: `smoke-a-${stamp}@example.com`, password: 'nope' } })).status === 401);
check('login', (await call('POST', '/api/auth/login', { body: { email: `SMOKE-A-${stamp}@example.com`, password: 'secret-123' } })).status === 200);
check('me', (await call('GET', '/api/auth/me', { token: a.token })).json?.user?._id === a.id);
check('no token 401', (await call('GET', '/api/auth/me')).status === 401);

// ---- Users ----
const search = await call('GET', `/api/users/search?q=smoke-b-${stamp}`, { token: a.token });
check('search', search.json?.users?.length === 1 && !('email' in search.json.users[0]));
check('regex search is literal', (await call('GET', '/api/users/search?q=.*', { token: a.token })).json?.users?.length === 0);
check('bad user id 404', (await call('GET', '/api/users/nope', { token: a.token })).status === 404);

// ---- Real-time: B learns about a new chat without reloading ----
const sa = await connect(a.token);
const sb = await connect(b.token);
const sc = await connect(c.token);
const newChatForB = waitFor(sb, 'chat:new');
const priv = await call('POST', '/api/chats/private', { token: a.token, body: { userId: b.id } });
check('create private chat', priv.status === 201);
const chatId = priv.json?.chat?._id;
check('B is told about the new chat', (await newChatForB)?._id === chatId);
check('same chat returned again', (await call('POST', '/api/chats/private', { token: a.token, body: { userId: b.id } })).json?.chat?._id === chatId);
check('chat with self 400', (await call('POST', '/api/chats/private', { token: a.token, body: { userId: a.id } })).status === 400);

const gotByB = waitFor(sb, 'message:new');
sa.emit('message:send', { chatId, content: 'hello', type: 'text' });
const msg = await gotByB;
check('B receives the first message live', msg?.content === 'hello' && msg?.sender?.username === `smoke-a-${stamp}`);

// ---- Privacy: C is not a member ----
check('outsider cannot read history', (await call('GET', `/api/messages/${chatId}`, { token: c.token })).status === 404);
check('outsider cannot open chat', (await call('GET', `/api/chats/${chatId}`, { token: c.token })).status === 404);
sc.emit('chat:join', chatId);
await new Promise((r) => setTimeout(r, 300));
const leaked = waitFor(sc, 'message:new', 800);
sa.emit('message:send', { chatId, content: 'secret', type: 'text' });
check('outsider does not receive live messages', (await leaked) === null);
const denied = waitFor(sc, 'error');
sc.emit('message:send', { chatId, content: 'spam', type: 'text' });
check('outsider cannot send', (await denied)?.message === 'Chat not found');

// ---- Message validation ----
const bad = waitFor(sa, 'error');
sa.emit('message:send', { chatId, content: '', type: 'image', fileUrl: 'javascript:alert(1)' });
check('foreign file URL rejected', (await bad)?.message === 'Invalid message');
check('history for member', (await call('GET', `/api/messages/${chatId}`, { token: b.token })).json?.messages?.length === 2);

// ---- Files ----
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const form = new FormData();
form.append('file', new Blob([png], { type: 'image/png' }), 'dot.png');
const up = await call('POST', '/api/upload', { token: a.token, form });
check('upload image', up.status === 200 && /^\/api\/files\/[a-f0-9]{24}$/.test(up.json?.url ?? ''));
const file = await fetch(BASE + up.json.url);
check('download image', file.status === 200 && file.headers.get('content-type') === 'image/png' && file.headers.get('x-content-type-options') === 'nosniff');
const part = await fetch(BASE + up.json.url, { headers: { range: 'bytes=0-9' } });
check('byte range (Safari audio)', part.status === 206 && (await part.arrayBuffer()).byteLength === 10);
const html = new FormData();
html.append('file', new Blob(['<script>alert(1)</script>'], { type: 'text/html' }), 'x.html');
check('HTML upload rejected', (await call('POST', '/api/upload', { token: a.token, form: html })).status === 400);
const withFile = waitFor(sb, 'message:new');
sa.emit('message:send', { chatId, content: '', type: 'image', fileUrl: up.json.url, fileName: 'dot.png', fileSize: png.length });
check('image message delivered', (await withFile)?.fileUrl === up.json.url);
check('avatar from own upload', (await call('PATCH', '/api/users/avatar', { token: a.token, body: { avatar: up.json.url } })).status === 200);
check('external avatar rejected', (await call('PATCH', '/api/users/avatar', { token: a.token, body: { avatar: 'https://evil.example/x.png' } })).status === 400);

// ---- Groups ----
const newGroupForC = waitFor(sc, 'chat:new');
const group = await call('POST', '/api/chats/group', { token: a.token, body: { name: 'Smoke group', participants: [b.id, c.id] } });
check('create group', group.status === 201 && group.json?.chat?.participants?.length === 3);
check('C is told about the group', (await newGroupForC)?._id === group.json?.chat?._id);
const gotByC = waitFor(sc, 'message:new');
sb.emit('message:send', { chatId: group.json.chat._id, content: 'hi group', type: 'text' });
check('group message reaches C live', (await gotByC)?.content === 'hi group');
check('group with unknown user 400', (await call('POST', '/api/chats/group', { token: a.token, body: { name: 'x', participants: [b.id, '0123456789abcdef01234567'] } })).status === 400);

const typing = waitFor(sb, 'typing:update');
sa.emit('typing:start', { chatId });
check('typing indicator', (await typing)?.isTyping === true);

for (const s of [sa, sb, sc]) s.disconnect();
console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
