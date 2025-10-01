import express from 'express';
}


app.use(authMiddleware);


// チャンネル一覧取得
app.get('/api/channels', async (req, res) => {
await ensureRoom();
const channels = await prisma.channel.findMany({ where: { roomId: 1 }, orderBy: { id: 'asc' } });
res.json(channels);
});


// 管理者: チャンネル作成
app.post('/api/channels', async (req, res) => {
if (!req.user) return res.status(401).json({ error: 'unauth' });
const isAdmin = Boolean(await prisma.admin.findFirst({ where: { userId: req.user.id } }));
if (!isAdmin) return res.status(403).json({ error: 'only admin' });
const { name } = req.body;
if (!name) return res.status(400).json({ error: 'name required' });
const ch = await prisma.channel.create({ data: { name, roomId: 1 } });
res.json(ch);
});


// 管理者: ユーザー昇格
app.post('/api/admins/promote', async (req, res) => {
if (!req.user) return res.status(401).json({ error: 'unauth' });
const isAdmin = Boolean(await prisma.admin.findFirst({ where: { userId: req.user.id } }));
if (!isAdmin) return res.status(403).json({ error: 'only admin' });
const { targetUserName } = req.body;
const target = await prisma.user.findFirst({ where: { name: targetUserName } });
if (!target) return res.status(404).json({ error: 'no user' });
// 既に admin なら OK
const already = await prisma.admin.findFirst({ where: { userId: target.id } });
if (already) return res.json({ ok: true, msg: 'already admin' });
await prisma.admin.create({ data: { userId: target.id } });
res.json({ ok: true });
});


// メッセージ取得
app.get('/api/channels/:id/messages', async (req, res) => {
const channelId = Number(req.params.id);
const msgs = await prisma.message.findMany({ where: { channelId }, include: { user: true }, orderBy: { createdAt: 'asc' } });
res.json(msgs);
});


// Socket.IO 認証
io.use(async (socket, next) => {
try {
const token = socket.handshake.auth.token;
if (!token) return next(new Error('unauth'));
const payload = jwt.verify(token, JWT_SECRET);
const user = await prisma.user.findUnique({ where: { id: payload.userId } });
if (!user) return next(new Error('unauth'));
socket.user = user;
next();
} catch (e) { next(new Error('unauth')); }
});


io.on('connection', (socket) => {
console.log('socket connected', socket.user.name);


socket.on('join_channel', ({ channelId }) => {
socket.join(`channel_${channelId}`);
});


socket.on('send_message', async ({ channelId, content }) => {
if (!socket.user) return;
const sanitized = String(content).slice(0, 2000);
const msg = await prisma.message.create({ data: { content: sanitized, userId: socket.user.id, channelId } });
const out = await prisma.message.findUnique({ where: { id: msg.id }, include: { user: true } });
io.to(`channel_${channelId}`).emit('new_message', out);
});
});


server.listen(PORT, async () => {
console.log(`Server listening on ${PORT}`);
await ensureRoom();
});
