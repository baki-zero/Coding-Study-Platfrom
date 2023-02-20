import express from "express";
import http from "http";
import WebSocket from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (backSocket) => {
    sockets.push(backSocket);
    console.log("Connected to Browser ?");
    backSocket.on("close", () => 
        console.log("Disconnected from the Browser ?")
    );
    backSocket.on("message", (message) => {
        sockets.forEach((aSocket) => aSocket.send(message.toString()))    //aSocket은 각각의 브라우저를 표시하고 메시지를 보낸다는 뜻
    });
});

server.listen(3000, handleListen);