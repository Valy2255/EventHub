// src/hooks/useChat.js
import { useContext } from 'react';
import ChatContext from '../context/ChatContext';

export const useChat = () => {
  return useContext(ChatContext);
};