const socket = io();   //socket.io�� �̿��� front-end���� back-end�� ����

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
//stream�� ������ ������� ���յ� ��
let myStream;
let muted = false;          //ó���� �Ҹ� x
let cameraOff = false;      //ó���� ī�޶� on

async function getCameras() {
try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === "videoinput");     //devices���� videoinput ���� cameras�� ����
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach(camera => {
        const option = document.createElement("option");
        option.value = camera.deviceId;
        option.innerText = camera.label;
        if(currentCamera.label === camera.label) {  //���� ī�޶� option�� ���� ���õ� ī�޶�� ���� label�� ������ �ִٸ� �װ� ����ϰ� �ִ� ī�޶��̴�.
            option.selected = true;         //�ʱ⿡ �� �ɼ��� ������ ���·� ����
        }
        cameraSelect.appendChild(option);
    })
} catch(e) {
    console.log(e);
}
}

async function getMedia(deviceId) {
    const initialConstraints = {     //deviceId�� ���� ��(cameras ����� ��) ����(����� ����, ��ī���(ī�޶� ���� ��쿡�� ���x))
        audio: true,
        video: {facingMode: "user"},
    };
    const cameraConstraints = {     //deviceId�� �ְ� ���ڷ� ���� deviceId�� �ִ� ��� �ش� Id�� ��ü
        audio: true,
        video: { deviceId : {exact: deviceId} },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraints : initialConstraints
        );
        myFace.srcObject = myStream;
        if (!deviceId) {            //ó���� getMedia�� �� ���� �����
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