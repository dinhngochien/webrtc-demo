// Hapi build web services such as JSON API
let Hapi = require('hapi');
let server = new Hapi.Server()
server.connection({
  'host': 'localhost',
  'port': 3000
});

// attach Socket.io process to Hapi server
let socketio = require('socket.io');
let io = socketio(server.listener);

// load twilio node library(with credentials)
let twilio = require('twilio')(process.env.ACCOUNT_SID,  process.env.AUTH_TOKEN);

// Server static assets
server.route({
  method: 'GET',
  path: '/{path*}',
  handler: {
    directory: { path: './public', listing: false, index: true }
  }
});

// signaling
io.on('connection', (socket) => {
  socket.on('join', (room) => {
    let clients = io.sockets.adapter.rooms[room];
    let numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

    if(numClients == 0) {
      socket.join(room);
    } else if(numClients == 1) {
      socket.join(room);
      socket.emit('ready', room);
      socket.broadcast.emit('ready', room);
    } else {
      socket.emit('full', room);
    }
  });

// TURN twilio server
  socket.on('token', () => {
    twilio.tokens.create( (err, response) => {
      if(err){
        console.log(err);
      }else {
        socket.emit('token', response);
      }
    });
  });

  // send candidate straight on to the other browser
  socket.on('candidate', (candidate) => {
    socket.broadcast.emit('candidate', candidate);
  });

  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);
  })
});

// Start the server
server.start(function(){
  console.log('Server running at: ', server.info.uri);
})
