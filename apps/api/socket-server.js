const { Server } = require('socket.io');
const http = require('http');

// Create HTTP server
const server = http.createServer();

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://platform.cryb.ai", "http://localhost:8082"],
    credentials: true
  }
});

// Store connected users
const users = new Map();
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User authentication
  socket.on('auth', (data) => {
    users.set(socket.id, {
      id: socket.id,
      username: data.username || 'Anonymous',
      status: 'online'
    });
    
    // Broadcast user status
    io.emit('user:status', {
      userId: socket.id,
      status: 'online'
    });
  });

  // Join room/channel
  socket.on('room:join', (roomId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);
    
    // Notify room members
    socket.to(roomId).emit('room:user_joined', {
      userId: socket.id,
      roomId: roomId
    });
  });

  // Handle messages
  socket.on('message:send', (data) => {
    const message = {
      id: Date.now(),
      userId: socket.id,
      username: users.get(socket.id)?.username || 'Anonymous',
      content: data.content,
      roomId: data.roomId,
      timestamp: new Date()
    };
    
    // Send to room or broadcast
    if (data.roomId) {
      io.to(data.roomId).emit('message:receive', message);
    } else {
      io.emit('message:receive', message);
    }
  });

  // Typing indicators
  socket.on('typing:start', (roomId) => {
    socket.to(roomId).emit('typing:user', {
      userId: socket.id,
      username: users.get(socket.id)?.username
    });
  });

  socket.on('typing:stop', (roomId) => {
    socket.to(roomId).emit('typing:user_stop', {
      userId: socket.id
    });
  });

  // Voice state update
  socket.on('voice:state_update', (data) => {
    io.emit('voice:user_state', {
      userId: socket.id,
      state: data.state // muted, unmuted, deafened, etc.
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from rooms
    rooms.forEach((members, roomId) => {
      if (members.has(socket.id)) {
        members.delete(socket.id);
        io.to(roomId).emit('room:user_left', {
          userId: socket.id,
          roomId: roomId
        });
      }
    });
    
    // Remove from users
    users.delete(socket.id);
    
    // Broadcast offline status
    io.emit('user:status', {
      userId: socket.id,
      status: 'offline'
    });
  });
});

// Start server on port 4001
const PORT = 4001;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log('📡 Real-time features enabled!');
  console.log('Events supported:');
  console.log('  - auth, room:join, message:send');
  console.log('  - typing:start/stop, voice:state_update');
});