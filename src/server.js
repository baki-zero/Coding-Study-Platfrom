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

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {     //socket.io를 back-end 설치? 실행?
    socket.on("enter_room", (roomName, done) => {
        console.log(roomName);
        done("hello from the backend");
    });
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
});*/

httpServer.listen(3000, handleListen);