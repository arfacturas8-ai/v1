const io = require('socket.io-client');

const socket = io('http://localhost:3010', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected to simple server!');
  socket.emit('ping');
});

socket.on('welcome', (data) => {
  console.log('Welcome message:', data);
});

socket.on('pong', () => {
  console.log('✅ Pong received!');
  socket.disconnect();
  process.exit(0);
});

setTimeout(() => {
  console.log('Timeout');
  process.exit(1);
}, 5000);