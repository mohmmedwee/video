let isAlreadyCalling = false;
let getCalled = false;

const existingCalls = [];
const stram= [];
const { RTCPeerConnection, RTCSessionDescription } = window;

const peerConnection = new RTCPeerConnection();

function unselectUsersFromList() {
  const alreadySelectedUser = document.querySelectorAll(
    ".active-user.active-user--selected"
  );

  alreadySelectedUser.forEach(el => {
    el.setAttribute("class", "active-user");
  });
}

function createUserItemContainer(socketId) {
  const userContainerEl = document.createElement("div");
  const camer_btn_stop = document.getElementById("stop-camera");
  const camer_btn_start = document.getElementById("start-camera");
  const usernameEl = document.createElement("p");
  userContainerEl.setAttribute("class", "active-user");
  userContainerEl.setAttribute("id", socketId);
  usernameEl.setAttribute("class", "username");
  usernameEl.innerHTML = `Socket: ${socketId}`;

  userContainerEl.appendChild(usernameEl);



  camer_btn_stop.addEventListener("click",()=>{

    socket.emit("stop-camera", {
      to: socketId,
      data:'user_stop_camer'
    });

   let x =  document.getElementById("local-video");
   x.style.display='none'
  });




  camer_btn_start.addEventListener("click",()=>{



    socket.emit("start-camera", {
      to: socketId,
      data:'user_start_camer'
    });
    let x =  document.getElementById("local-video");
    x.style.display='block'
  });









  userContainerEl.addEventListener("click", () => {
    unselectUsersFromList();
    userContainerEl.setAttribute("class", "active-user active-user--selected");
    const talkingWithInfo = document.getElementById("talking-with-info");
    talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
    callUser(socketId);
  });

  return userContainerEl;
}

async function callUser(socketId) {
  const offer = await peerConnection.createOffer();
  console.log(offer,peerConnection.setLocalDescription);
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
  socket.emit("call-user", {
    offer,
    to: socketId
  });
}

function updateUserList(socketIds) {
  const activeUserContainer = document.getElementById("active-user-container");

  socketIds.forEach(socketId => {
    const alreadyExistingUser = document.getElementById(socketId);
    if (!alreadyExistingUser) {
      const userContainerEl = createUserItemContainer(socketId);
      activeUserContainer.appendChild(userContainerEl);
    }
  });
}

const socket = io.connect("http://198.211.117.99:5000");

socket.on("update-user-list", ({ users }) => {
  updateUserList(users);
});

socket.on("remove-user", ({ socketId }) => {
  const elToRemove = document.getElementById(socketId);
  if (elToRemove) {
    elToRemove.remove();
  }
});


socket.on("call-ring", async data => {
  // console.log(1)
  // const  audio = new Audio('img/ring.mp3');
  // audio.play();
});
socket.on("call-made", async data => {
  if (getCalled) {


    const confirmed = confirm(
      `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
    );

    console.log(confirmed,1)

    if(confirmed){
      // const  audio = new Audio('img/ring.mp3');
      // audio.pause();
      // alert(1)
    }
    if (!confirmed) {
      socket.emit("reject-call", {
        from: data.socket
      });
      // const  audio = new Audio('img/ring.mp3');
      // audio.pause();
      return;
    }
  }

  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

  socket.emit("make-answer", {
    answer,
    to: data.socket
  });
  getCalled = true;
});




socket.on("answer-made", async data => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );

  if (!isAlreadyCalling) {
    callUser(data.socket);
    isAlreadyCalling = true;
  }
});






socket.on("call-rejected", data => {
  alert(`User: "Socket: ${data.socket}" rejected your call.`);
  unselectUsersFromList();
});

socket.on("camera-stop", data => {
  alert(`User: "Socket:  camera stop`);
});

socket.on("camera-start", data => {
  alert(`User: "Socket:  camera start`);
});




peerConnection.ontrack = function({ streams: [stream] }) {
  const remoteVideo = document.getElementById("remote-video");
  if (remoteVideo) {
    remoteVideo.srcObject = stream;
  }
};

navigator.getUserMedia(
  { video: true, audio: true },
  stream => {
    const localVideo = document.getElementById("local-video");
    if (localVideo) {
      localVideo.srcObject = stream;
    }
    this.stram = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
  },
  error => {
    console.warn(error.message);
  }
);
