import { useState, useEffect } from 'react';

/**
 * useSmartReplies
 * Simulates a client-side proxy to an AI backend (like OpenAI or Gemini) 
 * generating context-aware quick replies based on the conversation history.
 */
export function useSmartReplies(messages, currentUserId) {
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!messages || messages.length === 0) {
      setSuggestions([]);
      return;
    }

    const lastMessage = messages[messages.length - 1];
    
    // We only trigger suggestions if the LAST message was sent by someone else
    if (!lastMessage || lastMessage?.sender?._id === currentUserId) {
      setSuggestions([]);
      return;
    }

    // Clear existing and show glowing loading state
    setIsGenerating(true);
    setSuggestions([]);

    // Simulate AI inference API response time (1.2 seconds)
    const timer = setTimeout(() => {
      const content = lastMessage?.content?.toLowerCase() || "";
      
      // Default fallback
      let replies = ["Thanks!", "Sounds good.", "Okay."];
      
      // Extremely basic local "inference" pattern matching for portfolio demo
      if (content.includes("how are you")) {
        replies = ["I'm doing well, thanks!", "Great! How about you?", "Can't complain!"];
      } else if (content.includes("what time") || content.includes("when")) {
        replies = ["How about 5 PM?", "I'm free anytime after 2.", "Let me check my calendar."];
      } else if (content.includes("?") && (content.startsWith("do ") || content.startsWith("are ") || content.startsWith("can "))) {
        replies = ["Yes, absolutely.", "No, sorry.", "I'll let you know soon."];
      } else if (content.includes("sorry")) {
        replies = ["No worries at all!", "It happens!", "All good!"];
      } else if (content.includes("bye") || content.includes("see you")) {
        replies = ["Catch you later!", "Bye! 👋", "Have a great day!"];
      } else if (content.includes("thank")) {
         replies = ["You're welcome!", "Anytime!", "No problem!"];
      } else if (content.length > 50) {
         replies = ["That makes a lot of sense.", "I completely agree.", "Interesting, tell me more."];
      } else if (content.includes("!")) {
         replies = ["Awesome! 🎉", "Love that!", "So cool!"]
      }

      setSuggestions(replies);
      setIsGenerating(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [messages, currentUserId]);

  const clearSuggestions = () => setSuggestions([]);

  return { suggestions, isGenerating, clearSuggestions };
}
