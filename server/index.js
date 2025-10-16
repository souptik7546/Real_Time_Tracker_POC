import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
const server = createServer(app);

let users = [];
let liveRoom = "";

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (socket) => {
  console.log(`222222222 new user joined the server ${socket.id}`);

  socket.on("join-room", (data) => {
    console.log("111111111",data);
    socket.join(data.roomName);
    liveRoom=data.roomName;
    const index = users.findIndex((u) => u.id === socket.id);
    if (index !== -1) {
      users[index] = {id:socket.id,name:data.Name};
    } else {  
      users.push({id:socket.id,name:data.Name});
    }
    console.log(users);
    
  });

  socket.on("send-current-location",(data)=>{
    console.log(data);
     const index = users.findIndex((u) => u.id === socket.id);
    if (index !== -1) {
      users[index] = {id:socket.id,name:users[index].name,position:data};
    }
    console.log("333333333333",users);
    console.log(liveRoom);
    
    io.to(liveRoom).emit("user-update",users) 
    console.log("data has been sent");
  })

   socket.on("disconnect", () => {
    users = users.filter((u) => u.id !== socket.id);
    io.to(liveRoom).emit("user-update",users) 
    console.log(`User ${socket.id} disconnected`);
  });
});

server.listen(8000, () => {
  console.log("app is listening on port 8000");
});
