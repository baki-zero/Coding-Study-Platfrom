const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("displaySurface");
const call = document.getElementById("call");
const startButton = document.getElementById("startButton");
const selectOptions = document.getElementById("selectOptions");
const myScreen = document.getElementById("myScreen");
const peerScreen = document.getElementById("peerScreen");
const peerScreen2 = document.getElementById("peerScreen2");
const peerScreen3 = document.getElementById("peerScreen3");
const chatContainer = document.getElementById("chat-container");
const peerFace = document.getElementById("peerFace");
const peerFace2 = document.getElementById("peerFace2");
const peerFace3 = document.getElementById("peerFace3");
const body = document.querySelector("body");

call.hidden = true;
chatContainer.hidden = true;

let myStream;              
let muted = false;         
let cameraOff = false;      
let roomName;         
let myPeerConnection;       

if (adapter.browserDetails.browser === 'chrome' && adapter.browserDetails.version >= 107) {
    // See https://developer.chrome.com/docs/web-platform/screen-sharing-controls/
    selectOptions.style.display = "block";
} else if (adapter.browserDetails.browser === 'firefox') {
    // Polyfill in Firefox.
    // See https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
    adapter.browserShim.shimGetDisplayMedia(window, 'screen');
}

//카메라 정보 가져오기
async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();                
        const cameras = devices.filter((device) => device.kind === "videoinput");   
        const currentCamera = myStream.getVideoTracks()[0];  
        cameras.forEach((camera) => {                           
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label) {  
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });
    } catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId) { 
    myScreen.style.display = "block";
    const initialConstrains = {
        audio: true,
        video: {facingMode: "user"},
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId : {exact: deviceId} },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
        if (!deviceId) {            
            await getCameras();         
        }
    } catch (e) {
        console.log(e);
    }
}

function handleMuteClick() {
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if(!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

function handleCameraClick() {
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if(cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

async function handleCameraChange() { 
    await getMedia(cameraSelect.value);
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders() 
            .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join a room), chat code
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const chatView = document.getElementById("chatView");
const chatForm = document.getElementById("chatForm");
const nickName = document.getElementById("nickName");

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = chatForm.querySelector("input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You : ${value}`);
    });
    input.value = "";
}

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = nickName.querySelector("#name");
    socket.emit("nickname", input.value);
}

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    body.removeAttribute('style');
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);
welcomeForm.addEventListener("submit", handleNicknameSubmit);
chatForm.addEventListener("submit", handleMessageSubmit);

//chat code
function addMessage(message) {
    const ul = chatView.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

//Socket Code
socket.on("welcome", async(user) => {
    addMessage(`Welcome ${user}`);
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", console.log);
    console.log("made data channel");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

socket.on("bye", (left) => {
    addMessage(`GoodBye ${left}`);
})

socket.on("new_message", addMessage);

//RTC Code
socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", console.log);
    });
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    console.log("sent the answer");
    socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
});

//RTC Code
function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ],
            },
        ],
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    //myPeerConnection.addEventListener("addstream", handleAddStream);
    myPeerConnection.addEventListener("track", handleTrack);
    myStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));   
}

function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
    peerFace.srcObject = data.stream;
    console.log(myStream, "my stream");
    console.log(data.stream, "peer stream");
}

function handleTrack(data) {
    if(!peerFace.srcObject) {
        peerScreen.style.display = "block";
        peerFace.srcObject = data.streams[0];
        console.log(myStream, "my stream");
        console.log(data.streams[0], "peer stream");
    } else if(!peerFace2.srcObject) {
        peerScreen2.style.display = "block";
        peerFace2.srcObject = data.streams[0];
        console.log(myStream, "my stream");
        console.log(data.streams[0], "peer stream");
    } else if(!peerFace3.srcObject) {
        peerScreen3.style.display = "block";
        peerFace3.srcObject = data.streams[0];
        console.log(myStream, "my stream");
        console.log(data.streams[0], "peer stream");
    } else {
        console.log("You can't Enter the Room");
    }
}

let screenVideoTrack;
function handleSuccess(stream) {
    startButton.disabled = true;
    cameraSelect.disabled = true;
    myFace.srcObject = stream;

    screenVideoTrack = myStream.getVideoTracks()[0];
    screenVideoTrack.addEventListener('ended', () => {
      errorMsg('The user has ended sharing the screen');
      startButton.disabled = false;
      cameraSelect.disabled = false;
    });

    myPeerConnection.addTrack(screenVideoTrack, myStream);
    myPeerConnection.createOffer()
    .then((offer) => myPeerConnection.setLocalDescription(offer))
    .catch((error) => {
        errorMsg('Failed to create and send offer:', error);
    });
}

function handleError(error) {
    errorMsg(`getDisplayMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += `<p>${msg}</p>`;
    if (typeof error !== 'undefined') {
      console.error(error);
    }
}

startButton.addEventListener("click", () => {
    const options = { video: true };
    const displaySurface = cameraSelect.options[cameraSelect.selectedIndex].value;
    if (displaySurface !== 'default') {
        options.video = {displaySurface};
    }
    navigator.mediaDevices.getDisplayMedia(options)
        .then(handleSuccess, handleError);
});

if ((navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices)) {
    startButton.disabled = false;
} else {
    errorMsg('getDisplayMedia is not supported');
}