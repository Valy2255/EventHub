// src/context/ChatContext.jsx - Fixed typing and seen features + Online Presence
import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { connected, emitEvent, onEvent } = useSocket();

  // State management
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);

  // Feature states
  const [typingUsers, setTypingUsers] = useState({}); // { conversationId: 'sender_type' }
  const [onlineClients, setOnlineClients] = useState({}); // { conversationId: true|false }
  const [clientProfileForActiveChat, setClientProfileForActiveChat] =
    useState(null);
  const [adminProfileForActiveChat, setAdminProfileForActiveChat] =
    useState(null);

  // Refs to avoid stale closures
  const activeConvRef = useRef(activeConversation);
  const chatOpenRef = useRef(chatOpen);
  const messagesRef = useRef(messages);
  const userRef = useRef(user);

  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);
  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    async (conversationId) => {
      if (!conversationId || !userRef.current) return;

      try {
        const readerType =
          userRef.current.role === "admin" ? "admin" : "client";

        await api.post(`/chat/conversations/${conversationId}/read`, {
          reader_type: readerType,
        });

        // Emit to notify other party
        emitEvent("read_messages", { conversationId, readerType });

        // Update local state
        if (userRef.current.role === "admin") {
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
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    },
    [emitEvent]
  );

  // Fetch admin conversations
  const fetchAdminConversations = useCallback(async () => {
    if (!userRef.current || userRef.current.role !== "admin") return;

    try {
      const { data } = await api.get("/chat/conversations");
      const convs = (data.conversations || []).map((c) => ({
        ...c,
        unread_count: Number(c.unread_count) || 0,
        client_profile_image: c.client_profile_image,
      }));
      setConversations(convs);
      setUnreadCount(convs.reduce((sum, c) => sum + c.unread_count, 0));
    } catch (err) {
      setError("Failed to load conversations" + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      setLoading(true);
      fetchAdminConversations();
      const iv = setInterval(fetchAdminConversations, 30000);
      return () => clearInterval(iv);
    } else {
      setLoading(false);
    }
  }, [user, fetchAdminConversations]);

  // Auto-join admin rooms
  useEffect(() => {
    if (
      userRef.current?.role === "admin" &&
      connected &&
      conversations.length
    ) {
      conversations.forEach((c) => emitEvent("auto_subscribe", c.id));
    }
  }, [connected, conversations, emitEvent]);

  // Global presence listeners - NEW
  useEffect(() => {
    if (!connected) return;

    const handleClientOnline = ({ conversationId }) => {
      setOnlineClients(prev => ({ ...prev, [conversationId]: true }));
    };

    const handleClientOffline = ({ conversationId }) => {
      setOnlineClients(prev => ({ ...prev, [conversationId]: false }));
    };

    const off1 = onEvent("client_online", handleClientOnline);
    const off2 = onEvent("client_offline", handleClientOffline);

    return () => {
      off1();
      off2();
    };
  }, [connected, onEvent]);

  // Global new_message handler
  useEffect(() => {
    if (!connected || !userRef.current) return;

    const handleNewMessage = (m) => {
      const replacedTemp =
        m.tempId && messagesRef.current.some((x) => x.id === m.tempId);
      const isActive = activeConvRef.current === m.conversation_id;
      const isChatOpen = chatOpenRef.current;
      const otherParty = m.sender_type !== userRef.current.role;

      // Update conversations for admin
      if (userRef.current.role === "admin") {
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
        if (otherParty && (!isActive || !isChatOpen)) {
          setUnreadCount((n) => n + 1);
        }
      } else {
        if (otherParty && (!isChatOpen || !isActive)) {
          setUnreadCount((prev) => prev + 1);
        }
      }

      // Update messages if active conversation
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

      // Clear typing indicator for sender
      setTypingUsers((prev) => ({ ...prev, [m.conversation_id]: null }));
    };

    const off = onEvent("new_message", handleNewMessage);
    return off;
  }, [connected, onEvent, markMessagesAsRead]);

  // Per-conversation listeners
  useEffect(() => {
    if (!connected || !activeConversation) return;

    const historyHandler = ({ messages: hist, conversationId }) => {
      setMessages(hist || []);
      if (chatOpenRef.current && conversationId) {
        markMessagesAsRead(conversationId);
      }
    };

    const adminJoinedHandler = ({ admin_profile_image }) => {
      setAdminOnline(true);
      setAdminProfileForActiveChat(admin_profile_image);
    };

    const closedHandler = () => {
      if (userRef.current?.role !== "admin") {
        setActiveConversation(null);
        setChatOpen(false);
        setMessages([]);
      }
      setClientProfileForActiveChat(null);
      setAdminProfileForActiveChat(null);
    };

    // FIXED: Typing listeners
    const typingHandler = ({ conversationId: incomingConvId, senderType }) => {
      if (
        activeConvRef.current === incomingConvId &&
        senderType !== userRef.current?.role
      ) {
        setTypingUsers((prev) => ({ ...prev, [incomingConvId]: senderType }));
      }
    };

    const stopTypingHandler = ({
      conversationId: incomingConvId,
      senderType,
    }) => {
      if (
        activeConvRef.current === incomingConvId &&
        senderType !== userRef.current?.role
      ) {
        setTypingUsers((prev) => ({ ...prev, [incomingConvId]: null }));
      }
    };

    // FIXED: Read receipt listener
    const messagesReadHandler = ({ conversationId, readerType }) => {
    // Only update the convo we're viewing
    if (activeConvRef.current !== conversationId) return;

    setMessages((prev) =>
      prev.map((msg) => {
        // Skip the reader's own messages
        if (msg.sender_type === readerType) return msg;

        // Reader is ADMIN  → mark client messages as admin_read
        if (readerType === "admin" && !msg.admin_read) {
          return { ...msg, admin_read: true };
        }

        // Reader is CLIENT → mark admin messages as client_read
        if (readerType === "client" && !msg.client_read) {
          return { ...msg, client_read: true };
        }
        return msg;
      })
    );
  };

    const offHistory = onEvent("conversation_history", historyHandler);
    const offAdminJoined = onEvent("admin_joined", adminJoinedHandler);
    const offClosed = onEvent("conversation_closed", closedHandler);
    const offTyping = onEvent("typing", typingHandler);
    const offStopTyping = onEvent("stop_typing", stopTypingHandler);
    const offMessagesRead = onEvent("messages_read", messagesReadHandler);

    return () => {
      offHistory();
      offAdminJoined();
      offClosed();
      offTyping();
      offStopTyping();
      offMessagesRead();
      setAdminOnline(false);
      setAdminProfileForActiveChat(null);
      setTypingUsers((prev) => ({ ...prev, [activeConversation]: null }));
    };
  }, [connected, activeConversation, onEvent, markMessagesAsRead]);

  // Handle conversation_started
  useEffect(() => {
    if (!connected || !userRef.current) return;

    const handler = async ({
      conversationId,
      message,
      client_name,
      client_email,
      client_profile_image,
    }) => {
      if (userRef.current.role === "admin") {
        setConversations((prev) => {
          if (prev.some((c) => c.id === conversationId)) return prev;
          return [
            {
              id: conversationId,
              last_message:
                typeof message === "string" ? message : message.message,
              updated_at: message.created_at || new Date().toISOString(),
              unread_count: 1,
              client_name,
              client_email,
              client_profile_image,
            },
            ...prev,
          ];
        });
        setUnreadCount((n) => n + 1);
        emitEvent("join_conversation", conversationId);
      } else {
        setActiveConversation(conversationId);
        setMessages([
          typeof message === "string"
            ? {
                id: `temp-start-${Date.now()}`,
                message,
                sender_type: "client",
                created_at: new Date().toISOString(),
              }
            : message,
        ]);
        setClientProfileForActiveChat(userRef.current?.profile_image || null);
      }
    };

    const off = onEvent("conversation_started", handler);
    return off;
  }, [connected, emitEvent, onEvent]);

  // Fetch conversation data when switching
  useEffect(() => {
    if (!activeConversation || !userRef.current) {
      setMessages([]);
      setClientProfileForActiveChat(null);
      if (userRef.current?.role === "admin") setAdminProfileForActiveChat(null);
      return;
    }

    const fetchConversationData = async () => {
      try {
        const convDetailsRes = await api.get(
          `/chat/conversations/${activeConversation}`
        );
        const convData = convDetailsRes.data.conversation;
        if (convData) {
          setClientProfileForActiveChat(convData.client_profile_image);
        }

        const messagesRes = await api.get(
          `/chat/conversations/${activeConversation}/messages`
        );
        const msgs = messagesRes.data.messages || [];
        setMessages(msgs);

        if (userRef.current?.role === "admin") {
          markMessagesAsRead(activeConversation);
          setConversations((prev) => {
            const updated = prev.map((c) => {
              if (c.id !== activeConversation) return c;
              const last = msgs[msgs.length - 1];
              return {
                ...c,
                last_message: last ? last.message : c.last_message,
                updated_at: last ? last.created_at : c.updated_at,
                unread_count: 0,
                client_profile_image:
                  convData?.client_profile_image || c.client_profile_image,
              };
            });
            setUnreadCount(
              updated.reduce((s, c) => s + (c.unread_count || 0), 0)
            );
            return updated;
          });
        } else {
          if (chatOpenRef.current) markMessagesAsRead(activeConversation);
        }
      } catch (err) {
        console.error("Error fetching conversation data:", err);
      }
    };

    fetchConversationData();
  }, [activeConversation, markMessagesAsRead]);

  // Fetch client conversations
  useEffect(() => {
    if (!userRef.current || userRef.current.role === "admin" || !connected)
      return;

    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/chat/my-conversations");
        const convs = data.conversations || [];
        if (convs.length > 0 && convs[0].id) {
          setActiveConversation(convs[0].id);
          setClientProfileForActiveChat(
            convs[0].client_profile_image || userRef.current?.profile_image
          );
          if (chatOpenRef.current) {
            emitEvent("join_conversation", convs[0].id);
            markMessagesAsRead(convs[0].id);
          }
          const unreadData = await api.get("/chat/unread-count");
          setUnreadCount(unreadData.data.count || 0);
        } else {
          setActiveConversation(null);
          setUnreadCount(0);
        }
      } catch (err) {
        console.error("Failed to load client conversation info", err);
        setError("Failed to load chat info");
      } finally {
        setLoading(false);
      }
    })();
  }, [connected, markMessagesAsRead, emitEvent]);

  // Background unread count updater
  useEffect(() => {
    if (!userRef.current || !connected) return;

    const update = async () => {
      try {
        const { data } = await api.get("/chat/unread-count");
        setUnreadCount((prevCount) =>
          data.count !== undefined && data.count !== prevCount
            ? data.count
            : prevCount
        );
      } catch (err) {
        console.warn("Could not update total unread count:", err);
        if (userRef.current.role === "admin") {
          setUnreadCount(
            conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
          );
        }
      }
    };

    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [connected, conversations]);

  // Public actions
  const joinConversation = useCallback(
    (id) => {
      if (!connected || !id) return;

      if (
        userRef.current?.role !== "admin" &&
        activeConvRef.current &&
        activeConvRef.current !== id
      ) {
        emitEvent("leave_conversation", activeConvRef.current);
      }

      emitEvent("join_conversation", id);
      setActiveConversation(id);
    },
    [connected, emitEvent]
  );

  const startConversation = useCallback(
    (msg) => {
      if (!connected || !userRef.current || userRef.current.role === "admin")
        return;
      emitEvent("start_conversation", msg);
      setChatOpen(true);
    },
    [connected, emitEvent]
  );

  const sendMessage = useCallback(
    (content, tempId = null) => {
      if (!connected || !activeConvRef.current) return false;
      emitEvent("send_message", {
        conversationId: activeConvRef.current,
        content,
        tempId,
      });
      if (userRef.current) {
        emitEvent("stop_typing", { conversationId: activeConvRef.current });
      }
      return true;
    },
    [connected, emitEvent]
  );

  const closeConversation = useCallback(() => {
    if (
      !connected ||
      !activeConvRef.current ||
      userRef.current?.role !== "admin"
    )
      return;
    emitEvent("close_conversation", activeConvRef.current);
    setConversations((prev) =>
      prev.filter((c) => c.id !== activeConvRef.current)
    );
    if (activeConvRef.current === activeConversation) {
      setActiveConversation(null);
      setMessages([]);
      setClientProfileForActiveChat(null);
      setAdminProfileForActiveChat(null);
    }
  }, [connected, activeConversation, emitEvent]);

  const toggleChat = useCallback(() => {
    setChatOpen((prevOpen) => {
      const newOpenState = !prevOpen;
      if (newOpenState && activeConvRef.current && connected) {
        emitEvent("join_conversation", activeConvRef.current);
        markMessagesAsRead(activeConvRef.current);
      }
      return newOpenState;
    });
  }, [connected, emitEvent, markMessagesAsRead]);

  // FIXED: Typing notification functions
  const notifyTyping = useCallback(() => {
    if (!connected || !activeConvRef.current || !userRef.current) return;
    emitEvent("typing", { conversationId: activeConvRef.current });
  }, [connected, emitEvent]);

  const notifyStopTyping = useCallback(() => {
    if (!connected || !activeConvRef.current || !userRef.current) return;
    emitEvent("stop_typing", { conversationId: activeConvRef.current });
  }, [connected, emitEvent]);

  return (
    <ChatContext.Provider
      value={{
        user,
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
        typingUsers,
        onlineClients,
        clientProfileForActiveChat,
        adminProfileForActiveChat,
        notifyTyping,
        notifyStopTyping,
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