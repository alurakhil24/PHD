const express = require('express')
const http = require('http')
const socketIO = require('socket.io')

// our localhost port
const port = 4002

const app = express()

// our server instance
const server = http.createServer(app)

// This creates our socket using the instance of the server
const io = socketIO(server)

let clients = [];


// This is what the socket.io syntax is like, we will work this later
io.on('connection', socket => {
  console.log('New client connected');

  socket.on('storeClientInfo', function (data) {
    console.log('storeclientInfo');
    console.log(data);


    var clientInfo = new Object();
    clientInfo.customId = data.customId;
    clientInfo.clientId = socket.id;
    if (clients.length === 0) {
      clientInfo.isMaster = true;
      clients.push(clientInfo);

    } else {
      clientInfo.isMaster = false;
      clients.push(clientInfo);
    }
    io.sockets.emit('newclientAdded', clients);
  });

  socket.on('create', function ({roomName, users}) {
    socket.join(roomName);
    for (let i = 0; i < users.length; i++){
      if (users[i].clientId!== socket.id) {
        console.log(users[i].clientId);
        socket.broadcast.to(users[i].clientId).emit('requestToJoin', roomName);
      }
    }
  });

  // just like on the client side, we have a socket.on method that takes a callback function
  socket.on('change color', (color) => {
    // once we get a 'change color' event from one of our clients, we will send it to the rest of the clients
    // we make use of the socket.emit method again with the argument given to use from the callback function above
    console.log('Color Changed to: ', color)
    io.sockets.emit('change color', color)
  });

  // disconnect is fired when a client leaves the server
  socket.on('disconnect', () => {
    console.log('user disconnected')

    for (let i = 0, len = clients.length; i < len; ++i) {
      let c = clients[i];

      if (c.clientId == socket.id) {
        clients.splice(i, 1);
        break;
      }
    }

    // clients = clients.filter((item) => item.clientId !== socket.id);
    console.log(clients);
    io.sockets.emit('clientDisconnected', clients);

  });

  //mouse move event
  socket.on('mousemove', (data) => {
    io.emit('clientCursorMoved', data);
  });

  socket.on('shapedrag', (data) => {
    console.log('shape dragged');
    io.emit('shapedragged', { x: data.x, y: data.y, uname: data.uname });
  });
  socket.on('shapeDropped', (data) => {
    io.emit('shapeDroppedOnClient', { cell: data.shape });
  })
})

server.listen(port, () => console.log(`Listening on port ${port}`))
