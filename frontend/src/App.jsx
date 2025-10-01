import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('https://innmuhosi.onrender.com', {
  transports: ['websocket'],
  auth: {
    token: localStorage.getItem('token'),
  },
});

function App() {
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);

  useEffect(() => {
    axios.get('https://innmuhosi.onrender.com/api/channels')
      .then(response => setChannels(response.data))
      .catch(error => console.error('Error fetching channels:', error));
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      axios.get(`https://innmuhosi.onrender.com/api/channels/${selectedChannel.id}/messages`)
        .then(response => setMessages(response.data))
        .catch(error => console.error('Error fetching messages:', error));
    }
  }, [selectedChannel]);

  useEffect(() => {
    socket.on('new_message', (message) => {
      if (message.channelId === selectedChannel.id) {
        setMessages(prevMessages => [...prevMessages, message]);
      }
    });

    return () => {
      socket.off('new_message');
    };
  }, [selectedChannel]);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedChannel) {
      axios.post('https://innmuhosi.onrender.com/api/messages', {
        content: newMessage,
        channelId: selectedChannel.id,
      })
        .then(response => {
          socket.emit('send_message', {
            channelId: selectedChannel.id,
            content: newMessage,
          });
          setNewMessage('');
        })
        .catch(error => console.error('Error sending message:', error));
    }
  };

  return (
    <div>
      <h1>Chat App</h1>
      <div>
        <h2>Channels</h2>
        <ul>
          {channels.map(channel => (
            <li key={channel.id} onClick={() => setSelectedChannel(channel)}>
              {channel.name}
            </li>
          ))}
        </ul>
      </div>
      {selectedChannel && (
        <div>
          <h2>{selectedChannel.name}</h2>
          <div>
            <ul>
              {messages.map(message => (
                <li key={message.id}>
                  <strong>{message.user.name}:</strong> {message.content}
                </li>
              ))}
            </ul>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
