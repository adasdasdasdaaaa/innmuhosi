import React, { useState } from "react";
import axios from "axios";


export default function Login({ onLogin }) {
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");


const handleSubmit = async (e) => {
e.preventDefault();
try {
const res = await axios.post("/api/auth/login", { username, password });
onLogin(res.data.user);
} catch (err) {
setError("ログイン失敗: ユーザー名またはパスワードが違います。");
}
};


return (
<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
<div className="bg-white p-6 rounded shadow-md w-80">
<h1 className="text-2xl font-bold mb-4 text-center">ログイン</h1>
<form onSubmit={handleSubmit} className="space-y-4">
<div>
<label className="block text-sm font-medium mb-1">ユーザー名</label>
<input
type="text"
value={username}
onChange={(e) => setUsername(e.target.value)}
className="w-full border rounded px-3 py-2"
required
/>
</div>
<div>
<label className="block text-sm font-medium mb-1">パスワード</label>
<input
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
className="w-full border rounded px-3 py-2"
required
/>
</div>
{error && <p className="text-red-500 text-sm">{error}</p>}
<button
type="submit"
className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
>
ログイン
</button>
</form>
</div>
</div>
);
}
