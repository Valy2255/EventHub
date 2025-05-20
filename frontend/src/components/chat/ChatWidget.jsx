import { useState, useEffect, useRef } from "react";
import {
  FaPaperPlane,
  FaSpinner,
  FaTimes,
  FaComments,
  FaUser,
} from "react-icons/fa";
import { useChat } from "../../hooks/useChat";

const ClientChatWidget = () => {
  const {
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
  } = useChat();

  const [inputValue, setInputValue] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(true);
  const messagesEndRef      = useRef(null);
  const messagesContainerRef= useRef(null);

  // scroll on new msg
  useEffect(() => {
    if (messages.length && hasScrolledToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, hasScrolledToBottom]);

  // track user scroll
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
      setHasScrolledToBottom(atBottom);
      if (atBottom && chatOpen && activeConversation) {
        markMessagesAsRead(activeConversation);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [chatOpen, activeConversation, markMessagesAsRead]);

  // mark read when opening
  useEffect(() => {
    if (chatOpen && activeConversation && messages.length) {
      markMessagesAsRead(activeConversation);
    }
  }, [chatOpen, activeConversation, messages.length, markMessagesAsRead]);

  const formatTime = ts => ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const handleStartChat = async e => {
    e.preventDefault();
    if (!initialMessage.trim() || !connected) return;
    setIsStartingChat(true);
    try {
      await startConversation(initialMessage);
      setInitialMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleSendMessage = e => {
    e.preventDefault();
    if (!inputValue.trim() || !connected) return;

    // if first msg
    if (messages.length === 0) {
      handleStartChat({ preventDefault: () => {} });
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      conversation_id: activeConversation,
      sender_type: "client",
      message: inputValue,
      created_at: new Date().toISOString(),
      status: "sending",
    };
    setMessages(prev => [...prev, tempMsg]);
    sendMessage(inputValue, tempId);
    setInputValue("");
    setHasScrolledToBottom(true);

    setTimeout(() => {
      setMessages(prev =>
        prev.map(m =>
          m.id === tempId && m.status === "sending"
            ? { ...m, status: "sent" }
            : m
        )
      );
    }, 2000);
  };

  return (
    <>
      {/* toggle button */}
      {!chatOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 bg-purple-600 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50"
        >
          <FaComments className="text-2xl text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* chat window */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-white rounded-lg shadow-xl z-50 flex flex-col">
          {/* header */}
          <div className="bg-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${adminOnline ? "bg-green-500" : "bg-yellow-500"}`}/>
              <h3 className="font-semibold">
                {adminOnline ? "Support Agent Online" : "Live Support Chat"}
              </h3>
            </div>
            <button onClick={() => setChatOpen(false)}>
              <FaTimes className="text-white"/>
            </button>
          </div>

          {/* messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center text-gray-500">
                <p className="text-center mb-2">Welcome to support!</p>
                <form onSubmit={handleStartChat}>
                  <textarea
                    rows="3"
                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Type your message…"
                    value={initialMessage}
                    onChange={e => setInitialMessage(e.target.value)}
                    disabled={!connected || isStartingChat}
                  />
                  <button
                    type="submit"
                    className="mt-2 w-full bg-purple-600 text-white py-2 rounded-lg flex justify-center"
                    disabled={!connected || isStartingChat || !initialMessage.trim()}
                  >
                    {isStartingChat ? <FaSpinner className="animate-spin"/> : <FaPaperPlane/>}
                  </button>
                </form>
              </div>
            ) : (
              <>
                {messages.map(msg => {
                  const isTemp = msg.status === "sending";
                  const key    = `${msg.id}-${msg.created_at}-${msg.sender_type}`;
                  return (
                    <div key={key} className={`flex mb-4 ${msg.sender_type==="client"?"justify-end":"justify-start"}`}>
                      {msg.sender_type==="admin" && (
                        <FaUser className="text-purple-600 mr-2 mt-1"/>
                      )}
                      <div className={`max-w-[70%] p-3 rounded-lg ${
                        msg.sender_type==="client"
                          ? `bg-purple-600 text-white rounded-br-none ${isTemp?"opacity-75 animate-pulse":""}`
                          : "bg-gray-100 text-gray-800 rounded-bl-none"
                      }`}>
                        {msg.message}
                        <div className="text-xs text-gray-400 mt-1 text-right">
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef}/>
                {!hasScrolledToBottom && (
                  <div className="sticky bottom-2 flex justify-center">
                    <button
                      className="bg-purple-600 text-white px-3 py-1 rounded-full"
                      onClick={() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                        setHasScrolledToBottom(true);
                        if (activeConversation) markMessagesAsRead(activeConversation);
                      }}
                    >
                      New messages ↓
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* input */}
          {messages.length > 0 && (
            <form onSubmit={handleSendMessage} className="border-t p-3 flex">
              <input
                className="flex-1 border rounded-l-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="Type a message…"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={!connected}
              />
              <button
                type="submit"
                className={`px-4 py-2 rounded-r-lg text-white ${
                  connected ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-400"
                }`}
                disabled={!connected || !inputValue.trim()}
              >
                <FaPaperPlane/>
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};

export default ClientChatWidget;
