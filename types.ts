export interface Coordinates {
  top: number;
  left: number;
  height: number;
}

export enum AgentMode {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING', // Triggered by //
  THINKING = 'THINKING',
  STREAMING = 'STREAMING',
  DONE = 'DONE',
  ERROR = 'ERROR'
}

export interface AgentResponse {
  text: string;
  groundingUrls?: string[];
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
  GENERAL = 'general'
}
