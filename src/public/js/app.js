const socket = io();   //socket.io�� �̿��� front-end���� back-end�� ����

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");

call.hidden = true;

let myStream;               //stream�� ������ ������� ���յ� ��
let muted = false;          //ó���� �Ҹ� x
let cameraOff = false;      //ó���� ī�޶� on
let roomName;
let myPeerConnection;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");     //devices���� videoinput ���� cameras�� ����
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label) {  //���� ī�޶� option�� ���� ���õ� ī�޶�� ���� label�� ������ �ִٸ� �װ� ����ϰ� �ִ� ī�޶��̴�.
                option.selected = true;         //�ʱ⿡ �� �ɼ��� ������ ���·� ����
            }
            cameraSelect.appendChild(option);
        });
    } catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId) { //ī�޶�, ����ũ ,�ٸ� ī�޶�, stream���� �� �ҷ���
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
socket.on("welcome", async () => {      //peer A ���������� ���� -> offer ����
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);    //localDescription �ϰ� 
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);          //peer B�� offer ����
});

socket.on("offer", async (offer) => {                //peer B�� offer�� �޾Ƽ�
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
    myPeerConnection = new RTCPeerConnection();
    myPeerConnection.addEventListener("icecandidate", handleIce);   //candidate�� �������� �ڽ��� �������� �˷��ִ� ��
    myPeerConnection.addEventListener("addstream", handleAddStream);
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
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
    console.log(myStream, "my stream");
    console.log(data.stream, "peer stream");
}