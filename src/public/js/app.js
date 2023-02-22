const socket = io();   //socket.io를 이용해 front-end에서 back-end로 연결

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

function backendDone(msg) {
    console.log(`The backend says: `, msg);
}

function handleRoomSubmit(event) {
    event.preventDefault;
    const input = form.querySelector("input");
    //emit(event 이름, 보내고 싶은 payload, 마지막은 서버에서 호출하는 function)
    socket.emit("enter_room", input.value, backendDone);
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);