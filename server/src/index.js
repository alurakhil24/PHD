const express = require('express');
const app = express();
const socketio = require('socket.io')

const server = app.listen(5000);
console.log('server listening on port 5000');
const io = socketio(server);
io.on('connection', (socket) => {
    socket.emit('fromServer', { message: "Hey buddy you are connected" });
    socket.on('fromClient', (clientData) => {
        console.log(clientData)
        socket.emit('fromServer', { message: "Thats ok bro.. Enjoy with Sockets" })
    })
    const interval = setInterval(() => {
        socket.emit('fromServer', { message: 'This is the message you will get after 2 seconds for 5 times ' })
    }, 2000);
    setTimeout(() => {
        clearInterval(interval);
    }, 12000);
})
