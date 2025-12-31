import React, { useState, useRef, useEffect } from 'react';
import { getCaretCoordinates } from '../utils/cursorUtils';
import AgentOverlay from './AgentOverlay';

const DEFAULT_CODE = `// AgentKey Playground
// Try typing "//" anywhere to trigger the AI.

function calculateFactorial(n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * calculateFactorial(n); // Bug here?
}

// Try: //fix selection
// Try: //ask best sorting algorithm
`;

const Editor: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [caretPos, setCaretPos] = useState<{ top: number; left: number; lineHeight: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [triggerIndex, setTriggerIndex] = useState<number>(-1);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setCode(newVal);

    // Detect Trigger "//"
    const cursorIndex = e.target.selectionEnd;
    
    // Check if the last two characters typed were "//"
    if (newVal.substring(cursorIndex - 2, cursorIndex) === '//' && !overlayVisible) {
      const coords = getCaretCoordinates(e.target, cursorIndex);
      setCaretPos(coords);
      setTriggerIndex(cursorIndex);
      setOverlayVisible(true);
    }
  };

  const handleOverlayInsert = (insertedText: string) => {
    if (!textareaRef.current) return;

    // Logic: Replace the trigger "//" + prompt with the result
    // Or just insert at cursor if it was a generic trigger.
    // For this MVP, we simply insert at the trigger point.
    
    const before = code.substring(0, triggerIndex);
    const after = code.substring(textareaRef.current.selectionEnd);
    
    // Remove the trigger "//" from 'before' if we want clean insertion
    const cleanBefore = before.endsWith('//') ? before.substring(0, before.length - 2) : before;

    const newCode = cleanBefore + insertedText + after;
    setCode(newCode);
    setOverlayVisible(false);
    
    // Restore focus
    textareaRef.current.focus();
  };

  // Get context (selection or surrounding lines)
  const getContext = (): string => {
    if (!textareaRef.current) return '';
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start !== end) {
      return textareaRef.current.value.substring(start, end);
    }
    
    // If no selection, grab 10 lines around cursor
    const lines = code.split('\n');
    // Approximate line finding (simplified)
    return code.substring(Math.max(0, start - 500), Math.min(code.length, end + 500));
  };

  return (
    <div className="relative w-full h-screen bg-background flex flex-col items-center pt-20">
      
      <div className="max-w-4xl w-full px-6 mb-4">
        <h1 className="text-2xl font-bold text-text mb-2 tracking-tight">AgentKey <span className="text-primary text-sm font-normal border border-border px-2 py-0.5 rounded-full ml-2">Web Playground</span></h1>
        <p className="text-muted text-sm mb-6">
          Experience the <span className="text-zinc-200 font-mono bg-white/10 px-1 rounded">Alt+Space</span> or <span className="text-zinc-200 font-mono bg-white/10 px-1 rounded">//</span> workflow. 
          Uses <b>Gemini 3 Pro</b> for deep thinking and <b>Gemini 3 Flash</b> for speed.
        </p>
      </div>

      <div className="relative w-full max-w-4xl h-[600px] bg-surface rounded-lg border border-border shadow-2xl overflow-hidden flex flex-col">
        <div className="h-8 bg-zinc-950 border-b border-border flex items-center px-4 space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
          <span className="ml-4 text-xs text-zinc-500 font-mono">index.js — Local</span>
        </div>
        
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleInput}
          spellCheck={false}
          className="flex-1 w-full bg-transparent text-zinc-300 font-mono p-6 resize-none outline-none leading-relaxed text-sm selection:bg-primary/30"
          placeholder="Start typing..."
        />
        
        {/* The Magic Overlay */}
        <AgentOverlay 
          isVisible={overlayVisible}
          position={caretPos}
          contextData={getContext()}
          onClose={() => {
            setOverlayVisible(false);
            textareaRef.current?.focus();
          }}
          onInsert={handleOverlayInsert}
        />
      </div>

      <div className="mt-8 text-center">
        <p className="text-zinc-600 text-xs">
          Press <span className="text-zinc-400 font-mono">//</span> to trigger. Try typing <span className="text-accent font-mono">ask what is rust?</span> or <span className="text-accent font-mono">fix</span> with selection.
        </p>
      </div>
    </div>
  );
};

export default Editor;
