import React, { useState, useEffect, useRef } from 'react';
import { AgentMode, AgentResponse, MemorySlot } from '../types';
import { generateAgentResponse, AGENT_REGISTRY } from '../services/geminiService';

interface AgentOverlayProps {
  position: { top: number; left: number; lineHeight: number } | null;
  isVisible: boolean;
  contextData: string;
  savedMemory: MemorySlot | null;
  onClose: () => void;
  onInsert: (text: string) => void;
  onSaveMemory: (content: string, source: string) => void;
}

const AgentOverlay: React.FC<AgentOverlayProps> = ({
  position,
  isVisible,
  contextData,
  savedMemory,
  onClose,
  onInsert,
  onSaveMemory
}) => {
  const [mode, setMode] = useState<AgentMode>(AgentMode.IDLE);
  const [inputValue, setInputValue] = useState('');
  const [streamedContent, setStreamedContent] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [groundingUrls, setGroundingUrls] = useState<string[]>([]);
  
  // State for Agent Selection
  const [activeAgentId, setActiveAgentId] = useState<string>('default');
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      setMode(AgentMode.LISTENING);
      setInputValue('');
      setStreamedContent('');
      setGeneratedImages([]);
      setGroundingUrls([]);
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Command Parsing for UI feedback
  useEffect(() => {
    const words = inputValue.split(' ');
    // Detect Agent switch via @
    const agentCmd = words.find(w => w.startsWith('@'));
    if (agentCmd) {
      const agentKey = agentCmd.substring(1);
      if (AGENT_REGISTRY[agentKey]) {
        setActiveAgentId(agentKey);
      }
    } else if (inputValue === '') {
      setActiveAgentId('default');
    }
  }, [inputValue]);

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    // Handle //save command
    if (inputValue.trim() === '//save') {
      onSaveMemory(contextData, activeAgentId);
      setStreamedContent("Context saved to memory clipboard! You can now switch agents and this context will follow.");
      setMode(AgentMode.DONE);
      return;
    }

    setMode(AgentMode.THINKING);
    setStreamedContent('');
    setGeneratedImages([]);
    setGroundingUrls([]);

    // Clean prompt: remove @agent
    const cleanPrompt = inputValue.replace(/@\w+\s?/, '').trim();

    try {
      setMode(AgentMode.STREAMING);
      
      const response: AgentResponse = await generateAgentResponse(
        cleanPrompt,
        contextData,
        savedMemory?.content || null,
        activeAgentId,
        (chunk) => {
          setStreamedContent(chunk);
        }
      );
      
      setGroundingUrls(response.groundingUrls || []);
      if (response.images && response.images.length > 0) {
        setGeneratedImages(response.images);
      }
      setMode(AgentMode.DONE);
    } catch (error) {
      console.error(error);
      setStreamedContent("Error: Agent connection failed.");
      setMode(AgentMode.ERROR);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (mode === AgentMode.DONE) {
        // If image exists, insert markdown syntax
        if (generatedImages.length > 0) {
           // Simulating insertion of image asset
           onInsert(`![Generated Image](data:image/png;base64,${generatedImages[0]})`);
        } else {
           onInsert(streamedContent);
        }
      } else if (mode === AgentMode.LISTENING) {
        handleSubmit();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-complete agent names or commands could go here
      if (mode === AgentMode.DONE) {
        onInsert(streamedContent);
      }
    }
  };

  if (!isVisible || !position) return null;

  const currentAgent = AGENT_REGISTRY[activeAgentId];

  // Dynamic style for positioning
  const style: React.CSSProperties = {
    top: position.top + position.lineHeight + 8,
    left: Math.max(20, position.left),
    maxWidth: '650px',
  };

  return (
    <div 
      className="fixed z-50 flex flex-col w-full max-w-xl bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl bg-opacity-95 font-sans text-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/5"
      style={style}
    >
      {/* Header / Meta Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/20 border-b border-white/5 text-[10px] text-zinc-400">
         <div className="flex items-center space-x-2">
            <span className="bg-primary/20 text-blue-300 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
              {currentAgent.name}
            </span>
            {savedMemory && (
              <span className="flex items-center text-green-400 space-x-1 animate-pulse">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Memory Active</span>
              </span>
            )}
         </div>
         <div className="flex space-x-2">
           <span className="opacity-50">Commands:</span>
           <span className="text-zinc-300">@coder</span>
           <span className="text-zinc-300">@writer</span>
           <span className="text-zinc-300">@memer</span>
           <span className="text-zinc-300">//save</span>
         </div>
      </div>

      {/* Input Bar */}
      <div className="flex items-center px-4 py-3">
        <div className={`w-2.5 h-2.5 rounded-full mr-4 shadow-[0_0_10px_currentColor] ${
          mode === AgentMode.THINKING ? 'bg-yellow-400 text-yellow-400 animate-pulse' :
          mode === AgentMode.ERROR ? 'bg-red-500 text-red-500' :
          'bg-blue-500 text-blue-500'
        }`} />
        
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-zinc-500 font-medium"
          placeholder={`Ask ${currentAgent.name} or type //save...`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
      </div>

      {/* Output Area */}
      {(streamedContent || generatedImages.length > 0 || mode === AgentMode.THINKING) && (
        <div className="px-4 py-4 bg-[#181825]/50 border-t border-white/5 max-h-[400px] overflow-y-auto no-scrollbar">
          
          {mode === AgentMode.THINKING && (
            <div className="text-zinc-500 flex items-center space-x-2">
               <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <span>Processing with {currentAgent.model}...</span>
            </div>
          )}

          {/* Text Output */}
          {streamedContent && (
            <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {streamedContent}
            </div>
          )}

          {/* Image Output */}
          {generatedImages.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-2">
              {generatedImages.map((img, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10">
                  <img src={`data:image/png;base64,${img}`} alt="Generated" className="w-full h-auto object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-xs font-bold bg-black/80 px-2 py-1 rounded">
                      Press Enter to Insert
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grounding Sources */}
      {groundingUrls.length > 0 && (
        <div className="px-4 py-2 bg-blue-900/20 border-t border-blue-500/20 flex flex-wrap gap-3">
          <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wide py-0.5">Sources</span>
          {groundingUrls.map((url, idx) => (
            <a 
              key={idx} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline truncate max-w-[200px]"
            >
              {new URL(url).hostname}
            </a>
          ))}
        </div>
      )}

      {/* Footer / Hints */}
      <div className="px-4 py-2 bg-[#181825] border-t border-white/5 flex justify-between text-[10px] text-zinc-600">
        <div className="flex gap-4">
          <span><b className="text-zinc-500">TAB</b> Insert</span>
          <span><b className="text-zinc-500">ESC</b> Cancel</span>
          <span><b className="text-zinc-500">@coder</b> Switch Agent</span>
        </div>
        <span className="font-mono opacity-50">AgentKey v2.0-Alpha</span>
      </div>
    </div>
  );
};

export default AgentOverlay;
