import { create } from 'zustand';

export type SanadState = 'idle' | 'walk' | 'point' | 'think' | 'wave' | 'celebrate' | 'alert' | 'hidden';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isQuickReply?: boolean;
}

interface SanadStore {
  // UI State
  isOpen: boolean;
  isMinimized: boolean;
  animationState: SanadState;
  reducedMotion: boolean;
  isRtl: boolean;
  
  // Data State
  messages: ChatMessage[];
  isThinking: boolean;
  hasUnread: boolean;

  // Actions
  setOpen: (open: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setAnimationState: (state: SanadState) => void;
  setReducedMotion: (reduced: boolean) => void;
  setIsRtl: (rtl: boolean) => void;
  
  // Chat Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setThinking: (thinking: boolean) => void;
  clearChat: () => void;
  markRead: () => void;
}

export const useSanadStore = create<SanadStore>((set) => ({
  isOpen: false,
  isMinimized: false,
  animationState: 'idle',
  reducedMotion: false, // In a real app, initialized from window.matchMedia
  isRtl: false,
  
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello. I am Sanad, your AI Co-Founder. I am here to guide you through building your business. How can I help you today?',
      timestamp: new Date().toISOString(),
    }
  ],
  isThinking: false,
  hasUnread: true,

  setOpen: (open) => set({ isOpen: open, hasUnread: open ? false : true }),
  setMinimized: (minimized) => set({ isMinimized: minimized }),
  setAnimationState: (state) => set({ animationState: state }),
  setReducedMotion: (reduced) => set({ reducedMotion: reduced }),
  setIsRtl: (rtl) => set({ isRtl: rtl }),
  
  addMessage: (msg) => set((state) => ({
    messages: [
      ...state.messages, 
      { 
        ...msg, 
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString() 
      }
    ],
    hasUnread: !state.isOpen
  })),
  setThinking: (thinking) => set({ isThinking: thinking }),
  clearChat: () => set({ messages: [] }),
  markRead: () => set({ hasUnread: false }),
}));
