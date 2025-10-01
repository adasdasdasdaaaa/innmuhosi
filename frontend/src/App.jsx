import React, { useState, useEffect } from 'react'
import Login from './Login'
import Chat from './Chat'


export default function App() {
const [user, setUser] = useState(null);


useEffect(() => {
// 既存の cookie ベースでログイン済みか調べる（簡易）
}, []);


if (!user) return <Login onLogin={(u) => setUser(u)} />
return <Chat user={user} />
}
