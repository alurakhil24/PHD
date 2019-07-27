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
var rooms = []

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

  socket.on('create', function ({ roomName, users, masterUser }) {
    socket.join(roomName);
    rooms.push({
      master: socket.id,
      roomName,
    })

    for (let i = 0; i < users.length; i++) {

      if (users[i].clientId !== socket.id) {
        console.log(users[i].clientId);
        socket.broadcast.to(users[i].clientId).emit('requestToJoin', {roomName, user: masterUser});
      }
    }
  });


  socket.on('joinRoom', function ({ roomName }) {
    socket.join(roomName);
    let clientInfo = undefined;


    const connectedClients = io.sockets.adapter.rooms[roomName];
    const connected = Object.keys(connectedClients);
    const infoClients = [];
    clients.forEach((client) => {
      if (client.clientId === socket.id) {
        clientInfo = client;
      }
      connected.forEach(
        (connectedId) => {
          if (client.clientId !== connectedId) {
            infoClients.push(client);
          }
        }
      );
      return;
    });
    // roster.forEach(function (client) {
    //   console.log('Username: ' + client.customId);
    // });
    socket.to(roomName).emit('newUserJoinedRoom', { clientInfo });
    io.to(`${socket.id}`).emit('joineRoomSucess', { roomName, infoClients });
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
    if (disconnectedUser) {
      io.sockets.emit('clientDisconnected', disconnectedUser);
    }
  });

  //mouse move event
  socket.on('mousemove', ({ data, roomName }) => {
    io.to(roomName).emit('clientCursorMoved', data);
  });

  socket.on('shapedrag', ({ data, roomName }) => {
    io.to(roomName).emit('shapedragged', { x: data.x, y: data.y, uname: data.uname });
  });
  socket.on('shapeDropped', ({ data, roomName }) => {
    io.to(roomName).emit('shapeDroppedOnClient', { ...data });
  });
  socket.on('shapeSelected', ({ data, roomName }) => {
    const { clientId, shape } = data;
    io.to(roomName).emit('shapeSelectedOnClient', { ...data });
  });
  socket.on('shapeMoved', ({ data, roomName }) => {
    const { clientId, shape } = data;
    io.to(roomName).emit('shapeMovedOnClient', { ...data });
  });

  //instancce sync api
  socket.on('getMasterInstance', ({ roomName }) => {
    rooms.forEach((room) => {
      if (room.roomName === roomName) {
        io.to(`${room.master}`).emit('getMasterVertexes', { clientRequesting: socket.id });
      }
    });
  });
  socket.on('sendMasterInstance', ({ clientId, vertexes }) => {
    console.log(vertexes);
    io.to(`${clientId}`).emit('setMasterVertexes', { vertexes });
  });

})
server.listen(port, () => console.log(`Listening on port ${port}`))
