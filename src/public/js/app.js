const socket = io();    //io function은 알아서 socket.io를 실행하고 있는 서버를 찾는다.

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("displaySurface");
const call = document.getElementById("call");
const startButton = document.getElementById("startButton");
const selectOptions = document.getElementById("selectOptions");
const myScreen = document.getElementById("myScreen");
const peerScreen1 = document.getElementById("peerScreen1");
const peerScreen2 = document.getElementById("peerScreen2");
const peerScreen3 = document.getElementById("peerScreen3");
const peerFace1 = document.getElementById("peerFace1");
const peerFace2 = document.getElementById("peerFace2");
const peerFace3 = document.getElementById("peerFace3");
const chatContainer = document.getElementById("chat-container");
const body = document.querySelector("body");

call.hidden = true;     //study 방 입장 화면 숨김 처리    

let myStream;           //stream을 받을 변수, stream은 비디오와 오디오가 결합된 것      
let muted = false;      //최초 접속시 소리 켜기   
let cameraOff = false;  //최초 접속시 카메라 켜기    
let roomName;           //방 이름 변수
let myPeerConnection;   //누군가 getMedia 함수를 호출했을 때 같은 stream을 공유하기 위한 변수    


//adapter 설정
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
        const devices = await navigator.mediaDevices.enumerateDevices();                  //장치 리스트 가져오기
        const cameras = devices.filter((device) => device.kind === "videoinput");         //videoinput 값만 가져오기
        const currentCamera = myStream.getVideoTracks()[0];                               //비디오 트랙의 첫번째 track 가져오기
        cameras.forEach((camera) => {                           
            const option = document.createElement("option");    //option 태그 생성
            option.value = camera.deviceId;                     //camera 장치 값을 option value 값에 저장
            option.innerText = camera.label;                    //camera label값을 option innerText에 저장
            if(currentCamera.label === camera.label) {          //비디오 트랙의 첫번째 track이 cameras에 있는 label과 같다면 해당 label 선택
                option.selected = true;     
            }
            cameraSelect.appendChild(option);                   //option을 cameraSelect 하위 태그로 넣어주기
            option.style.fontSize="18px";
        });
    } catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId) { 
    myScreen.style.display = "block";
    const initialConstrains = {                                 //deviceId가 없는 경우 실행
        audio: true,
        video: {facingMode: "user"},                            //카메라 전후면 둘 다 있을 시 전면 카메라 정보 받아옴 (후면카메라:environment)
    };
    const cameraConstraints = {                                 //deviceId가 있는 경우 실행
        audio: true,
        video: { deviceId : {exact: deviceId} },                //exact를 사용해 원하는 장치 ID와 정확히 일치하는 장치만 선택
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains 
        );
        myFace.srcObject = myStream;
        if (!deviceId) {                                        //최초 접속시 1번 실행
            await getCameras();         
        }
    } catch (e) {
        console.log(e);
    }
}

function handleMuteClick() {        //소리 설정
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if(!muted) {
        muteBtn.innerText = "소리 켜기";
        muted = true;
    } else {
        muteBtn.innerText = "소리 끄기";
        muted = false;
    }
}

function handleCameraClick() {      //카메라 설정
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if(cameraOff) {
        cameraBtn.innerText = "카메라 끄기";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "카메라 켜기";
        cameraOff = true;
    }
}

async function handleCameraChange() {       //카메라 교체
    await getMedia(cameraSelect.value);
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders() 
            .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

//화면공유 코드 부분
let screenVideoTrack;
function handleSuccess(stream) {    //steam 연결에 성공했을 때 실행되는 함수
    startButton.disabled = true;    
    cameraSelect.disabled = true;
    myFace.srcObject = stream;

    screenVideoTrack = myStream.getVideoTracks()[0];
    screenVideoTrack.addEventListener('ended', () => {
      errorMsg('The user has ended sharing the screen');
      startButton.disabled = false;
      cameraSelect.disabled = false;
    });
}

function handleError(error) {
    console.log(error);
}

startButton.addEventListener("click", () => {
    const options = { video: true };
    const displaySurface = cameraSelect.options[cameraSelect.selectedIndex].value;
    if (displaySurface !== 'default') {
        options.video = {displaySurface};
    }
    navigator.mediaDevices.getDisplayMedia(options).then(handleSuccess, handleError);
});

if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
    startButton.disabled = false;
}
else {
    console.log('getDisplayMedia is not supported');
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);
//cameraSelect.addEventListener("input", handleScreenShareChange);

// Welcome Form (join a room), chat code
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const chatView = document.getElementById("chatView");
const chatForm = document.getElementById("chatForm");
const nickName = document.getElementById("nickName");
const h1 = document.querySelector("h1");

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
    body.removeAttribute("style");
    h1.removeAttribute("style");
    body.style.fontFamily = "Gothic A1";
    h1.style.fontWeight = "bold";
    h1.style.webkitTextStroke = "2px white";
    h1.style.color = "white";
    h1.style.fontSize = "40px";
    h1.style.textAlign = "center";
    h1.style.margin = "0";
    h1.style.marginBottom = "10px";
    h1.style.letterSpacing = "5px";
    body.style.backgroundImage = "url('https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2Fcmseu8%2Fbtq6Z9KJYXo%2FaDlzENDratLaBwK2MYrPF1%2Fimg.jpg')";
    body.style.backgroundSize = "cover";
    body.style.backgroundRepeat = "no-repeat";
    const homeIcon = document.querySelector("i");
    homeIcon.style.color = "white";

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
    li.style.fontSize = "25px";
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
    // 사용자 퇴장 시 해당 사용자의 박스 숨김 처리
});

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
    myPeerConnection.addEventListener("track", handleTrack);
    myStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));   
}

function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
}

function handleTrack(data) {
    if(!(data['track']['kind']==="audio")) return;
    if(!peerFace1.srcObject) {
        peerScreen1.style.display = "block";
        peerFace1.srcObject = data.streams[0];
        console.log(myStream, "my stream");
        console.log(data.streams[0], "peer stream");
    } else if(!peerFace2.srcObject&&peerScreen2.style.display=='none') {
        peerScreen2.style.display = "block";
        peerFace2.srcObject = data.streams[0];
        console.log(myStream, "my stream");
        console.log(data.streams[0], "peer stream");
    } else if(!peerFace3.srcObject&&peerScreen3.style.display=='none') {
        peerScreen3.style.display = "block";
        peerFace3.srcObject = data.streams[0];
        console.log(myStream, "my stream");
        console.log(data.streams[0], "peer stream");
    } else {
        console.log("You can't Enter the Room");
    }
}

//code share page
const codePage = document.getElementById("code");

function handlecodePageClick() {
    window.open('https://yorkie.dev/yorkie-js-sdk/examples/vanilla-codemirror6/', '_blank');
}

// 버튼 클릭 이벤트에 handleClick 함수를 연결
codePage.addEventListener('click', handlecodePageClick);
