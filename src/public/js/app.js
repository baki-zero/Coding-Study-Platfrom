const socket = io();   //socket.io를 이용해 front-end에서 back-end로 연결

const welcome = document.getElementById("welcome");
const enterForm = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#name input");
    socket.emit("nickname", input.value);
}

function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector("#msg");
    const nameForm = room.querySelector("#name");
    msgForm.addEventListener("submit", handleMessageSubmit);
    nameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const roomNameInput = enterForm.querySelector("#roomName");
    const nickNameInput = enterForm.querySelector("#name");
    //emit(event 이름, 보내고 싶은 payload, 마지막은 서버에서 호출하는 function)
    socket.emit("enter_room", roomNameInput.value, nickNameInput.value, showRoom);
    roomName = roomNameInput.value;
    roomNameInput.value = "";
    const changeNameInput = room.querySelector("#name input");
    changeNameInput.value = nickNameInput.value;
}

enterForm.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user) => {
    addMessage(`${user} joined:)`);
});

socket.on("bye", (left) => {
    addMessage(`${left} left:(`);
});

socket.on("new_message", addMessage);

socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});