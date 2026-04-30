import { useState, useRef, useEffect } from "react";
import { createContext, useContext } from "react";
import socketio from "socket.io-client";
import { useAuth } from "./AuthContext";
import { ringtone } from "../assets";
import { LocalStorage } from "../utils";

const webRtcContext = createContext(null);
const isDev = import.meta.env?.DEV;
const debugLog = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

// connect to the signalling socket server
const connectToSigServer = (userId) => {
  const signalingUrl = (import.meta.env?.VITE_SERVER_URL || "").trim().replace(/\/+$/, "");

  if (!signalingUrl) {
    throw new Error(
      "Missing signaling URL. Set VITE_SERVER_URL in client environment."
    );
  }

  const token = LocalStorage.get("token");

  return socketio(signalingUrl, {
    secure: signalingUrl?.startsWith("https"),
    withCredentials: true,
    auth: { token, userId },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 3,
  });
};

// custom hook to access webRTC instance from context
const useConnectWebRtc = () => useContext(webRtcContext);

// export the webRtcContextProvider
export default function WebRtcContextProvider({ children }) {
  // states for webRtcContext
  const [socket, setSocket] = useState(null);
  const [targetUserId, setTargetUserId] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [callConnectionState, setCallConnectionState] = useState(null); // "initiated", "connecting", "connected"
  const [showVideoComp, setShowVideoComp] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [inputVideoDevices, setInputVideoDevices] = useState([]);
  const [inputAudioDevices, setInputAudioDevices] = useState([]);
  const [selectedInputVideoDevice, setSelectedInputVideoDevice] = useState();
  const [selectedInputAudioDevice, setSelectedInputAudioDevice] = useState();

  // refs for webRtcContext
  const didIOffer = useRef(false); // current offer made by
  const cameraFace = useRef("user"); // ref for camera face two options ("user", "environment")
  const localVideoRef = useRef(); // reference to local video tag
  const remoteVideoRef = useRef(); // reference to remote video tag
  const localStreamRef = useRef(); // holds the local stream of current user
  const remoteStreamRef = useRef(new MediaStream()); // holds the remote stream comming from other peer
  const peerConnectionRef = useRef(); // holds RTCPeerConnection instance
  const audioRef = useRef(); // reference to the incoming audio ringtone

  const { user } = useAuth();
  const userId = user?._id;

  // fetch user media
  const fetchUserMedia = async (
    facingMode = "user",
    videoDeviceId = null,
    audioDeviceId = null
  ) => {
    try {
      const videoDeviceOptions = {
        facingMode,
      };

      const audioDeviceOptions = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
      if (videoDeviceId) {
        videoDeviceOptions.deviceId = videoDeviceId;
      }

      if (audioDeviceId) {
        audioDeviceOptions.deviceId = audioDeviceId;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoDeviceOptions,
        audio: audioDeviceOptions,
      });

      // get the video input devices id
      if (!navigator.mediaDevices?.enumerateDevices) {
        debugLog("enumerate devices not supported");
      } else {
        // list all the camera devices of user
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          const videoDevices = devices.filter(
            (device) => device.kind === "videoinput"
          );

          const audioDevices = devices.filter(
            (device) => device.kind === "audioinput"
          );

          setInputVideoDevices(videoDevices);
          setInputAudioDevices(audioDevices);
          debugLog(audioDevices);
        });
      }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // mute the audio feed to the local user
      }

      // get current selected video device id
      if (localStreamRef.current) {
        const currentVideoDeviceId = localStreamRef.current
          ?.getVideoTracks()[0]
          ?.getSettings().deviceId;

        const currentAudioDeviceId = localStreamRef.current
          ?.getAudioTracks()[0]
          ?.getSettings().deviceId;
        currentVideoDeviceId &&
          setSelectedInputVideoDevice(currentVideoDeviceId);

        currentAudioDeviceId &&
          setSelectedInputAudioDevice(currentAudioDeviceId);
      }
    } catch (error) {
      debugLog("Error while fetching userMedia..." + error);
    }
  };

  const replaceVideoAudioTracks = () => {
    if (peerConnectionRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track.kind === videoTrack.kind);
      if (sender) {
        sender.replaceTrack(videoTrack);
      }

      // add the audio stream to the peer connection
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      const audioSender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.trackId === audioTrack.trackId);
      if (audioSender) {
        audioSender.replaceTrack(audioTrack);
      }
    }
  };

  // flip camera
  const flipCamera = async () => {
    cameraFace.current = cameraFace.current === "user" ? "environment" : "user";

    // stop all local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    await fetchUserMedia(cameraFace.current);

    // replace the tracks in the peer connection
    replaceVideoAudioTracks();
  };

  const changeVideoInputDevice = async (videoDeviceId) => {
    if (!videoDeviceId) {
      debugLog("video input device id not provided");
      return;
    }

    // stop all local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    await fetchUserMedia(cameraFace.current, videoDeviceId);

    replaceVideoAudioTracks();
  };

  const changeAudioInputDevice = async (audioDeviceId) => {
    if (!audioDeviceId) {
      debugLog("audio input device id not provided");
      return;
    }

    // stop all local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    await fetchUserMedia(cameraFace.current, null, audioDeviceId);

    replaceVideoAudioTracks();
  };

  // create RTC peer connection
  const createPeerConnection = async (offerObj) => {
    if (!peerConnectionRef.current) {
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
            ],
          },
        ],
      });

      // set the remote videoRef srcObject if available
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }

      // listen to the ice candidate from the peerConnection
      peerConnectionRef.current.addEventListener("icecandidate", (event) => {
        if (event.candidate) {
          // console.log("ICE candidate found:");
          socket.emit("sendIceCandidateToSignalingServer", {
            iceCandidate: event.candidate,
            iceUserId: userId,
            didIOffer: didIOffer.current,
          });
        }
      });

      // listen for sigalling state change
      peerConnectionRef.current.addEventListener("signalingstatechange", () => {
        debugLog(
          "Signaling state change:",
          peerConnectionRef.current.signalingState
        );
      });

      // listen for the connection state change
      peerConnectionRef.current.addEventListener(
        "connectionstatechange",
        () => {
          debugLog(
            "Connection state change:",
            peerConnectionRef.current.connectionState
          );
          setCallConnectionState(peerConnectionRef.current.connectionState);
        }
      );

      // add event listener for the track coming from other peer
      peerConnectionRef.current.addEventListener("track", (event) => {
        debugLog("got track from other peer !!!");
        debugLog(event);
        event.streams[0].getTracks().forEach((track) => {
          remoteStreamRef.current.addTrack(track, remoteStreamRef.current);
        });
      });

      // add track to peer from the current local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnectionRef.current.addTrack(track, localStreamRef.current);
        });
      }

      // if the createPeerConnection was called by answer then set the offer object as remote description
      if (offerObj) {
        await peerConnectionRef.current.setRemoteDescription(offerObj.offer);
      }
    }
  };

  // handle call
  const handleCall = async () => {
    debugLog("handling Call called with targetUserId:", targetUserId);
    if (!targetUserId) {
      debugLog("other peer id not provided");
      return;
    }
    setCallConnectionState("initiated waiting to accept...");
    setShowVideoComp(true);
    await fetchUserMedia();
    await createPeerConnection();
    try {
      const newOffer = await peerConnectionRef.current.createOffer();
      peerConnectionRef.current.setLocalDescription(newOffer);
      // set did i offer to true
      didIOffer.current = true;
      // emit the new offer to signalling server to pass it to the other peer
      socket.emit("newOffer", { newOffer, sendToUserId: targetUserId.trim() });
    } catch (error) {
      debugLog("error while calling " + error);
    }
  };

  // handle hangup
  const handleHangup = (shouldNotifyPeer = true) => {
    // Close the peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop all local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Clear remote stream
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = new MediaStream();
    }

    // Emit hangup signal to the other peer
    if (shouldNotifyPeer && socket) {
      if (didIOffer.current === true) {
        socket.emit("hangupCall", targetUserId);
      } else {
        socket.emit("hangupCall", incomingOffer?.offererUserId || targetUserId);
      }
    }

    // Reset any other state variables if necessary
    setTargetUserId(null);
    didIOffer.current = false;

    setShowVideoComp(false);
    setIncomingOffer(null);
    audioRef.current?.pause();
    setInputVideoDevices([]);
  };

  // handle answer offer
  const handleAnswerOffer = async (offerObj) => {
    audioRef.current?.pause();
    if (offerObj?.offererUserId) {
      setTargetUserId(offerObj.offererUserId);
    }
    setIncomingOffer(null);
    setShowVideoComp(true);

    await fetchUserMedia();
    await createPeerConnection(offerObj);

    const answerOffer = await peerConnectionRef.current.createAnswer({}); // create answer offer
    await peerConnectionRef.current.setLocalDescription(answerOffer); // set local description
    debugLog("created an answer offer");
    offerObj.answer = answerOffer; // set answer offer to offerObj

    const offerIceCandidates = await socket.emitWithAck("newAnswer", offerObj);
    offerIceCandidates.forEach((c) => {
      peerConnectionRef.current.addIceCandidate(c);
      debugLog("addedIceCandidate");
    });
  };

  const handleAddAnswer = async (offerObj) => {
    await peerConnectionRef.current.setRemoteDescription(offerObj.answer);
    debugLog("client 1 set his remote description");
  };

  const handleAddIceCandidate = (iceCandidate) => {
    if (peerConnectionRef.current) {
      debugLog("addedIceCandidate");
      peerConnectionRef.current.addIceCandidate(iceCandidate);
    }
  };

  // handle the  incoming offers from other peers through singnalling server
  const handleIncomingOffer = async (offer) => {
    setIncomingOffer(offer);
    audioRef.current.play();
  };

  const HandleHangupCallReq = () => {
    handleHangup(false);
  };

  // connect to the signalling socket server
  useEffect(() => {
    if (!userId) return;

    const socketInstance = connectToSigServer(userId);
    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect(); // disconnect current socket connection
      }
    };
  }, [userId]);

  // listen for socket events
  useEffect(() => {
    if (socket) {
      // socket.on("assignUserId", handleAssignUserId); //
      socket.on("newOfferAwaiting", handleIncomingOffer);
      socket.on("answerResponse", handleAddAnswer);
      socket.on("receivedIceCandidateFromServer", handleAddIceCandidate);
      socket.on("hangupCallReq", HandleHangupCallReq);
    }
    return () => {
      if (socket) {
        // socket.off("assignUserId", handleAssignUserId); // clean up the listener when the component unmounts
        socket.off("newOfferAwaiting", handleIncomingOffer);
        socket.off("answerResponse", handleAddAnswer);
        socket.off("receivedIceCandidateFromServer", handleAddIceCandidate);
        socket.off("hangupCallReq", HandleHangupCallReq);
      }
    };
  }, [socket]);

  // function to handle toggle microphone
  const handleToggleMicrophone = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMicrophoneActive;
      });
      setIsMicrophoneActive((prev) => !prev);
    }
  };

  // function to handle toggle camera
  const handleToggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isCameraActive;
      });
      setIsCameraActive((prev) => !prev);
    }
  };

  return (
    <webRtcContext.Provider
      value={{
        setTargetUserId,
        localVideoRef,
        targetUserId,
        remoteVideoRef,
        handleHangup,
        callConnectionState,
        handleCall,
        handleAnswerOffer,
        incomingOffer,
        showVideoComp,
        handleToggleMicrophone,
        handleToggleCamera,
        isMicrophoneActive,
        isCameraActive,
        audioRef,
        flipCamera,
        inputVideoDevices,
        inputAudioDevices,
        selectedInputVideoDevice,
        selectedInputAudioDevice,
        changeVideoInputDevice,
        changeAudioInputDevice,
      }}
    >
      <audio ref={audioRef} src={ringtone} loop></audio>
      {children}
    </webRtcContext.Provider>
  );
}

export { useConnectWebRtc };
