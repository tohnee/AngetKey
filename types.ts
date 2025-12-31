export interface Coordinates {
  top: number;
  left: number;
  height: number;
}

export enum AgentMode {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  STREAMING = 'STREAMING',
  DONE = 'DONE',
  ERROR = 'ERROR'
}

export interface AgentResponse {
  text?: string;
  images?: string[]; // Base64 strings
  groundingUrls?: string[];
}

export interface AgentPersona {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  model: string;
  tools?: string[]; // 'googleSearch', etc.
  type: 'text' | 'image';
}

export interface MemorySlot {
  id: string;
  content: string;
  timestamp: number;
  sourceAgent: string;
}

export interface EditorContext {
  textBefore: string;
  textAfter: string;
  selection: string;
}

export enum CommandType {
  FIX = 'fix',
  ASK = 'ask',
  POLITE = 'polite',
  MEME = 'meme',
  GENERAL = 'general',
  SAVE = 'save'
}
