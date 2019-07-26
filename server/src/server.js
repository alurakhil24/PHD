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

var clients = [];


// This is what the socket.io syntax is like, we will work this later
io.on('connection', socket => {

  socket.on('storeClientInfo', function (data) {


    var clientInfo = new Object();
    clientInfo.customId = data.customId;
    clientInfo.clientId = socket.id;
    if (clients.length === 0) {
      clientInfo.isMaster = true;
      clients = clients.concat(clientInfo);

    } else {
      clientInfo.isMaster = false;
      clients = clients.concat(clientInfo);
    }
    io.sockets.emit('newclientAdded', { clients, addedClient: data });
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
    io.sockets.emit('change color', color)
  });

  // disconnect is fired when a client leaves the server
  socket.on('disconnect', () => {
    if (clients.length < 1) {
      return;
    }
    const disconnectedUser = clients.length > 0 && clients.reduce((acc, client) => {
      if (client.clientId === socket.id) {
        acc = client;
      }
      return acc;
    }, null);
    clients = clients.reduce((acc, client) => {
      if (client.clientId !== socket.id) {
        acc = acc.concat(client);
      }
      return acc;
    }, []);
    // for (let i = 0, len = clients.length; i < len; ++i) {
    //   let c = clients[i];

    //   if (c.clientId == socket.id) {
    //     clients.splice(i, 1);
    //     break;
    //   }
    // }

    // clients = clients.filter((item) => item.clientId !== socket.id);
    if (disconnectedUser) {
      io.sockets.emit('clientDisconnected', disconnectedUser);
    }
  });

  //mouse move event
  socket.on('mousemove', (data) => {
    io.emit('clientCursorMoved', data);
  });

  socket.on('shapedrag', (data) => {
    io.emit('shapedragged', { x: data.x, y: data.y, uname: data.uname });
  });
  socket.on('shapeDropped', (data) => {
    io.emit('shapeDroppedOnClient', { ...data });
  });
  socket.on('shapeSelected', (data) => {
    const {clientId,shape} = data;
    console.log("Hiiiiiii" + data);
    io.emit('shapeSelectedOnClient', { ...data });
  });
  socket.on('shapeMoved', (data) => {
    const {clientId,shape} = data;
    console.log("Hiiiiiii Moved" + data);
    io.emit('shapeMovedOnClient', { ...data });
  });
})
server.listen(port, () => console.log(`Listening on port ${port}`))
