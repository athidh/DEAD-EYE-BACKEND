const http = require('http');
const socketIo = require('socket.io');
const app = require('./app'); 


const server = http.createServer(app);


const io = socketIo(server);

app.set('socketio', io);

io.on('connection', (socket) => {
    console.log(`✨ A user connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`👋 User disconnected: ${socket.id}`);
    });

    socket.on('place-wager', (wagerData) => {
        console.log('💰 Wager received:', wagerData);
        io.emit('new-wager', wagerData); 
    });


});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('Waiting for frontend connections and MongoDB Atlas connection...');
});