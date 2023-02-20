const messageList = document.querySelector("ul");
const messageForm = document.querySelector("form");
const frontSocket = new WebSocket(`ws://${window.location.host}`);

frontSocket.addEventListener("open", () => {
    console.log("Connected to server ?");
})

frontSocket.addEventListener("message", (message) => {
    console.log("New message: ", message.data);
})

frontSocket.addEventListener("close", () => {
    console.log("Disconnected from server ?");
})

function handleSubmit(event) {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    frontSocket.send(input.value);
    input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);