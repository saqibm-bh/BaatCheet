import { useCallback, useMemo } from "react";
import confetti from "canvas-confetti";

export const useMessageComposer = ({
  message,
  setMessage,
  attachments,
  setAttachments,
  sendingMessage,
  messageError,
  setMessageError,
  sendChatMessage,
}) => {
  const canSend = useMemo(
    () => !sendingMessage && (!!message || !!attachments.length),
    [sendingMessage, message, attachments]
  );

  const clearMessageError = useCallback(() => {
    if (messageError) setMessageError(null);
  }, [messageError, setMessageError]);

  const handleInputChange = useCallback(
    (e) => {
      clearMessageError();
      setMessage(e.target.value);
    },
    [clearMessageError, setMessage]
  );

  const handleAttachmentChange = useCallback(
    (e) => {
      clearMessageError();
      setAttachments([...e.target.files]);
    },
    [clearMessageError, setAttachments]
  );

  const fireConfettiIfNeeded = (msg) => {
    // Regex matches strings that contain only standard emojis (no text/numbers)
    const emojiRegex = /^[\p{Emoji}\s]+$/u;
    if (msg && emojiRegex.test(msg.trim()) && msg.trim().length > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      });
    }
  };

  const handleInputKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && canSend) {
        fireConfettiIfNeeded(message);
        sendChatMessage();
      }
    },
    [canSend, sendChatMessage, message]
  );

  const handleSendClick = useCallback(() => {
    if (!canSend) return;
    fireConfettiIfNeeded(message);
    sendChatMessage();
  }, [canSend, sendChatMessage, message]);

  return {
    canSend,
    clearMessageError,
    handleInputChange,
    handleAttachmentChange,
    handleInputKeyDown,
    handleSendClick,
  };
};
