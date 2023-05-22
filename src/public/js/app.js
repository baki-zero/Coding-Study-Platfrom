const socket = io();   //socket.io를 이용해 front-end에서 back-end로 연결

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

let myStream;               //stream은 비디오와 오디오가 결합된 것
let muted = false;          //처음에 소리 x
let cameraOff = false;      //처음에 카메라 on
let roomName;               //방이름
let myPeerConnection;       

if (adapter.browserDetails.browser === 'chrome' && adapter.browserDetails.version >= 107) {
    // See https://developer.chrome.com/docs/web-platform/screen-sharing-controls/
    selectOptions.style.display = "block";
} else if (adapter.browserDetails.browser === 'firefox') {
    // Polyfill in Firefox.
    // See https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
    adapter.browserShim.shimGetDisplayMedia(window, 'screen');
}

// 카메라 정보 가져오기
async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();                //사용 가능한 미디어 입출력 장치 목록 요청
        const cameras = devices.filter((device) => device.kind === "videoinput");       //devices에서 videoinput 값만 cameras에 저장
        const currentCamera = myStream.getVideoTracks()[0];                             //
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label) {      //카메라 option이 현재 선택된 카메라와 같은 label을 가지고 있다면 그게 사용하고 있는 카메라이다.
                option.selected = true;                     //초기에 사용하고 있는 카메라로 옵션을 설정
            }
            cameraSelect.appendChild(option);
        });
    } catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId) { //카메라, 마이크 ,다른 카메라, stream들을 다 불러옴
    myScreen.style.display = "block";
    const initialConstrains = {     //deviceId가 없을 때(cameras 만들기 전) 실행(오디오 설정, 셀카모드(카메라가 없는 경우에는 출력x))
        audio: true,
        video: {facingMode: "user"},
    };
    const cameraConstraints = {     //deviceId가 있고 인자로 받은 deviceId가 있는 경우 해당 Id로 교체
        audio: true,
        video: { deviceId : {exact: deviceId} },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
        if (!deviceId) {            //처음에 getMedia를 할 때만 실행됨
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

async function handleCameraChange() {   //카메라 교체시
    await getMedia(cameraSelect.value);
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()       //sender는 우리의 peer로 보내진 media stream track을 컨트롤하게 해줌.
            .find((sender) => sender.track.kind === "video");   //sender은 다른 브라우저로 보내진 비디오와 오디오 데이터를 컨트롤하는 방법
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
socket.on("welcome", async () => {      //peer A 브라우저에서 실행 -> offer 생성
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", console.log);
    console.log("made data channel");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);    //localDescription 하고 
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);          //peer B로 offer 전송
});

socket.on("offer", async (offer) => {                //peer B가 offer을 받아서
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", console.log);
    });
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);   //remoteDescription 설정
    const answer = await myPeerConnection.createAnswer();   //peer B가 answer 생성 후 
    myPeerConnection.setLocalDescription(answer);    //localDescription 함
    console.log("sent the answer");
    socket.emit("answer", answer, roomName);        //answer을 받으면 모든 사람에게 알려야하므로 roomName도 전달
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
function makeConnection() { //addStream과 같은 함수, track들을 개별적으로 추가해줌
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
    myPeerConnection.addEventListener("icecandidate", handleIce);   //candidate는 브라우저가 자신의 소통방식을 알려주는 것
    //myPeerConnection.addEventListener("addstream", handleAddStream);
    myPeerConnection.addEventListener("track", handleTrack);
    //각각의 브라우저에서 카메라와 마이크의 데이터 stream을 받아서 그것들을 연결 안에 넣음
    myStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));   
}

function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);   //peer A, B가 candidate들을 서로 주고 받는다는 뜻
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