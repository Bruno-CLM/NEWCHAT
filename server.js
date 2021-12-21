const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = 'New Chat Bot';

app.get("/", (req, res) => {
    res.sendFile(__dirname + 'https://wizardly-beaver-cd762b.netlify.app/index.html');
})

io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.emit('message', formatMessage(botName, 'Bem vindo ao New Chat'));

        socket.broadcast.to(user.room).emit('message',formatMessage(botName, `${user.username} conectou!`));

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    });

    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.emit('message', formatMessage(user.username,msg));
    });

    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

    if(user){
        io.to(user.room).emit('message', formatMessage(botName,`${user.username} desconectou!`));
    }

    io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
    });

    });
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server runing on port ${PORT}`));

