const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const colors = require("colors");
const { chats } = require("./data/data");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound,errorHandler } = require("./middleware/errorMiddleware");
const { Socket } = require("socket.io");


dotenv.config();
connectDB();
const app = express();

app.use(express.json()); // to access JSON data

app.get("/", (req, res) => {
  res.send("API Running!");
});

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server listening on ${PORT}`.yellow.bold));

const io = require('socket.io')(server, {
  pingTimeout:60000,
  cors: {
    origin: 'http://localhost:3000',
  }
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    console.log(userData._id);
    socket.emit("connected");
  });

  socket.on('join chat',(room)=>{
  socket.join(room);
    console.log("User joined room: " + room);
  });
  
  socket.on('newMessage', (newMessageReceived) => {
    var chat = newMessageReceived.chat;

    if (!chat.users) return console.log("chat.user not defined");
    
    chat.users.forEach(user => {
      if (user._id == newMessageReceived.sender_id) return;

      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });


})
