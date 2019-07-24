const express = require('express');
const app = express();
const socketio = require('socket.io')

const server = app.listen(5000);
console.log('server listening on port 5000');
const io = socketio(server);
io.on('connect', (socket) => {
    socket.emit('fromServer', { message: "Hey Buddy!! you are connected" });
    socket.on('fromClient', (clientData) => {
        console.log(clientData)
        socket.emit('fromServer', { message: "Enjoy Realtime Programming" })
    })
    socket.on('mousemove', (coordinates) => {
        socket.emit('mousemoved', { coordinates, name: 'akhil moved'})
    });
    const interval = setInterval(() => {
        socket.emit('fromServer', { message: 'Every 2 seconds for 5 times ' })
    }, 2000);
    setTimeout(() => {
        clearInterval(interval);
    }, 12000);
})
