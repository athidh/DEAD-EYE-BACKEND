const http = require('http');
const socketIo = require('socket.io');
const app = require('./app'); 
const initializeGameSocket = require('./gameSocket'); // Import the game logic

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.set('socketio', io);

// Initialize all real-time game logic from the dedicated file.
// The redundant connection handler has been removed from this file.
initializeGameSocket(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('Waiting for frontend connections and MongoDB Atlas connection...');
});
