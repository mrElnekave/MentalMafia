var path = require('path');
var express = require('express');
var app = express();
var http = require('http').Server(app);

//Serve static files
app.use('/sum', express.static(path.join(__dirname, '..', 'sum')));

const { JIFFServer } = require('jiff-mpc');// /lib/jiff-server.js');
app.use('/dist/jiff-client.js', express.static(path.join(__dirname, '..', 'node_modules', 'jiff-mpc', 'dist', 'jiff-client.js')));



new JIFFServer(http, { logs: true });

// Serve static files.
http.listen(8080, function () {
  console.log('listening on *:8080');
});

console.log('Direct your browser to http://localhost:8080/demos/sum/client.html.');
console.log();
