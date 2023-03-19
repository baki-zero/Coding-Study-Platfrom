import SocketIO from "socket.io";
import express from "express";
import http from "http";
//import WebSocket from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

function publicRooms() {                    //public room을 찾고 반환하는 함수
    const {
        sockets: {
            adapter: {sids, rooms},         //wsServer.sockets.adapter로부터 sids와 rooms를 가져옴.
        },
    } = wsServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

wsServer.on("connection", (socket) => {
    socket["nickname"] = "Anon";
    socket.onAny((event) => {                   //onAny는 middleware 느낌, 어느 event에서든지 console.log 가능
        //console.log(wsServer.sockets.adapter);
        //console.log(`Socket Event: ${event}`);
    });
    socket.on("enter_room", (roomName, nickname, done) => {
        socket["nickname"] = nickname;
        socket.join(roomName);      //roomName에 해당하는 room으로 들어감
        done();                     //FE에 showRoom 함수를 실행시킴
        socket.to(roomName).emit("welcome", socket.nickname);    //roomName에 해당하는 user들에게 메시지 전달
        wsServer.sockets.emit("room_change", publicRooms());    //모든 socket에 message 전송
    });
    socket.on("disconnecting", () => {
        //클라이언트가 서버와 연결이 끊어지기 전에 message 전송 가능
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname));
    });
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    })

    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    socket.on("nickname", nickname => socket["nickname"] = nickname);   //nickname event 발생하면 nickname을 가져와서 socket에 저장
});

/*
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (backSocket) => {
    sockets.push(backSocket);
    backSocket["nickname"] = "Anon";        //처음 접속시 닉네임을 익명으로 설정
    console.log("Connected to Browser");
    backSocket.on("close", () => 
        console.log("Disconnected from the Browser")
    );
    backSocket.on("message", (msg) => {
        const message = JSON.parse(msg);                //Json.parse는 string을 Javascript object로 변환
        switch(message.type) {
            case "new_message" :
                sockets.forEach((aSocket) => aSocket.send(`${backSocket.nickname}: ${message.payload}`));    //aSocket은 각각의 브라우저를 표시하고 메시지를 보낸다는 뜻
            case "nickname" :
                backSocket["nickname"] = message.payload;
        }
    });
}); */

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);