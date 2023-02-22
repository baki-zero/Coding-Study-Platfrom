const socket = io();   //socket.io�� �̿��� front-end���� back-end�� ����

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

function backendDone(msg) {
    console.log(`The backend says: `, msg);
}

function handleRoomSubmit(event) {
    event.preventDefault;
    const input = form.querySelector("input");
    //emit(event �̸�, ������ ���� payload, �������� �������� ȣ���ϴ� function)
    socket.emit("enter_room", input.value, backendDone);
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);