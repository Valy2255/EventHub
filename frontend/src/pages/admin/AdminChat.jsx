// src/pages/AdminChat.jsx
import { useState, useEffect, useRef } from "react";
import {
  FaPaperPlane,
  FaSpinner,
  FaTimes,
  FaUser,
  FaBars,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useChat } from "../../hooks/useChat";

const AdminChat = () => {
  const {
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
  } = useChat();

  const [inputValue, setInputValue] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(true);

  /* ---------- scroll handling ---------- */
  useEffect(() => {
    if (messages.length && messagesEndRef.current && hasScrolledToBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, hasScrolledToBottom]);

  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 20;
      setHasScrolledToBottom(atBottom);
      if (atBottom && activeConversation) markMessagesAsRead(activeConversation);
    };
    const el = messagesContainerRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [activeConversation, markMessagesAsRead]);

  /* ---------- mark read on change ---------- */
  useEffect(() => {
    if (activeConversation && messages.length && hasScrolledToBottom) {
      markMessagesAsRead(activeConversation);
    }
  }, [activeConversation, messages.length, hasScrolledToBottom, markMessagesAsRead]);

  /* ---------- send message ---------- */
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !connected || !activeConversation) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const tempMessage = {
      id: tempId,
      conversation_id: activeConversation,
      sender_id: 0,
      sender_type: "admin",
      message: inputValue,
      created_at: new Date().toISOString(),
      admin_read: true,
      client_read: false,
      status: "sending",
    };

    setMessages((prev) => [...prev, tempMessage]);          // <-- fixed spread

    sendMessage(inputValue, tempId);
    setInputValue("");
    setHasScrolledToBottom(true);

    /* fallback status updater */
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId && m.status === "sending" ? { ...m, status: "sent" } : m
        )
      );
    }, 2000);
  };

  /* ---------- helpers ---------- */
  const formatTime = (ts) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const formatDate = (ts) => (ts ? new Date(ts).toLocaleDateString() : "");

  const timeAgo = (ts) => {
    if (!ts) return "";
    const diffMinutes = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatDate(ts);
  };

  const handleCloseConversation = () => {
    if (
      window.confirm("Are you sure you want to close this conversation? This cannot be undone.")
    ) {
      closeConversation();
      const next = conversations.find((c) => c.id !== activeConversation);
      if (next) joinConversation(next.id);
    }
  };

  const sortedConversations = [...conversations].sort((a, b) => {
    if (b.unread_count !== a.unread_count) return b.unread_count - a.unread_count;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <FaSpinner className="animate-spin text-purple-600 text-4xl" />
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-6">Live Support Chat</h1>

      {/* connection banner */}
      <div
        className={`mb-4 px-4 py-2 rounded-lg flex items-center ${
          connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        <div
          className={`h-3 w-3 rounded-full mr-2 ${
            connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span>
          {connected ? "Connected to chat server" : "Disconnected from chat server"}
        </span>
        {!connected && <FaExclamationTriangle className="ml-2" />}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex flex-col md:flex-row h-[75vh]">
          {/* ---- sidebar ---- */}
          <div
            className={`${
              sidebarVisible ? "block" : "hidden"
            } md:block w-full md:w-80 lg:w-96 border-r border-gray-200 overflow-y-auto flex-shrink-0 h-full`}
          >
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-lg">Active Conversations</h2>
              <p className="text-sm text-gray-500">
                {conversations.length}{" "}
                {conversations.length === 1 ? "conversation" : "conversations"}
              </p>
            </div>

            {sortedConversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No active conversations</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sortedConversations.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      activeConversation === c.id
                        ? "bg-purple-50 border-l-4 border-purple-600"
                        : c.unread_count
                        ? "bg-purple-50 border-l-4 border-purple-300"
                        : ""
                    }`}
                    onClick={() => joinConversation(c.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div className="bg-purple-100 h-10 w-10 rounded-full flex items-center justify-center">
                          <FaUser className="text-purple-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium truncate ${
                            c.unread_count ? "text-purple-800" : "text-gray-900"
                          }`}
                        >
                          {c.client_name || "Unknown Client"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {c.last_message || "No messages yet"}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-400">{timeAgo(c.updated_at)}</span>
                          {c.unread_count > 0 && (
                            <span className="ml-2 bg-purple-600 text-white text-xs font-medium rounded-full px-2 py-0.5">
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---- chat area ---- */}
          <div className="flex-grow flex flex-col">
            {activeConversation ? (
              <>
                {/* header */}
                <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <button
                      className="md:hidden mr-2 text-gray-600"
                      onClick={() => setSidebarVisible(!sidebarVisible)}
                      type="button"
                    >
                      {sidebarVisible ? <FaTimes /> : <FaBars />}
                    </button>
                    <div>
                      <h3 className="font-semibold">
                        {conversations.find((c) => c.id === activeConversation)?.client_name ||
                          "Client"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {conversations.find((c) => c.id === activeConversation)?.client_email ||
                          ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseConversation}
                    className="text-red-500 hover:text-red-700 flex items-center"
                    type="button"
                  >
                    <FaTimes className="mr-1" />
                    Close Chat
                  </button>
                </div>

                {/* messages */}
                <div
                  className="flex-1 p-4 overflow-y-auto"
                  ref={messagesContainerRef}
                >
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <span>No messages yet</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((m) => {
                        const isTemp = m.status === "sending";
                        const hasError = m.status === "error";
                        const key = `${m.id}-${m.created_at}-${m.sender_type}`;
                        return (
                          <div key={key}>
                            <div
                              className={`flex ${
                                m.sender_type === "admin"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              {m.sender_type === "client" && (
                                <div className="flex-shrink-0 mr-3">
                                  <div className="bg-purple-100 h-8 w-8 rounded-full flex items-center justify-center">
                                    <FaUser className="text-purple-600 text-sm" />
                                  </div>
                                </div>
                              )}

                              <div
                                className={`max-w-[75%] rounded-lg p-3 ${
                                  m.sender_type === "admin"
                                    ? `bg-purple-600 text-white rounded-br-none ${
                                        isTemp ? "opacity-80" : ""
                                      }`
                                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                                }`}
                              >
                                <div className="flex items-center mb-1">
                                  <span className="text-xs font-semibold">
                                    {m.sender_type === "admin" ? "You (Admin)" : "Client"}
                                  </span>
                                  {isTemp && (
                                    <span className="ml-2 text-xs opacity-75 animate-pulse">
                                      Sending…
                                    </span>
                                  )}
                                  {hasError && (
                                    <span className="ml-2 text-xs text-red-300">
                                      Failed
                                    </span>
                                  )}
                                </div>
                                <p>{m.message}</p>
                                <p
                                  className={`text-xs mt-1 flex justify-between ${
                                    m.sender_type === "admin"
                                      ? "text-purple-200"
                                      : "text-gray-500"
                                  }`}
                                >
                                  <span>{formatTime(m.created_at)}</span>

                                  {hasError && (
                                    <button
                                      onClick={() => {
                                        setMessages((prev) =>
                                          prev.filter((x) => x.id !== m.id)
                                        );
                                        const retryId = `retry-${Date.now()}`;
                                        const retryMsg = {
                                          ...m,
                                          id: retryId,
                                          status: "sending",
                                          created_at: new Date().toISOString(),
                                        };
                                        setMessages((prev) => [...prev, retryMsg]);
                                        sendMessage(m.message, retryId);
                                      }}
                                      className="underline hover:no-underline"
                                      type="button"
                                    >
                                      Retry
                                    </button>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />

                      {!hasScrolledToBottom && (
                        <div className="sticky bottom-2 flex justify-center">
                          <button
                            className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm shadow-lg"
                            onClick={() => {
                              messagesEndRef.current?.scrollIntoView({
                                behavior: "smooth",
                              });
                              setHasScrolledToBottom(true);
                              if (activeConversation) markMessagesAsRead(activeConversation);
                            }}
                            type="button"
                          >
                            New messages ↓
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* input */}
                <div className="border-t border-gray-200 p-4">
                  <form onSubmit={handleSendMessage} className="flex items-center">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Type your message…"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={!connected}
                    />
                    <button
                      type="submit"
                      className={`${
                        connected
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-gray-400 cursor-not-allowed"
                      } text-white px-4 py-2 rounded-r-lg`}
                      disabled={!connected || !inputValue.trim()}
                    >
                      <FaPaperPlane />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 p-4 text-center">
                <div>
                  <p className="mb-4">Select a conversation from the sidebar to start chatting</p>
                  {conversations.length === 0 && (
                    <p className="text-sm">
                      There are no active conversations right now. When a client starts one,
                      it will appear here.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
