//import {instrument} from "@socket.io/admin-ui";
//import WebSocket from "ws";
import SocketIO from "socket.io";
import express from "express";
import http from "http";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);



wsServer.on("connection", (socket) => {
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome", socket.nickname);
    });
    socket["nickname"] = "Anonymous";
    socket.on("disconnect", () => {
        socket.rooms.forEach((room) => {socket.to(room).emit("bye", socket.nickname)});
    });
    socket.on("new_message", (msg, room, done) => { // 메세지랑 done 함수를 받을 것
        socket.to(room).emit("new_message", `${socket.nickname} : ${msg}`); // new_message 이벤트를 emit한다! 방금 받은 메시지가 payload가 된다!
        done(); // done은 프론트엔드에서 코드를 실행할 것!! (백엔드에서 작업 다 끝나고!!)
    });
    socket.on("nickname", nickname => socket["nickname"] = nickname);
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });
    
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);