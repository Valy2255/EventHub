// src/context/ChatContext.jsx
import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { connected, emitEvent, onEvent } = useSocket();

  // ─── state ──────────────────────────────────────────────────────────
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);

  // ─── live refs to avoid stale-closure bugs ──────────────────────────
  const activeConvRef = useRef(activeConversation);
  const chatOpenRef = useRef(chatOpen);
  const messagesRef = useRef(messages);

  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);
  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ─── mark as read & clear badge ──────────────────────────────────────
  const markMessagesAsRead = useCallback(
    async (conversationId) => {
      if (!conversationId || !user) return;
      try {
        await api.post(`/chat/conversations/${conversationId}/read`, {
          reader_type: user.role === "admin" ? "admin" : "client",
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
      if (user.role === "admin") {
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c
          );
          setUnreadCount(
            updated.reduce((sum, c) => sum + (c.unread_count || 0), 0)
          );
          return updated;
        });
      } else {
        setUnreadCount(0);
      }
    },
    [user]
  );

  // ─── initial + periodic fetch of admin conversations ───────────────
  const fetchAdminConversations = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    try {
      const { data } = await api.get("/chat/conversations");
      const convs = (data.conversations || []).map((c) => ({
        ...c,
        unread_count: Number(c.unread_count) || 0,
      }));
      setConversations(convs);
      setUnreadCount(convs.reduce((sum, c) => sum + c.unread_count, 0));
    } catch {
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAdminConversations();
      const iv = setInterval(fetchAdminConversations, 30000);
      return () => clearInterval(iv);
    }
  }, [user, fetchAdminConversations]);

  // ─── auto-join all admin rooms for real-time events everywhere ──────
  useEffect(() => {
    if (user?.role === "admin" && connected && conversations.length) {
      conversations.forEach((c) => emitEvent("join_conversation", c.id));
    }
  }, [user, connected, conversations, emitEvent]);

  // Global new_message handler
  useEffect(() => {
    if (!connected || !user) return;

    const handleNewMessage = (m) => {
      const replacedTemp =
        m.tempId && messagesRef.current.some((x) => x.id === m.tempId);
      const isActive = activeConvRef.current === m.conversation_id;
      const isChatOpen = chatOpenRef.current;
      const otherParty = m.sender_type !== user.role;

      // Admin side conversation updates
      if (user.role === "admin") {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === m.conversation_id
              ? {
                  ...c,
                  last_message: m.message,
                  updated_at: m.created_at,
                  unread_count:
                    isActive && isChatOpen
                      ? 0
                      : (c.unread_count || 0) + (otherParty ? 1 : 0),
                }
              : c
          )
        );

        // Update global admin badge
        if (otherParty && (!isActive || !isChatOpen)) {
          setUnreadCount((n) => n + 1);
        }
      }
      // Client side unread count
      else {
        // Increment client unread count ONLY if:
        // 1. Message is from admin (otherParty) AND
        // 2. Either chat is closed OR different conversation is active
        if (otherParty && (!isChatOpen || !isActive)) {
          setUnreadCount((prev) => prev + 1);
        }
      }

      // Update message panel if active
      if (isActive) {
        setMessages((prev) =>
          replacedTemp
            ? prev.map((x) =>
                x.id === m.tempId ? { ...m, status: "sent" } : x
              )
            : prev.some((x) => x.id === m.id)
            ? prev
            : [...prev, m]
        );

        if (isChatOpen && otherParty) {
          markMessagesAsRead(m.conversation_id);
        }
      }
    };

    const off = onEvent("new_message", handleNewMessage);
    return off;
  }, [connected, user, onEvent, markMessagesAsRead]);

  // Per-conversation listeners
  useEffect(() => {
    if (!connected || !activeConversation) return;

    const historyHandler = ({ messages: hist, conversationId }) => {
      setMessages(hist || []);
      if (chatOpen && conversationId) {
        markMessagesAsRead(conversationId);
      }
    };
    const adminJoinedHandler = () => setAdminOnline(true);
    const closedHandler = () => {
      if (user?.role !== "admin") {
        setActiveConversation(null);
        setChatOpen(false);
        setMessages([]);
      }
    };

    const off1 = onEvent("conversation_history", historyHandler);
    const off2 = onEvent("admin_joined", adminJoinedHandler);
    const off3 = onEvent("conversation_closed", closedHandler);

    return () => {
      off1();
      off2();
      off3();
      setAdminOnline(false);
    };
  }, [
    connected,
    activeConversation,
    chatOpen,
    user,
    onEvent,
    markMessagesAsRead,
  ]);

  // conversation_started
  useEffect(() => {
    if (!connected) return;
    const handler = ({ conversationId, message }) => {
      setActiveConversation(conversationId);
      setMessages([message]);
    };
    const off = onEvent("conversation_started", handler);
    return off;
  }, [connected, onEvent]);

  // ─── **new**: HTTP-fetch full history immediately on convo switch
  useEffect(() => {
    if (!activeConversation) return;
    api
      .get(`/chat/conversations/${activeConversation}/messages`)
      .then((res) => {
        const msgs = res.data.messages || [];
        setMessages(msgs);

        // clear unread / update sidebar entry right away
        setConversations((prev) => {
          const updated = prev.map((c) => {
            if (c.id !== activeConversation) return c;
            const last = msgs[msgs.length - 1];
            return {
              ...c,
              last_message: last ? last.message : c.last_message,
              updated_at: last ? last.created_at : c.updated_at,
              unread_count: 0,
            };
          });
          setUnreadCount(
            updated.reduce((s, c) => s + (c.unread_count || 0), 0)
          );
          return updated;
        });
      })
      .catch(console.error);
  }, [activeConversation]);

  // ─── fetch client conversation & unread ──────────────────────────────
  useEffect(() => {
    if (!user || user.role === "admin" || !connected) return;
    (async () => {
      try {
        const { data } = await api.get("/chat/my-conversations");
        const convs = data.conversations || [];
        if (convs.length) {
          setActiveConversation(convs[0].id);
          if (chatOpen) {
            emitEvent("join_conversation", convs[0].id);
            const { data: u } = await api.get(
              `/chat/conversations/${convs[0].id}/unread`
            );
            setUnreadCount(u.count || 0);
          }
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [user, connected, chatOpen, emitEvent]);

  // ─── background unread-count updater ─────────────────────────────────
  useEffect(() => {
    if (!user || !connected) return;
    const update = async () => {
      try {
        const { data } = await api.get("/chat/unread-count");
        setUnreadCount(data.count ?? unreadCount);
      } catch {
        if (user.role === "admin") {
          setUnreadCount(
            conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
          );
        }
      }
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [user, connected, conversations, unreadCount]);

  // ─── public actions ──────────────────────────────────────────────────
  const joinConversation = useCallback(
    (id) => {
      if (!connected) return;
      emitEvent("join_conversation", id);
      setActiveConversation(id);
      markMessagesAsRead(id);
    },
    [connected, emitEvent, markMessagesAsRead]
  );

  const startConversation = useCallback(
    (msg) => {
      if (!connected) return;
      emitEvent("start_conversation", msg);
      setChatOpen(true);
    },
    [connected, emitEvent]
  );

  const sendMessage = useCallback(
    (content, tempId = null) => {
      if (!connected || !activeConversation) return false;
      emitEvent("send_message", {
        conversationId: activeConversation,
        content,
        tempId,
      });
      return true;
    },
    [connected, activeConversation, emitEvent]
  );

  const closeConversation = useCallback(() => {
    if (!connected || !activeConversation || user?.role !== "admin") return;
    emitEvent("close_conversation", activeConversation);
    setConversations((prev) => prev.filter((c) => c.id !== activeConversation));
    setActiveConversation(null);
    setMessages([]);
  }, [connected, activeConversation, user, emitEvent]);

  const toggleChat = useCallback(() => {
    setChatOpen((prev) => {
      if (!prev && activeConversation && connected) {
        emitEvent("join_conversation", activeConversation);
        markMessagesAsRead(activeConversation);
      }
      return !prev;
    });
  }, [activeConversation, connected, emitEvent, markMessagesAsRead]);

  return (
    <ChatContext.Provider
      value={{
        connected,
        activeConversation,
        conversations,
        messages,
        setMessages,
        unreadCount,
        loading,
        error,
        chatOpen,
        adminOnline,
        joinConversation,
        startConversation,
        sendMessage,
        closeConversation,
        toggleChat,
        setChatOpen,
        markMessagesAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
