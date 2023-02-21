const messageList = document.querySelector("ul");
const nickForm = document.querySelector("#nick");
const messageForm = document.querySelector("#message");
const frontSocket = new WebSocket(`ws://${window.location.host}`);

function makeMessage(type, payload) {       //object로 받은 것을 string으로 변환
    const msg = { type, payload };
    return JSON.stringify(msg);
}

frontSocket.addEventListener("open", () => {
    console.log("Connected to server");
})

frontSocket.addEventListener("message", (message) => {

})

frontSocket.addEventListener("close", () => {
    console.log("Disconnected from server");
})

function handleSubmit(event) {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    frontSocket.send(makeMessage("new_message", input.value));
    const li = document.createElement("li");
    li.innerText = `You: ${input.value}`;
    messageList.append(li);
    input.value = "";
}

function handleNickSubmit(event) {
    event.preventDefault();
    const input = nickForm.querySelector("input");
    frontSocket.send(makeMessage("nickname", input.value));
    input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);
nickForm.addEventListener("submit", handleNickSubmit);