const express = require('express');
const app = express();
const socketio = require('socket.io')

const server = app.listen(5000);
const io = socketio(server);
io.on('connection',(socket)=>{
    socket.emit('fromServer',{message:"Hey buddy"});
    socket.on('fromClient',(clientData)=>{
        console.log(clientData)
    })
    socket.on('newDataFromClient',(msg)=>{
        io.emit('dataToClients',{text:msg.text})
    })
})
