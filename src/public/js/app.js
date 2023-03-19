const socket = io();   //socket.io�� �̿��� front-end���� back-end�� ����

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
//stream�� ������ ������� ���յ� ��
let myStream;
let muted = false;          //ó���� �Ҹ� x
let cameraOff = false;      //ó���� ī�޶� on

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