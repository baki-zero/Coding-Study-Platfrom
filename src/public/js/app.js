const socket = io();   //socket.io를 이용해 front-end에서 back-end로 연결

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");

call.hidden = true;

let myStream;               //stream은 비디오와 오디오가 결합된 것
let muted = false;          //처음에 소리 x
let cameraOff = false;      //처음에 카메라 on
let roomName;
let myPeerConnection;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");     //devices에서 videoinput 값만 cameras에 저장
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label) {  //만약 카메라 option이 현재 선택된 카메라와 같은 label을 가지고 있다면 그게 사용하고 있는 카메라이다.
                option.selected = true;         //초기에 이 옵션을 선택한 상태로 설정
            }
            cameraSelect.appendChild(option);
        });
    } catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId) { //카메라, 마이크 ,다른 카메라, stream들을 다 불러옴
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

async function handleCameraChange() {   //
    await getMedia(cameraSelect.value);
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
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);    //localDescription 하고 
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);          //peer B로 offer 전송
});

socket.on("offer", async (offer) => {                //peer B가 offer을 받아서
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
    myPeerConnection = new RTCPeerConnection();
    myPeerConnection.addEventListener("icecandidate", handleIce);   //candidate는 브라우저가 자신의 소통방식을 알려주는 것
    myPeerConnection.addEventListener("addstream", handleAddStream);
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
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
    console.log(myStream, "my stream");
    console.log(data.stream, "peer stream");
}