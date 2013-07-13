window.RTCPeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
window.RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
window.URL = window.URL || window.webkitURL;

function getUserMedia(){
  return navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia;
}

function hasGetUserMedia() {
  return !!(getUserMedia());
}

if (hasGetUserMedia()) {
  navigator.getUserMedia = getUserMedia();
} else {
  alert('navigator.getUserMedia() is not supported in your browser');
}