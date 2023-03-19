const socket = io();   //socket.io를 이용해 front-end에서 back-end로 연결

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
//stream은 비디오와 오디오가 결합된 것
let myStream;
let muted = false;          //처음에 소리 x
let cameraOff = false;      //처음에 카메라 on

async function getMedia() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,        
        });
        myFace.srcObject = myStream;
    } catch (e) {
        console.log(e);
    }
};

getMedia();

function handleMuteClick() {
    if(!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
};

function handleCameraClick() {
    if(cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
};

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);