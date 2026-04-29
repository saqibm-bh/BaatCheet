import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { getAvailableUsers } from "../api";
import { BsGridFill, BsQrCodeScan, BsShieldCheck } from "react-icons/bs";
import { FiCamera } from "react-icons/fi";
import QRCode from "qrcode";
import UserAvatar from "./UserAvatar";

// For the logout icon
const LogoutIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
)

export default function ProfileSidebar() {
  const { user, logout, updateProfile, isUpdatingProfile, authError } = useAuth();
  const {
    currentUserChats,
    setNewChatUser,
    setOpenAddChat,
    setActiveLeftSidebar,
  } = useChat();
  const fileInputRef = useRef(null);
  const qrVideoRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const scannerFrameRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareQrDataUrl, setShareQrDataUrl] = useState("");
  const [shareQrError, setShareQrError] = useState("");
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [scanStatus, setScanStatus] = useState("");

  useEffect(() => {
    if (!user || isEditing) return;

    setUsername(user.username || "");
    setBio(user.bio || "");
    setAvatarPreview(user.avatarUrl || "");
  }, [user, isEditing]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const stopScanner = () => {
    if (scannerFrameRef.current) {
      cancelAnimationFrame(scannerFrameRef.current);
      scannerFrameRef.current = null;
    }

    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((track) => track.stop());
      scannerStreamRef.current = null;
    }

    if (qrVideoRef.current) {
      qrVideoRef.current.srcObject = null;
    }

    setIsScanningQr(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const onEditStart = () => {
    setUsername(user?.username || "");
    setBio(user?.bio || "");
    setAvatarPreview(user?.avatarUrl || "");
    setAvatarFile(null);
    setIsEditing(true);
  };

  const onEditCancel = () => {
    setIsEditing(false);
    setUsername(user?.username || "");
    setBio(user?.bio || "");
    setAvatarPreview(user?.avatarUrl || "");
    setAvatarFile(null);
  };

  const onAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSaveProfile = async () => {
    const normalizedUsername = username.trim().toLowerCase();
    const trimmedBio = bio.trim();

    const payload = {};

    if (
      normalizedUsername &&
      normalizedUsername !== (user?.username || "").toLowerCase()
    ) {
      payload.username = normalizedUsername;
    }

    if (trimmedBio !== (user?.bio || "")) {
      payload.bio = trimmedBio;
    }

    if (avatarFile) {
      payload.avatarFile = avatarFile;
    }

    if (!Object.keys(payload).length) {
      setIsEditing(false);
      return;
    }

    const isSuccess = await updateProfile(payload);
    if (!isSuccess) return;

    setIsEditing(false);
    setAvatarFile(null);
  };

  const openShareModal = async () => {
    setIsShareModalOpen(true);
    setShareQrError("");
    setScanStatus("");

    try {
      if (!user?._id) {
        setShareQrError("Unable to generate QR code right now.");
        return;
      }

      const dataUrl = await QRCode.toDataURL(user._id, {
        margin: 1,
        width: 300,
      });
      setShareQrDataUrl(dataUrl);
    } catch (error) {
      setShareQrError("Failed to generate QR code.");
    }
  };

  const closeShareModal = () => {
    stopScanner();
    setScanStatus("");
    setIsShareModalOpen(false);
  };

  const handleShareId = async () => {
    if (!user?._id) return;

    const shareMessage = `Connect with me on BaatCheet. My ID: ${user._id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "BaatCheet ID",
          text: shareMessage,
        });
        return;
      }

      await navigator.clipboard.writeText(user._id);
      setScanStatus("ID copied to clipboard.");
    } catch (error) {
      setScanStatus("Unable to share right now.");
    }
  };

  const handleScannedUserId = async (rawValue) => {
    const scannedValue = (rawValue || "").trim();

    if (!scannedValue) {
      setScanStatus("No user ID detected.");
      return;
    }

    if (scannedValue === user?._id) {
      setScanStatus("This is your own ID. Scan another user.");
      return;
    }

    setScanStatus("Looking up user...");

    try {
      const { data } = await getAvailableUsers(scannedValue);
      const users = data?.data?.users || [];
      const matchedUser =
        users.find((searchedUser) => searchedUser?._id === scannedValue) ||
        users[0];

      if (!matchedUser?._id) {
        setScanStatus("No user found for this ID.");
        return;
      }

      setNewChatUser(matchedUser);
      setActiveLeftSidebar("searchUser");
      setOpenAddChat(true);
      closeShareModal();
    } catch (error) {
      setScanStatus("No user found for this ID.");
    }
  };

  const startScanner = async () => {
    setScanStatus("");

    if (!window.BarcodeDetector) {
      setScanStatus(
        "Camera QR scanning is not supported in this browser. Use manual share/copy."
      );
      return;
    }

    try {
      const scannerStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });

      scannerStreamRef.current = scannerStream;

      if (!qrVideoRef.current) {
        setScanStatus("Unable to start scanner.");
        return;
      }

      qrVideoRef.current.srcObject = scannerStream;
      await qrVideoRef.current.play();

      const barcodeDetector = new window.BarcodeDetector({
        formats: ["qr_code"],
      });

      setIsScanningQr(true);
      setScanStatus("Scanning for QR code...");

      const detectQrCode = async () => {
        if (!qrVideoRef.current || !isShareModalOpen) return;

        try {
          const foundCodes = await barcodeDetector.detect(qrVideoRef.current);
          const qrCodeValue = foundCodes?.[0]?.rawValue;

          if (qrCodeValue) {
            stopScanner();
            await handleScannedUserId(qrCodeValue);
            return;
          }
        } catch (error) {
          setScanStatus("Scanning failed. Please try again.");
          stopScanner();
          return;
        }

        scannerFrameRef.current = requestAnimationFrame(detectQrCode);
      };

      scannerFrameRef.current = requestAnimationFrame(detectQrCode);
    } catch (error) {
      setScanStatus("Camera access denied or unavailable.");
      stopScanner();
    }
  };

  return (
    <div className="w-full h-full px-5 py-6 bg-background/50 glass-panel overflow-y-auto no-scrollbar relative animate-fade-in">
      
      {/* Header */}
      <div className="sticky top-0 z-20 flex justify-between items-center mb-5 py-2 bg-background/75 backdrop-blur-md border-b border-border/40">
        <div>
          <h1 className="text-foreground font-bold text-3xl tracking-tight">Profile</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your public identity</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={onEditStart}
              data-tooltip="Edit your profile"
              data-tooltip-pos="bottom"
              className="hci-tooltip px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 transition-colors text-xs font-semibold"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={onEditCancel}
                data-tooltip="Discard changes"
                data-tooltip-pos="bottom"
                className="hci-tooltip px-3 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={onSaveProfile}
                disabled={isUpdatingProfile}
                data-tooltip="Save profile"
                data-tooltip-pos="bottom"
                className="hci-tooltip px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-semibold disabled:opacity-60"
              >
                {isUpdatingProfile ? "Saving..." : "Save"}
              </button>
            </>
          )}

          <button
            onClick={logout}
            aria-label="Sign out"
            data-tooltip="Sign out"
            data-tooltip-pos="bottom"
            className="hci-tooltip flex items-center justify-center p-2.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors"
            title="Sign out"
          >
            <LogoutIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {authError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {authError}
        </div>
      )}

      {/* Bento Grid layout */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Bio Card (Spans 2 cols) */}
        <div className="col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/12 via-primary/5 to-transparent border border-primary/20 p-6 flex flex-col items-center text-center shadow-sm">
           {/* Abstract shape */}
           <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
           
           <div className="relative group cursor-pointer mb-4">
             <UserAvatar
              src={avatarPreview || user?.avatarUrl}
              alt={user?.username}
              sizeClass="w-24 h-24"
              className="border-4 border-background shadow-md group-hover:scale-105 transition-transform duration-300"
              fallbackClassName="bg-primary/10 text-primary"
              iconClassName="text-[50%]"
            />
             <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-background rounded-full"></div>
             {isEditing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change avatar"
                data-tooltip="Change photo"
                className="hci-tooltip absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground p-2 shadow-lg hover:bg-primary/90 transition-colors"
              >
                <FiCamera className="text-sm" />
              </button>
             )}
           </div>

           {isEditing && (
            <p className="text-[11px] text-muted-foreground mb-2">
              Tap camera to update profile photo
            </p>
           )}

           <input
             ref={fileInputRef}
             type="file"
             accept="image/*"
             onChange={onAvatarChange}
             className="hidden"
           />
           
           {isEditing ? (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={40}
              className="mb-2 w-full max-w-xs bg-background/80 border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Username"
            />
           ) : (
            <h2 className="text-xl font-bold text-foreground mb-1">{user?.username}</h2>
           )}

           <p className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">{user?.email}</p>

           {isEditing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="w-full max-w-sm bg-background/80 border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Write your bio"
            />
           ) : (
            <p className="text-sm text-muted-foreground max-w-[90%] leading-relaxed">
              {user?.bio || "Enjoying the premium communication experience with BaatCheet."}
            </p>
           )}

           {isEditing && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                Username is saved in lowercase. Bio max length: 200.
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {bio.trim().length}/200
              </p>
            </div>
           )}
        </div>

        {/* Stats Card */}
        <div className="col-span-1 rounded-3xl bg-muted/40 border border-border/50 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
             <BsGridFill />
          </div>
          <div>
            <h3 className="text-3xl font-black text-foreground mb-1 tracking-tighter">{currentUserChats?.length || 0}</h3>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active<br/>Chats</p>
          </div>
        </div>

        {/* QR Code / Share Card */}
        <div
          onClick={openShareModal}
          className="col-span-1 rounded-3xl bg-muted/40 border border-border/50 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group cursor-pointer overflow-hidden relative"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform z-10">
             <BsQrCodeScan />
          </div>
          <div className="z-10">
            <h3 className="text-sm font-bold text-foreground mb-1">Share ID</h3>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Tap to scan</p>
          </div>
          {/* Faux QR pattern watermark */}
          <div className="absolute -bottom-6 -right-6 text-foreground opacity-5 pointer-events-none transform rotate-12 scale-150">
             <BsQrCodeScan size={100} />
          </div>
        </div>
        
        {/* Security / Privacy Banner (Spans 2 cols) */}
        <div className="col-span-2 rounded-3xl bg-muted/40 border border-border/50 p-5 flex items-center gap-4 shadow-sm">
           <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500 shrink-0">
             <BsShieldCheck className="text-xl" />
           </div>
           <div>
             <h4 className="text-sm font-bold text-foreground">Advanced Privacy</h4>
             <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Your data is yours. Secure conversations and modern encryption.</p>
           </div>
        </div>
        
      </div>

      {isShareModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-background p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Share your BaatCheet ID</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask your friend to scan this code or copy your ID.
                </p>
              </div>
              <button
                type="button"
                onClick={closeShareModal}
                className="px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4 flex flex-col items-center">
              {shareQrDataUrl ? (
                <img
                  src={shareQrDataUrl}
                  alt="Your BaatCheet ID QR code"
                  className="w-48 h-48 rounded-xl bg-white p-2"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-muted animate-pulse" />
              )}

              <p className="mt-3 text-xs text-muted-foreground break-all text-center">
                {user?._id || "User ID unavailable"}
              </p>

              {shareQrError && (
                <p className="mt-2 text-xs text-destructive">{shareQrError}</p>
              )}

              <div className="mt-4 flex w-full gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!user?._id) return;
                    await navigator.clipboard.writeText(user._id);
                    setScanStatus("ID copied to clipboard.");
                  }}
                  className="flex-1 rounded-xl bg-muted px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/80"
                >
                  Copy ID
                </button>
                <button
                  type="button"
                  onClick={handleShareId}
                  className="flex-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Share
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Scan friend QR</p>
                {!isScanningQr ? (
                  <button
                    type="button"
                    onClick={startScanner}
                    className="text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-600 px-2.5 py-1.5"
                  >
                    Start scan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopScanner}
                    className="text-xs font-semibold rounded-lg bg-destructive/15 text-destructive px-2.5 py-1.5"
                  >
                    Stop
                  </button>
                )}
              </div>

              <video
                ref={qrVideoRef}
                muted
                playsInline
                className="mt-3 w-full h-44 rounded-xl bg-black object-cover"
              />

              {scanStatus && (
                <p className="mt-2 text-xs text-muted-foreground">{scanStatus}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
