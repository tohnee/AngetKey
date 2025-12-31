import React, { useState, useEffect, useRef } from 'react';
import { AgentMode, CommandType, AgentResponse } from '../types';
import { generateAgentResponse } from '../services/geminiService';

interface AgentOverlayProps {
  position: { top: number; left: number; lineHeight: number } | null;
  isVisible: boolean;
  contextData: string;
  onClose: () => void;
  onInsert: (text: string) => void;
}

const AgentOverlay: React.FC<AgentOverlayProps> = ({
  position,
  isVisible,
  contextData,
  onClose,
  onInsert
}) => {
  const [mode, setMode] = useState<AgentMode>(AgentMode.IDLE);
  const [inputValue, setInputValue] = useState('');
  const [streamedContent, setStreamedContent] = useState('');
  const [groundingUrls, setGroundingUrls] = useState<string[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<CommandType>(CommandType.GENERAL);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when overlay appears
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setMode(AgentMode.LISTENING);
      setInputValue('');
      setStreamedContent('');
      setGroundingUrls([]);
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Handle Command Parsing (e.g., //fix, //ask)
  useEffect(() => {
    if (inputValue.startsWith('fix ')) setSelectedCommand(CommandType.FIX);
    else if (inputValue.startsWith('ask ')) setSelectedCommand(CommandType.ASK);
    else if (inputValue.startsWith('polite ')) setSelectedCommand(CommandType.POLITE);
    else setSelectedCommand(CommandType.GENERAL);
  }, [inputValue]);

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    setMode(AgentMode.THINKING);
    setStreamedContent('');
    setGroundingUrls([]);

    // Remove command prefix for the actual prompt
    const cleanPrompt = inputValue.replace(/^(fix|ask|polite)\s+/, '');

    try {
      setMode(AgentMode.STREAMING);
      const response: AgentResponse = await generateAgentResponse(
        cleanPrompt,
        contextData,
        selectedCommand,
        (chunk) => {
          setStreamedContent(chunk);
        }
      );
      setGroundingUrls(response.groundingUrls || []);
      setMode(AgentMode.DONE);
    } catch (error) {
      console.error(error);
      setStreamedContent("Error: Unable to connect to AgentKey core (Gemini API). Check console.");
      setMode(AgentMode.ERROR);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (mode === AgentMode.DONE) {
        onInsert(streamedContent);
      } else if (mode === AgentMode.LISTENING) {
        handleSubmit();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (mode === AgentMode.DONE) {
        onInsert(streamedContent);
      }
    }
  };

  if (!isVisible || !position) return null;

  // Dynamic style for positioning
  const style: React.CSSProperties = {
    top: position.top + position.lineHeight + 4, // 4px padding below line
    left: Math.max(10, position.left), // Prevent going off-screen left
    maxWidth: '600px',
  };

  return (
    <div 
      className="fixed z-50 flex flex-col w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl backdrop-blur-md bg-opacity-95 font-mono text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={style}
    >
      {/* Input Bar */}
      <div className="flex items-center px-3 py-2 border-b border-border bg-black/20">
        <div className={`w-2 h-2 rounded-full mr-3 ${
          mode === AgentMode.THINKING ? 'bg-yellow-500 animate-pulse' :
          mode === AgentMode.ERROR ? 'bg-red-500' :
          'bg-green-500'
        }`} />
        <span className="text-muted mr-2 select-none">AgentKey &gt;</span>
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent border-none outline-none text-text placeholder-zinc-600"
          placeholder="Type a command (fix, ask) or prompt..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {selectedCommand !== CommandType.GENERAL && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded uppercase font-bold tracking-wider">
            {selectedCommand}
          </span>
        )}
      </div>

      {/* Output Area */}
      {(streamedContent || mode === AgentMode.THINKING) && (
        <div className="p-3 bg-black/40 max-h-64 overflow-y-auto no-scrollbar">
          {mode === AgentMode.THINKING && (
            <div className="text-muted italic animate-pulse">Thinking deeply...</div>
          )}
          {streamedContent && (
            <pre className="whitespace-pre-wrap text-zinc-300 font-mono text-xs leading-relaxed">
              {streamedContent}
            </pre>
          )}
        </div>
      )}

      {/* Grounding Sources */}
      {groundingUrls.length > 0 && (
        <div className="px-3 py-2 bg-black/60 border-t border-border flex flex-wrap gap-2">
          <span className="text-xs text-muted">Sources:</span>
          {groundingUrls.map((url, idx) => (
            <a 
              key={idx} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline truncate max-w-[150px]"
            >
              {new URL(url).hostname}
            </a>
          ))}
        </div>
      )}

      {/* Footer Hints */}
      <div className="px-3 py-1.5 bg-zinc-950/50 border-t border-border flex justify-between text-[10px] text-zinc-500 uppercase tracking-widest">
        <span>
          {mode === AgentMode.DONE ? '[Tab] Insert  [Esc] Discard' : '[Enter] Run  [Esc] Cancel'}
        </span>
        <span className="font-bold text-zinc-600">MVP v1.0</span>
      </div>
    </div>
  );
};

export default AgentOverlay;
