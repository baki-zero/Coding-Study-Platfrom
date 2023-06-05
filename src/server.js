//import {instrument} from "@socket.io/admin-ui";
//import WebSocket from "ws";
import SocketIO from "socket.io";
import express from "express";
import http from "http";
import uuid from "uuid";

const { v4 : uuidv4 } = require("uuid");  //고유한 식별자를 생성
const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

const rooms = new Map();    //액티브한 방과 그 방에 있는 사용자들을 저장, Map은 키-값 형태로 저장

wsServer.on("connection", (socket) => {
    console.log("User connected ", socket.id);
    socket.on("join", (roomId) => {
        let room = rooms.get(roomId);

        if (!room) {    //room이 존재하지 않는다면 새로운 룸 생성
            room = {id : roomId, users: []};
            rooms.set(roomId, room);
        }
        
        const userId = uuidv4();    //구별되는 userId 생성

        //룸에 사용자 추가
        room.users.push({ id : userId, socketId : socket.id });
        socket.join(room.id);
        socket.emit("joined", { userId, roomId, users:room.users });    //클라이언트에게 사용자와 룸 정보 전달
        socket.to(room.id).emit("user joined", { id: userId, socketId: socket.id });    //룸에 새로운 사용자를 다른 사용자들에게 브로드캐스트
    });

    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome", socket.nickname);
    });
    socket["nickname"] = "Anonymous";
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => {socket.to(room).emit("bye", socket.nickname)});
        console.log('user disconnected');
    });
    socket.on("new_message", (msg, room, done) => {                             // 메세지랑 done 함수를 받을 것
        socket.to(room).emit("new_message", `${socket.nickname} : ${msg}`);     // new_message 이벤트를 emit한다! 방금 받은 메시지가 payload가 된다!
        done();                                                                 // done은 프론트엔드에서 코드를 실행할 것!! (백엔드에서 작업 다 끝나고!!)
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