const socket = io();   //socket.io�� �̿��� front-end���� back-end�� ����

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

call.hidden = true;
chatContainer.hidden = true;

let myStream;               //stream�� ������ ������� ���յ� ��
let muted = false;          //ó���� �Ҹ� x
let cameraOff = false;      //ó���� ī�޶� on
let roomName;               //���̸�
let myPeerConnection;       

if (adapter.browserDetails.browser === 'chrome' && adapter.browserDetails.version >= 107) {
    // See https://developer.chrome.com/docs/web-platform/screen-sharing-controls/
    selectOptions.style.display = "block";
} else if (adapter.browserDetails.browser === 'firefox') {
    // Polyfill in Firefox.
    // See https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
    adapter.browserShim.shimGetDisplayMedia(window, 'screen');
}

// ī�޶� ���� ��������
async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();                //��� ������ �̵�� ����� ��ġ ��� ��û
        const cameras = devices.filter((device) => device.kind === "videoinput");       //devices���� videoinput ���� cameras�� ����
        const currentCamera = myStream.getVideoTracks()[0];                             //
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label) {      //ī�޶� option�� ���� ���õ� ī�޶�� ���� label�� ������ �ִٸ� �װ� ����ϰ� �ִ� ī�޶��̴�.
                option.selected = true;                     //�ʱ⿡ ����ϰ� �ִ� ī�޶�� �ɼ��� ����
            }
            cameraSelect.appendChild(option);
        });
    } catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId) { //ī�޶�, ����ũ ,�ٸ� ī�޶�, stream���� �� �ҷ���
    myScreen.style.display = "block";
    const initialConstrains = {     //deviceId�� ���� ��(cameras ����� ��) ����(����� ����, ��ī���(ī�޶� ���� ��쿡�� ���x))
        audio: true,
        video: {facingMode: "user"},
    };
    const cameraConstraints = {     //deviceId�� �ְ� ���ڷ� ���� deviceId�� �ִ� ��� �ش� Id�� ��ü
        audio: true,
        video: { deviceId : {exact: deviceId} },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
        if (!deviceId) {            //ó���� getMedia�� �� ���� �����
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

async function handleCameraChange() {   //ī�޶� ��ü��
    await getMedia(cameraSelect.value);
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()       //sender�� �츮�� peer�� ������ media stream track�� ��Ʈ���ϰ� ����.
            .find((sender) => sender.track.kind === "video");   //sender�� �ٸ� �������� ������ ������ ����� �����͸� ��Ʈ���ϴ� ���
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
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

//Socket Code
socket.on("welcome", async () => {      //peer A ���������� ���� -> offer ����
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", console.log);
    console.log("made data channel");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);    //localDescription �ϰ� 
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);          //peer B�� offer ����
});

socket.on("offer", async (offer) => {                //peer B�� offer�� �޾Ƽ�
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", console.log);
    });
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);   //remoteDescription ����
    const answer = await myPeerConnection.createAnswer();   //peer B�� answer ���� �� 
    myPeerConnection.setLocalDescription(answer);    //localDescription ��
    console.log("sent the answer");
    socket.emit("answer", answer, roomName);        //answer�� ������ ��� ������� �˷����ϹǷ� roomName�� ����
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
function makeConnection() { //addStream�� ���� �Լ�, track���� ���������� �߰�����
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
    myPeerConnection.addEventListener("icecandidate", handleIce);   //candidate�� �������� �ڽ��� �������� �˷��ִ� ��
    //myPeerConnection.addEventListener("addstream", handleAddStream);
    myPeerConnection.addEventListener("track", handleTrack);
    //������ ���������� ī�޶�� ����ũ�� ������ stream�� �޾Ƽ� �װ͵��� ���� �ȿ� ����
    myStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));   
}

function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);   //peer A, B�� candidate���� ���� �ְ� �޴´ٴ� ��
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