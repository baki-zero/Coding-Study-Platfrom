const socket = io();   //socket.io를 이용해 front-end에서 back-end로 연결

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
//stream은 비디오와 오디오가 결합된 것
let myStream;
let muted = false;          //처음에 소리 x
let cameraOff = false;      //처음에 카메라 on

async function getCameras() {
try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === "videoinput");     //devices에서 videoinput 값만 cameras에 저장
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach(camera => {
        const option = document.createElement("option");
        option.value = camera.deviceId;
        option.innerText = camera.label;
        if(currentCamera.label === camera.label) {  //만약 카메라 option이 현재 선택된 카메라와 같은 label을 가지고 있다면 그게 사용하고 있는 카메라이다.
            option.selected = true;         //초기에 이 옵션을 선택한 상태로 설정
        }
        cameraSelect.appendChild(option);
    })
} catch(e) {
    console.log(e);
}
}

async function getMedia(deviceId) {
    const initialConstraints = {     //deviceId가 없을 때(cameras 만들기 전) 실행(오디오 설정, 셀카모드(카메라가 없는 경우에는 출력x))
        audio: true,
        video: {facingMode: "user"},
    };
    const cameraConstraints = {     //deviceId가 있고 인자로 받은 deviceId가 있는 경우 해당 Id로 교체
        audio: true,
        video: { deviceId : {exact: deviceId} },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraints : initialConstraints
        );
        myFace.srcObject = myStream;
        if (!deviceId) {            //처음에 getMedia를 할 때만 실행됨
            await getCameras();         
        }
        
    } catch (e) {
        console.log(e);
    }
};

getMedia();

function handleMuteClick() {
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
};

function handleCameraClick() {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    if(cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
};

async function handleCameraChange() {
    await getMedia(cameraSelect.value);
}


muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);

cameraSelect.addEventListener("input", handleCameraChange);