require('dotenv').config()
const express = require('express');
const https = require('https');
const http = require('http')
const fs = require('fs');
const socketio = require('socket.io')
const {generateMessage} = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express();

const port = process.env.PORT || 5000;
var server;

console.log(process.env.LOCAL)

if(process.env.LOCAL){
    server = https.createServer({
        key: fs.readFileSync('./certs/key.pem'),
        cert: fs.readFileSync('./certs/cert.pem'),
        passphrase: process.env.PASSPHRASE
    },app);
} else {
    server = http.createServer(app);
}



const io = socketio(server); //Websockets requires a specific instance of the server we are running

app.use(express.static('public'));

io.on('connection',(socket)=>{ //Socket is an object and contains information about the conexion, it communicates with the specific client the socket opened.
    console.log('New connection');

    socket.on('join',(options,cb)=>{
        const{error, user} = addUser({id: socket.id, ...options})
        if(error){
            return cb(error)
        }
        
        const {room, username} = user;
        socket.join(room)

        //Emit transfers data through events emit sends the event to the client, it requires at least the name of the event
        socket.emit('message',generateMessage(`Welcome ${username}!`,'Admin'));//All parameters after the event name are available on the callback function

        socket.broadcast.to(room).emit('message', generateMessage(`${username} has joined the conversation!`,'Admin')); //broadcast sends it to everyone except the socket
        io.to(room).emit('roomData',{
            room, 
            users: getUsersInRoom(room)
        })
        cb()
    });

    socket.on('sendMessage',(message, cb)=>{
        const usr = getUser(socket.id)
        if(usr){
            io.to(usr.room).emit('message',generateMessage(message,usr.username)) //Sends it to all connections, socket sends it between the specific client/server connection
            cb("Message emited correctly") //For the acknowledgment
        }
    });

    socket.on('disconnect',()=>{
        const usr = removeUser(socket.id);
        if(usr){
            const {username, room} = usr;
            io.to(room).emit('message',generateMessage(`${username} has gone offline`,'Admin')) //broadcast is not required since the connection has been terminated already            
            io.to(room).emit('roomData',{
                room, 
                users: getUsersInRoom(room)
            });
        }
    });

    socket.on('sendLocation',({latitude, longitude},cb)=>{
        const usr = getUser(socket.id)
        if(usr){
            io.to(usr.room).emit('locationMessage',generateMessage(`https://www.google.com/maps?q=${latitude},${longitude}`, usr.username))
            cb("Location shared to all clients")
        }
    })
});


server.listen(port, ()=>{
    console.log(`Starting server on port ${port}`)
});