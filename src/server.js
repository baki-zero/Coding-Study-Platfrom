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
    socket.on("new_message", (msg, room, done) => { // �޼����� done �Լ��� ���� ��
        socket.to(room).emit("new_message", `${socket.nickname} : ${msg}`); // new_message �̺�Ʈ�� emit�Ѵ�! ��� ���� �޽����� payload�� �ȴ�!
        done(); // done�� ����Ʈ���忡�� �ڵ带 ������ ��!! (�鿣�忡�� �۾� �� ������!!)
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