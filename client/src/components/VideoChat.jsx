import React, { useState } from "react";
import { useConnectWebRtc } from "../context/WebRtcContext";
import {
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsMicFill,
  BsMicMuteFill,
  BsTelephoneXFill,
} from "react-icons/bs";
import { MdFlipCameraAndroid } from "react-icons/md";
import { RiArrowDropDownLine, RiArrowDropUpLine } from "react-icons/ri";

export default function VideoChat({ show }) {
  const {
    localVideoRef,
    remoteVideoRef,
    handleHangup,
    callConnectionState,
    handleToggleCamera,
    handleToggleMicrophone,
    isCameraActive,
    isMicrophoneActive,
    flipCamera,
    inputVideoDevices,
    selectedInputVideoDevice,
    changeVideoInputDevice,
    inputAudioDevices,
    selectedInputAudioDevice,
    changeAudioInputDevice,
  } = useConnectWebRtc();

  const [showVideoOptionTray, setShowVideoOptionTray] = useState(false);
  const [showAudioOptionTray, setShowAudioOptionTray] = useState(false);
  
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in md:p-10">
      
      {/* Main Call Container */}
      <div className="relative w-full h-full md:max-w-4xl md:max-h-[80vh] md:rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-white/10 group">
        
        {/* Remote Video (Full Size of Container) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-slate-950"
        ></video>
        
        {/* Loading State Overlay */}
        {callConnectionState !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <div className="text-white text-lg font-medium tracking-wide uppercase">{callConnectionState}...</div>
          </div>
        )}

        {/* Local Video (PiP format, draggable eventually) */}
        <div className="absolute top-6 right-6 md:top-8 md:right-8 w-32 h-48 md:w-48 md:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 transition-transform hover:scale-105 cursor-pointer bg-slate-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100" // Mirror local video
          ></video>
        </div>

        {/* Floating Controls Bar (Slides up on hover) */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 transition-transform duration-300 md:translate-y-4 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 flex items-center gap-4 bg-background/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-2xl">
          
          {/* Audio Controls */}
          <div className="relative flex items-center">
             <button
              onClick={handleToggleMicrophone}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${isMicrophoneActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-destructive text-white hover:bg-destructive/90'} shadow-sm`}
             >
               {isMicrophoneActive ? <BsMicFill className="text-lg"/> : <BsMicMuteFill className="text-lg"/>}
             </button>
             <button onClick={() => setShowAudioOptionTray(!showAudioOptionTray)} className="px-1 text-white hover:text-primary transition-colors hidden md:block">
               {showAudioOptionTray ? <RiArrowDropUpLine size={24}/> : <RiArrowDropDownLine size={24}/>}
             </button>
             
             {/* Audio Dropdown */}
             {showAudioOptionTray && (
               <div className="absolute bottom-[calc(100%+10px)] left-0 bg-background border border-border rounded-xl shadow-xl p-2 w-48 animate-fade-in hidden md:block">
                 <h4 className="text-[10px] uppercase text-muted-foreground font-bold px-2 py-1 mb-1">Microphone</h4>
                 {inputAudioDevices?.map((device) => (
                    <div 
                      key={device.deviceId}
                      onClick={() => { changeAudioInputDevice(device.deviceId); setShowAudioOptionTray(false); }}
                      className={`text-xs px-2 py-2 rounded-md cursor-pointer truncate ${device.deviceId === selectedInputAudioDevice ? 'bg-primary/20 text-primary font-bold' : 'text-foreground hover:bg-muted'}`}
                    >
                      {device.label || "Default Microphone"}
                    </div>
                 ))}
               </div>
             )}
          </div>

          {/* Video Controls */}
          <div className="relative flex items-center">
             <button
              onClick={handleToggleCamera}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${isCameraActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-destructive text-white hover:bg-destructive/90'} shadow-sm`}
             >
               {isCameraActive ? <BsCameraVideoFill className="text-lg"/> : <BsCameraVideoOffFill className="text-lg"/>}
             </button>
             <button onClick={() => setShowVideoOptionTray(!showVideoOptionTray)} className="px-1 text-white hover:text-primary transition-colors hidden md:block">
               {showVideoOptionTray ? <RiArrowDropUpLine size={24}/> : <RiArrowDropDownLine size={24}/>}
             </button>
             
             {/* Video Dropdown */}
             {showVideoOptionTray && (
               <div className="absolute bottom-[calc(100%+10px)] left-0 bg-background border border-border rounded-xl shadow-xl p-2 w-48 animate-fade-in hidden md:block">
                 <h4 className="text-[10px] uppercase text-muted-foreground font-bold px-2 py-1 mb-1">Camera</h4>
                 {inputVideoDevices?.map((device) => (
                    <div 
                      key={device.deviceId}
                      onClick={() => { changeVideoInputDevice(device.deviceId); setShowVideoOptionTray(false); }}
                      className={`text-xs px-2 py-2 rounded-md cursor-pointer truncate ${device.deviceId === selectedInputVideoDevice ? 'bg-primary/20 text-primary font-bold' : 'text-foreground hover:bg-muted'}`}
                    >
                      {device.label || "Default Camera"}
                    </div>
                 ))}
               </div>
             )}
          </div>

          {/* Flip Camera */}
          <button
            onClick={flipCamera}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-muted/50 text-foreground hover:bg-muted shadow-sm transition-all md:hidden"
          >
            <MdFlipCameraAndroid className="text-lg"/>
          </button>
          
          <div className="w-[1px] h-8 bg-border/50 mx-2"></div>

          {/* Hangup */}
          <button
            onClick={handleHangup}
            className="w-16 h-12 flex items-center justify-center rounded-xl bg-destructive hover:bg-destructive/90 text-white shadow-lg transition-transform active:scale-95"
          >
            <BsTelephoneXFill className="text-lg" />
          </button>

        </div>
      </div>
    </div>
  );
}
