// src/components/ChatWidget.jsx - Ultra Modern Design without New Messages Button
import React, { useState, useEffect, useRef } from "react";
import {
  FaPaperPlane,
  FaSpinner,
  FaTimes,
  FaComments,
  FaCheck,
  FaCheckDouble,
  FaHeadset,
  FaCircle,
  FaUser,
  FaRocket,
  FaClock,
} from "react-icons/fa";
import { useChat } from "../../hooks/useChat";

const ClientChatWidget = () => {
  const {
    user,
    connected,
    messages,
    setMessages,
    chatOpen,
    setChatOpen,
    adminOnline,
    startConversation,
    sendMessage,
    toggleChat,
    unreadCount,
    activeConversation,
    markMessagesAsRead,
    typingUsers,
    clientProfileForActiveChat,
    adminProfileForActiveChat,
    notifyTyping,
    notifyStopTyping,
    loading,
  } = useChat();

  const [inputValue, setInputValue] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isScrollingRef = useRef(false);
  const lastMessagesLengthRef = useRef(0);

  const isAdminTyping =
    activeConversation && typingUsers?.[activeConversation] === "admin";

  // PERFECT auto-scroll logic - triggers for ALL changes including typing
  useEffect(() => {
    const container = messagesContainerRef.current;

    const shouldAutoScroll = () => {
      if (!chatOpen || !container) return false;

      // Always scroll if user is at bottom
      if (hasScrolledToBottom) return true;

      // Auto-scroll for new messages
      if (messages.length > lastMessagesLengthRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        return distanceFromBottom < 100;
      }

      return false;
    };

    if (shouldAutoScroll() && !isScrollingRef.current) {
      isScrollingRef.current = true;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
              behavior: "smooth",
              block: "end",
              inline: "nearest",
            });

            setTimeout(() => {
              isScrollingRef.current = false;
            }, 500);
          }
        });
      });
    }

    lastMessagesLengthRef.current = messages.length;
  }, [messages, chatOpen, hasScrolledToBottom, isAdminTyping]); // Added isAdminTyping

  // Enhanced scroll tracking with better performance
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout;

    const handleScroll = () => {
      if (isScrollingRef.current) return;

      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const isAtBottom = distanceFromBottom < 30;

        setHasScrolledToBottom(isAtBottom);

        if (isAtBottom && chatOpen && activeConversation && unreadCount > 0) {
          markMessagesAsRead(activeConversation);
        }
      }, 100);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    setTimeout(handleScroll, 100);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [
    chatOpen,
    activeConversation,
    markMessagesAsRead,
    unreadCount,
    messages.length,
  ]);

  // Force scroll when chat opens or conversation changes
  useEffect(() => {
    if (chatOpen && activeConversation) {
      setTimeout(() => {
        setHasScrolledToBottom(true);
        isScrollingRef.current = true;
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 500);
        }
        if (messages.length > 0 && unreadCount > 0) {
          markMessagesAsRead(activeConversation);
        }
      }, 200);
    }
  }, [
    chatOpen,
    activeConversation,
    messages.length,
    unreadCount,
    markMessagesAsRead,
  ]);

  // Mark as read when chat opens with messages
  useEffect(() => {
    if (
      chatOpen &&
      activeConversation &&
      messages.length > 0 &&
      unreadCount > 0
    ) {
      setTimeout(() => markMessagesAsRead(activeConversation), 300);
    }
  }, [
    chatOpen,
    activeConversation,
    messages.length,
    markMessagesAsRead,
    unreadCount,
  ]);

  // Auto-scroll when typing indicator changes
  useEffect(() => {
    if (isAdminTyping && hasScrolledToBottom && !isScrollingRef.current) {
      setTimeout(() => {
        isScrollingRef.current = true;
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 500);
        }
      }, 100);
    }
  }, [isAdminTyping, hasScrolledToBottom]);

  const formatTime = (ts) => {
  if (!ts) return "";
  const date = new Date(ts);              // the ISO string from your backend
  return date.toLocaleTimeString([], {
    hour:   "numeric",   // 1-12  (no leading zero)
    minute: "2-digit",   // 00-59
    hour12: true,        // AM / PM
  });
};

  const handleStartChat = async (e) => {
    e.preventDefault();
    if (!initialMessage.trim() || !connected) return;
    setIsStartingChat(true);
    try {
      await startConversation(initialMessage);
      setInitialMessage("");
    } catch (err) {
      console.error("Error starting chat:", err);
    } finally {
      setIsStartingChat(false);
    }
  };

  // Enhanced typing indicator logic
  const handleInputChange = (e) => {
    const currentValue = e.target.value;
    setInputValue(currentValue);

    if (!connected || !activeConversation) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (currentValue.trim()) {
      notifyTyping();

      typingTimeoutRef.current = setTimeout(() => {
        notifyStopTyping();
        typingTimeoutRef.current = null;
      }, 1500);
    } else {
      notifyStopTyping();
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !connected) return;

    if (!activeConversation) {
      console.warn("No active conversation to send message to.");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      conversation_id: activeConversation,
      sender_type: user?.role || "client",
      sender_id: user?.id,
      message: inputValue,
      created_at: new Date().toISOString(),
      status: "sending",
      admin_read: user?.role === "admin",
      client_read: user?.role === "client",
    };

    setMessages((prev) => [...prev, tempMsg]);
    sendMessage(inputValue, tempId);
    setInputValue("");

    // Force scroll to bottom after sending
    setHasScrolledToBottom(true);
    setTimeout(() => {
      isScrollingRef.current = true;
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 500);
      }
    }, 50);

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    notifyStopTyping();
  };

  return (
    <>
      {/* Ultra Modern Floating Toggle Button */}
      {!chatOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={toggleChat}
            className="group relative bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white w-18 h-18 rounded-3xl shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 hover:rotate-3"
          >
            <FaComments className="text-2xl group-hover:scale-110 transition-transform" />

            {/* Pulsing Ring Animation */}
            <div className="absolute inset-0 rounded-3xl bg-purple-600 opacity-20 animate-ping"></div>

            {/* Ultra Modern Unread Badge */}
            {unreadCount > 0 && (
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-black rounded-2xl h-7 w-7 flex items-center justify-center border-3 border-white shadow-xl animate-bounce">
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}

            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600 to-purple-800 opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
          </button>
        </div>
      )}

      {/* Ultra Modern Chat Window */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-full max-w-md h-[calc(100vh-6rem)] sm:h-[650px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col border border-purple-100 overflow-hidden backdrop-blur-sm">
          {/* Premium Header with Advanced Gradient */}
          <div className="h-24 bg-gradient-to-r from-purple-600 via-purple-800 to-purple-900 text-white p-6 flex justify-between items-center shadow-2xl relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent animate-pulse"></div>

            <div className="flex items-center space-x-4 relative z-10">
              <div className="relative">
                {/* Online indicator with advanced styling */}
                <div
                  className={`w-4 h-4 rounded-full ${
                    adminOnline ? "bg-green-400" : "bg-yellow-400"
                  } shadow-lg relative`}
                >
                  {adminOnline && (
                    <>
                      <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-400 animate-ping opacity-75"></div>
                      <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-400 animate-pulse"></div>
                    </>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-black text-xl flex items-center space-x-2">
                  <FaHeadset className="text-purple-200" />
                  <span className="bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                    {adminOnline ? "Support Agent" : "Live Support"}
                  </span>
                </h3>
                <p className="text-purple-200 text-sm font-bold flex items-center space-x-1">
                  {adminOnline ? (
                    <>
                      <FaCircle className="text-green-400 text-xs animate-pulse" />
                      <span>Online • Ready to help you</span>
                    </>
                  ) : (
                    <>
                      <FaClock className="text-yellow-400 text-xs" />
                      <span>We'll be right with you</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-purple-200 hover:text-white transition-colors hover:bg-white/20 rounded-2xl p-3 relative z-10"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Ultra Modern Messages Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-purple-50/30 via-white to-purple-25/20"
            style={{ scrollBehavior: "smooth" }}
          >
            {loading && messages.length === 0 && !activeConversation && (
              <div className="flex justify-center items-center h-full">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-purple-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <FaSpinner className="animate-spin text-white text-2xl" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">
                    Connecting to Support
                  </h4>
                  <p className="text-slate-600 font-medium">
                    Setting up your conversation...
                  </p>
                </div>
              </div>
            )}

            {!loading && !activeConversation && messages.length === 0 && (
              <div className="h-full flex flex-col justify-center items-center text-center p-8">
                <div className="w-28 h-28 bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300 rounded-3xl flex items-center justify-center mb-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent animate-pulse"></div>
                  <FaRocket className="text-5xl text-purple-600 relative z-10" />
                </div>
                <h4 className="text-2xl font-black text-slate-800 mb-4">
                  Welcome to Premium Support!
                </h4>
                <p className="text-slate-600 mb-8 leading-relaxed font-medium max-w-sm">
                  Our expert team is here to help you succeed. Send us a message
                  and we'll get back to you instantly.
                </p>

                <form onSubmit={handleStartChat} className="w-full space-y-6">
                  <textarea
                    rows="4"
                    className="w-full border-2 border-purple-200 p-6 rounded-3xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-lg resize-none bg-gradient-to-br from-white to-purple-50/30 font-medium placeholder-slate-500"
                    placeholder="How can we help you achieve your goals today?"
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    disabled={!connected || isStartingChat}
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white py-5 rounded-3xl flex items-center justify-center font-black text-lg transition-all disabled:opacity-50 shadow-2xl hover:shadow-3xl transform hover:scale-105 relative overflow-hidden"
                    disabled={
                      !connected || isStartingChat || !initialMessage.trim()
                    }
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                    {isStartingChat ? (
                      <>
                        <FaSpinner className="animate-spin mr-3" />
                        <span>Starting conversation...</span>
                      </>
                    ) : (
                      <>
                        <FaRocket className="mr-3" />
                        <span>Start Premium Support</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Ultra Modern Messages with Perfect Design */}
            {activeConversation &&
              messages.map((msg) => {
                const isCustomer =
                  msg.sender_type === "client" ||
                  msg.sender_type === user?.role;
                const isSupport = msg.sender_type === "admin";
                const key =
                  msg.id || `temp-${msg.created_at}-${msg.sender_type}`;

                return (
                  <div
                    key={key}
                    className={`flex items-end space-x-4 ${
                      isCustomer ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Support messages: Avatar on left */}
                    {isSupport && (
                      <div className="flex-shrink-0 self-end">
                        {adminProfileForActiveChat ? (
                          <img
                            src={adminProfileForActiveChat}
                            alt="Support Agent"
                            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-purple-100"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center ring-2 ring-purple-100">
                            <FaHeadset className="text-white text-sm" />
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] flex flex-col ${
                        isCustomer ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Premium Sender Label */}
                      <div
                        className={`text-sm font-black mb-2 px-2 ${
                          isSupport ? "text-purple-700" : "text-purple-600"
                        }`}
                      >
                        {isSupport ? "Support Agent" : "You"}
                      </div>

                      {/* Ultra Modern Message Bubble */}
                      <div
                        className={`p-6 rounded-3xl shadow-lg max-w-full relative overflow-hidden ${
                          isCustomer
                            ? `bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white rounded-br-xl ${
                                msg.status === "sending" ? "opacity-80" : ""
                              }`
                            : "bg-gradient-to-br from-white to-purple-50/50 text-slate-800 border-2 border-purple-100 rounded-bl-xl shadow-xl"
                        }`}
                      >
                        {/* Subtle background pattern for customer messages */}
                        {isCustomer && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse"></div>
                        )}

                        <p className="text-sm leading-relaxed break-words font-medium relative z-10">
                          {msg.message}
                        </p>

                        <div
                          className={`text-xs mt-4 flex items-center ${
                            isCustomer
                              ? "text-purple-200 justify-end"
                              : "text-slate-500 justify-start"
                          } relative z-10`}
                        >
                          <div className="flex items-center space-x-1">
                            <FaClock className="text-xs" />
                            <span className="font-semibold">
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                          {isCustomer && msg.status !== "sending" && (
                            <span className="ml-3">
                              {msg.admin_read ? (
                                <FaCheckDouble
                                  className="text-green-300"
                                  title="Read by support"
                                />
                              ) : (
                                <FaCheck
                                  className="text-purple-300"
                                  title="Sent"
                                />
                              )}
                            </span>
                          )}
                          {isCustomer && msg.status === "sending" && (
                            <FaSpinner className="ml-3 animate-spin text-purple-300" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Customer messages: Avatar on right */}
                    {isCustomer && (
                      <div className="flex-shrink-0 self-end">
                        {clientProfileForActiveChat ? (
                          <img
                            src={clientProfileForActiveChat}
                            alt="You"
                            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-purple-200"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center ring-2 ring-purple-200">
                            <FaUser className="text-white text-sm" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Ultra Modern Typing Indicator */}
            {isAdminTyping && (
              <div className="flex items-end space-x-4 justify-start">
                <div className="flex-shrink-0">
                  {adminProfileForActiveChat ? (
                    <img
                      src={adminProfileForActiveChat}
                      alt="Support Agent"
                      className="w-10 h-10 rounded-2xl object-cover ring-2 ring-purple-100"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center ring-2 ring-purple-100">
                      <FaHeadset className="text-white text-sm" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <div className="text-sm font-black mb-2 px-2 text-purple-700">
                    Support Agent
                  </div>
                  <div className="bg-gradient-to-br from-white to-purple-50/50 border-2 border-purple-100 rounded-3xl rounded-bl-xl px-6 py-4 flex items-center space-x-3 shadow-xl">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce shadow-sm"></div>
                      <div
                        className="w-3 h-3 bg-purple-500 rounded-full animate-bounce shadow-sm"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-3 h-3 bg-purple-500 rounded-full animate-bounce shadow-sm"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-slate-600 text-sm italic font-semibold">
                      typing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Premium Input Area */}
          {activeConversation && (
            <div className="border-t border-purple-100 p-6 bg-gradient-to-r from-white via-purple-50/30 to-white">
              <form
                onSubmit={handleSendMessage}
                className="flex items-end space-x-4"
              >
                <div className="flex-1">
                  <textarea
                    rows="1"
                    className="w-full max-h-32 resize-none border-2 border-purple-200 rounded-3xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm bg-gradient-to-br from-white to-purple-50/30 font-medium placeholder-slate-500 shadow-lg"
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={handleInputChange}
                    disabled={!connected || !activeConversation}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    style={{
                      height: "auto",
                      minHeight: "56px",
                    }}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 128) + "px";
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className={`px-6 py-4 rounded-3xl text-white transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    connected && inputValue.trim()
                      ? "bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900"
                      : "bg-slate-400 cursor-not-allowed"
                  }`}
                  disabled={
                    !connected || !inputValue.trim() || !activeConversation
                  }
                >
                  <FaPaperPlane className="text-lg" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ClientChatWidget;