import React, { useState, useRef } from 'react';
import { getCaretCoordinates } from '../utils/cursorUtils';
import AgentOverlay from './AgentOverlay';
import { MemorySlot } from '../types';

const DEFAULT_CODE = `// AgentKey Playground v2.0
// The OS-level Input Layer for the AI Era.

/* 
   MISSION 1: AGENT SWITCHING
   Try using specific personas for specific tasks.
   1. Place cursor below.
   2. Type "//"
   3. Type "@coder write a fast python fibonacci function"
*/



/*
   MISSION 2: MEMORY & CONTEXT MIGRATION
   Save context from one place and use it elsewhere.
   1. Highlight the text below: "Project code: 884-Bravo-X"
   2. Type "//" and then input "//save"
   3. Move to a new line and type "// @writer write a confidential memo about this project"
   (Notice the "Memory Active" indicator)
*/

Project code: 884-Bravo-X

/*
   MISSION 3: MULTIMODAL (MEME GEN)
   1. Type "//"
   2. Type "@memer a programmer realizing it's friday 5pm"
   3. Press Enter to generate, then Enter again to insert the image markdown.
*/
`;

const Editor: React.FC = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [caretPos, setCaretPos] = useState<{ top: number; left: number; lineHeight: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [triggerIndex, setTriggerIndex] = useState<number>(-1);
  
  // Lifted state: Memory allows context migration between invocations
  const [memory, setMemory] = useState<MemorySlot | null>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setCode(newVal);

    // Detect Trigger "//"
    const cursorIndex = e.target.selectionEnd;
    
    // Check if the last two characters typed were "//"
    if (newVal.substring(cursorIndex - 2, cursorIndex) === '//' && !overlayVisible) {
      const coords = getCaretCoordinates(e.target, cursorIndex);
      // Adjust coords because we are now inside a relative container, not absolute 0,0 of body potentially
      // Actually getCaretCoordinates uses absolute body positioning, but our overlay uses 'fixed'.
      // However, we need to account for scrolling of the page if the editor is down below.
      // AgentOverlay uses 'fixed', so we need viewport coordinates (getBoundingClientRect).
      
      // Patching getCaretCoordinates logic slightly for the demo context:
      // The utility returns absolute doc coordinates. If using fixed position overlay, we need:
      // top - window.scrollY
      
      const rect = coords; 
      // We will pass rect as is, but modify AgentOverlay to handle fixed positioning correctly if needed.
      // Current Utils implementation: returns top relative to document.
      // AgentOverlay style: { top: position.top ... }
      // If AgentOverlay is 'fixed', 'top' needs to be relative to viewport.
      
      // Let's rely on a small trick: subtract scrollY inside the handler here before passing to state
      const viewportTop = coords.top - window.scrollY;
      const viewportLeft = coords.left - window.scrollX;
      
      // Fix: map height to lineHeight and avoid spreading excess properties
      setCaretPos({ 
        top: viewportTop, 
        left: viewportLeft, 
        lineHeight: coords.height 
      });
      
      setTriggerIndex(cursorIndex);
      setOverlayVisible(true);
    }
  };

  const handleOverlayInsert = (insertedText: string) => {
    if (!textareaRef.current) return;

    const before = code.substring(0, triggerIndex);
    const after = code.substring(textareaRef.current.selectionEnd);
    const cleanBefore = before.endsWith('//') ? before.substring(0, before.length - 2) : before;

    const newCode = cleanBefore + insertedText + after;
    setCode(newCode);
    setOverlayVisible(false);
    textareaRef.current.focus();
  };

  const handleSaveMemory = (content: string, source: string) => {
    setMemory({
      id: Date.now().toString(),
      content: content,
      timestamp: Date.now(),
      sourceAgent: source
    });
  };

  // Get context (selection or surrounding lines)
  const getContext = (): string => {
    if (!textareaRef.current) return '';
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    if (start !== end) return textareaRef.current.value.substring(start, end);
    return code.substring(Math.max(0, start - 500), Math.min(code.length, end + 500));
  };

  return (
    <div className="relative w-full h-[600px] flex flex-col bg-[#1e1e2e]">
      {/* Editor Header */}
      <div className="h-10 bg-[#181825] border-b border-white/5 flex items-center px-4 justify-between shrink-0">
         <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
        <span className="text-xs text-zinc-500 font-mono">demo.ts — AgentKey</span>
        
         {/* Memory Indicator inside Editor */}
         <div className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-2 ${memory ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-white/5 border-white/5 text-zinc-600'}`}>
           <span className="uppercase font-bold">Memory</span>
           {memory && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>}
        </div>
      </div>
      
      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleInput}
        spellCheck={false}
        className="flex-1 w-full bg-transparent text-zinc-300 font-mono p-8 resize-none outline-none leading-loose text-sm selection:bg-blue-500/30"
        placeholder="Start typing..."
      />
      
      <AgentOverlay 
        isVisible={overlayVisible}
        position={caretPos}
        contextData={getContext()}
        savedMemory={memory}
        onClose={() => {
          setOverlayVisible(false);
          textareaRef.current?.focus();
        }}
        onInsert={handleOverlayInsert}
        onSaveMemory={handleSaveMemory}
      />
    </div>
  );
};

export default Editor;