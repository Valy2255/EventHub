// src/pages/AdminChat.jsx - Compact Modern Design
import { useState, useEffect, useRef } from "react";
import {
  FaPaperPlane,
  FaSpinner,
  FaTimes,
  FaUserCircle,
  FaBars,
  FaExclamationTriangle,
  FaCheck,
  FaCheckDouble,
  FaCircle,
  FaSearch,
  FaHeadset,
  FaUser,
  FaComments,
  FaClock,
  FaUsers,
} from "react-icons/fa";
import { useChat } from "../../hooks/useChat";

const AdminChat = () => {
  const {
    user,
    connected,
    activeConversation,
    conversations,
    messages,
    setMessages,
    loading,
    joinConversation,
    sendMessage,
    closeConversation,
    markMessagesAsRead,
    typingUsers,
    notifyTyping,
    notifyStopTyping,
  } = useChat();

  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(true);
  const typingTimeoutRef = useRef(null);
  const lastMessagesLengthRef = useRef(0);
  const isScrollingRef = useRef(false);

  // Compact auto-scroll logic
  useEffect(() => {
    const container = messagesContainerRef.current;

    const shouldAutoScroll = () => {
      if (!activeConversation || !messages.length || !container) return false;
      if (hasScrolledToBottom) return true;

      if (messages.length > lastMessagesLengthRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        return distanceFromBottom < 100;
      }

      if (
        messages.length > lastMessagesLengthRef.current &&
        messages[messages.length - 1]?.sender_type === "client"
      ) {
        return true;
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
            if (activeConversation) markMessagesAsRead(activeConversation);
            setTimeout(() => {
              isScrollingRef.current = false;
            }, 300);
          }
        });
      });
    }

    lastMessagesLengthRef.current = messages.length;
  }, [messages, activeConversation, hasScrolledToBottom, markMessagesAsRead]);

  // Compact scroll tracking
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout;
    const handleScroll = () => {
      if (isScrollingRef.current) return;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const atBottom = scrollHeight - scrollTop - clientHeight < 50;
        setHasScrolledToBottom(atBottom);
        if (atBottom && activeConversation) {
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
  }, [activeConversation, markMessagesAsRead, messages]);

  // Auto-scroll when conversation changes
  useEffect(() => {
    if (activeConversation) {
      setHasScrolledToBottom(true);
      setTimeout(() => {
        isScrollingRef.current = true;
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 300);
        }
        markMessagesAsRead(activeConversation);
      }, 100);
    }
  }, [activeConversation, markMessagesAsRead]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (!connected || !activeConversation) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (value.trim()) {
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
    if (!inputValue.trim() || !connected || !activeConversation || !user)
      return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tempMessage = {
      id: tempId,
      conversation_id: activeConversation,
      sender_id: user.id,
      sender_type: "admin",
      message: inputValue,
      created_at: new Date().toISOString(),
      admin_read: true,
      client_read: false,
      status: "sending",
    };

    setMessages((prev) => [...prev, tempMessage]);
    sendMessage(inputValue, tempId);
    setInputValue("");

    setHasScrolledToBottom(true);
    setTimeout(() => {
      isScrollingRef.current = true;
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 300);
      }
    }, 50);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    notifyStopTyping();
  };

  const handleCloseConversation = () => {
    if (
      activeConversation &&
      window.confirm("Are you sure you want to close this conversation?")
    ) {
      closeConversation();
    }
  };

  // Filter and sort conversations
  const filteredConversations = (conversations || []).filter(
    (conv) =>
      conv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if ((b.unread_count || 0) !== (a.unread_count || 0))
      return (b.unread_count || 0) - (a.unread_count || 0);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const currentConversation = conversations?.find(
    (c) => c.id === activeConversation
  );
  const isClientTyping =
    activeConversation && typingUsers?.[activeConversation] === "client";
  const totalUnreadCount = sortedConversations.reduce(
    (sum, conv) => sum + (conv.unread_count || 0),
    0
  );

  const formatTime = (ts) =>
    ts
      ? new Date(ts).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const timeAgo = (ts) => {
    if (!ts) return "";
    const diffSeconds = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diffSeconds < 5) return "now";
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return new Date(ts).toLocaleDateString();
  };

  if (loading) {
    return (
      <div
        className="fixed inset-x-0 top-16 bottom-0 flex overflow-hidden bg-gradient-to-br from-purple-50 to-white antialiased"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <FaSpinner className="animate-spin text-white text-lg" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Loading Support Dashboard
          </h3>
          <p className="text-slate-600 text-sm">Setting up conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem-2rem)] bg-gradient-to-br from-purple-50 to-white antialiased">
      {/* Compact Sidebar */}
      <div
        className={`transition-all duration-300 ease-out ${
          sidebarOpen ? "w-72" : "w-0"
        } flex flex-col bg-white shadow-xl border-r border-purple-100 overflow-hidden`}
      >
        {/* Compact Header */}
        <div className="h-12 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FaHeadset className="text-white text-sm" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Support Center</h2>
              <p className="text-purple-200 text-xs">
                {sortedConversations.length} chats
                {totalUnreadCount > 0 && ` • ${totalUnreadCount} unread`}
              </p>
            </div>
          </div>
          <button
            className="xl:hidden text-purple-200 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Compact Search */}
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border-0 rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-xs placeholder-slate-500"
            />
          </div>
        </div>

        {/* Compact Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {sortedConversations.length === 0 ? (
            <div className="p-6 text-center h-full flex flex-col justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-purple-600 text-xl" />
              </div>
              <h3 className="font-bold text-base text-slate-800 mb-2">
                {searchTerm ? "No matches" : "No conversations"}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                {searchTerm
                  ? `No conversations match "${searchTerm}"`
                  : "Customer conversations will appear here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {sortedConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    joinConversation(conv.id);
                    if (window.innerWidth < 1280) setSidebarOpen(false);
                  }}
                  className={`w-full text-left p-3 hover:bg-purple-25 focus:outline-none focus:bg-purple-25 transition-all duration-200 ${
                    activeConversation === conv.id
                      ? "bg-gradient-to-r from-purple-50 to-purple-100 border-r-2 border-purple-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-shrink-0">
                      {conv.client_profile_image ? (
                        <img
                          src={conv.client_profile_image}
                          alt={conv.client_name}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-100"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                          <FaUser className="text-white text-sm" />
                        </div>
                      )}
                      {conv.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                          {conv.unread_count > 9 ? "9+" : conv.unread_count}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4
                          className={`font-bold text-sm truncate ${
                            activeConversation === conv.id
                              ? "text-purple-800"
                              : "text-slate-900"
                          }`}
                        >
                          {conv.client_name || "Anonymous"}
                        </h4>
                        <span className="text-xs text-slate-500 ml-2">
                          {timeAgo(conv.updated_at)}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate ${
                          conv.unread_count > 0
                            ? "text-slate-700 font-semibold"
                            : "text-slate-500"
                        }`}
                      >
                        {conv.last_message || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compact Main Chat Area */}
      <div className="flex flex-col flex-1 bg-white">
        {/* Compact Header */}
        <div className="h-12 border-b border-slate-100 bg-gradient-to-r from-white to-purple-50/50 shadow-sm flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <button
              className="xl:hidden text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg p-2 transition-all"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FaBars size={16} />
            </button>

            {activeConversation && currentConversation ? (
              <div className="flex items-center space-x-3">
                {currentConversation.client_profile_image ? (
                  <img
                    src={currentConversation.client_profile_image}
                    alt={currentConversation.client_name}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-purple-100"
                  />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                    <FaUser className="text-white text-sm" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {currentConversation.client_name || "Anonymous User"}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <FaCircle className="text-green-500 text-xs" />
                      <span className="text-green-600 font-semibold text-xs">
                        Online
                      </span>
                    </div>
                    {isClientTyping && (
                      <span className="text-purple-600 text-xs font-medium italic">
                        • typing...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                  <FaComments className="text-slate-400 text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-700">
                    Select a conversation
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Choose from sidebar to start
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {!connected && (
              <div className="flex items-center space-x-2 text-red-500 bg-red-50 px-3 py-1.5 rounded-lg font-semibold text-xs">
                <FaExclamationTriangle />
                <span>Disconnected</span>
              </div>
            )}

            {activeConversation && (
              <button
                onClick={handleCloseConversation}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 font-semibold px-4 py-2 rounded-lg transition-all flex items-center space-x-2 border border-red-200 text-xs"
              >
                <FaTimes />
                <span className="hidden sm:inline">Close</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-2 bg-gradient-to-b from-purple-25/30 to-white"
          style={{ scrollBehavior: "smooth" }}
        >
          {activeConversation ? (
            messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FaComments className="text-purple-600 text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    Ready to Help!
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Send a message to start helping this customer.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.sender_type === "admin";
                const isCustomer = msg.sender_type === "client";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end space-x-2 mb-2 ${
                      isAdmin ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Customer avatar */}
                    {isCustomer && (
                      <div className="flex-shrink-0 self-end">
                        {currentConversation?.client_profile_image ? (
                          <img
                            src={currentConversation.client_profile_image}
                            alt="Customer"
                            className="w-7 h-7 rounded-xl object-cover ring-1 ring-purple-100"
                          />
                        ) : (
                          <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                            <FaUser className="text-white text-xs" />
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`max-w-[70%] flex flex-col ${
                        isAdmin ? "items-end order-first" : "items-start"
                      }`}
                    >
                      {/* Compact sender label */}
                      <div
                        className={`text-xs font-bold mb-1 px-1 ${
                          isAdmin ? "text-purple-700" : "text-purple-600"
                        }`}
                      >
                        {isAdmin ? "You" : "Customer"}
                      </div>

                      {/* Compact message bubble */}
                      <div
                        className={`p-3 rounded-2xl shadow-sm max-w-full ${
                          isAdmin
                            ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-br-md"
                            : "bg-white text-slate-800 border border-purple-100 rounded-bl-md shadow-md"
                        } ${msg.status === "sending" ? "opacity-70" : ""}`}
                      >
                        <p className="text-sm leading-relaxed break-words">
                          {msg.message}
                        </p>
                        <div
                          className={`text-xs mt-2 flex items-center ${
                            isAdmin
                              ? "text-purple-200 justify-end"
                              : "text-slate-500 justify-start"
                          }`}
                        >
                          <span>{formatTime(msg.created_at)}</span>
                          {isAdmin && msg.status !== "sending" && (
                            <span className="ml-2">
                              {msg.client_read ? (
                                <FaCheckDouble
                                  className="text-green-300"
                                  title="Read"
                                />
                              ) : (
                                <FaCheck
                                  className="text-purple-300"
                                  title="Sent"
                                />
                              )}
                            </span>
                          )}
                          {isAdmin && msg.status === "sending" && (
                            <FaSpinner className="ml-2 animate-spin text-xs" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Admin avatar */}
                    {isAdmin && (
                      <div className="flex-shrink-0 self-end">
                        {user?.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt="You"
                            className="w-7 h-7 rounded-xl object-cover ring-1 ring-purple-200"
                          />
                        ) : (
                          <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
                            <FaHeadset className="text-white text-xs" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-lg">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FaUsers className="text-purple-600 text-3xl" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">
                  Welcome to Support Center
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Select a conversation from the sidebar to start helping
                  customers.
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Compact Input Area */}
        {activeConversation && (
          <div className="border-t border-slate-100 p-2 bg-gradient-to-r from-white to-purple-50/30">
            <form
              onSubmit={handleSendMessage}
              className="flex items-end space-x-3"
            >
              <div className="flex-1">
                <textarea
                  rows="1"
                  className="w-full max-h-32 resize-none border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm bg-white placeholder-slate-500"
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={handleInputChange}
                  disabled={!connected}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  style={{
                    height: "auto",
                    minHeight: "44px",
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
                className={`px-5 py-3 rounded-xl text-white font-bold transition-all flex items-center space-x-2 shadow-md hover:shadow-lg ${
                  connected && inputValue.trim()
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                    : "bg-slate-400 cursor-not-allowed"
                }`}
                disabled={!connected || !inputValue.trim()}
              >
                <FaPaperPlane className="text-sm" />
                <span className="hidden sm:inline text-sm">Send</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
