const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// 環境変数
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const DB_FILE = process.env.DB_FILE || './chat.db';

// DB 初期化
const db = new sqlite3.Database(DB_FILE);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    is_admin INTEGER DEFAULT 0
  )`);

  db.get(`SELECT * FROM users WHERE username = ?`, ['admin'], (err, row) => {
    if (!row) {
      const hashed = bcrypt.hashSync('1223', 10);
      db.run(`INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)`, ['admin', hashed, 1]);
    }
  });
});

// ログイン
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'ログイン失敗' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET
    );
    res.json({ user: { id: user.id, username: user.username, is_admin: user.is_admin }, token });
  });
});

// ユーザー登録
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  const hashed = bcrypt.hashSync(password, 10);
  db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashed], function(err) {
    if (err) return res.status(400).json({ error: '登録失敗' });
    res.json({ id: this.lastID, username });
  });
});

// Socket.io
io.on('connection', socket => {
  console.log('ユーザー接続');

  // メッセージ受信
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('ユーザー切断');
  });
});

// 簡易確認ページ（/ にアクセスしたとき）
app.get('/', (req, res) => {
  res.send('バックエンドは起動中です');
});

// サーバー起動
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
