import { GoogleGenAI, Type } from "@google/genai";
import { AgentResponse, CommandType } from '../types';

// Using process.env.API_KEY as per strict instructions.
// In a real local-first desktop app, this would be loaded from user config.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAgentResponse = async (
  prompt: string,
  context: string,
  commandType: CommandType,
  onStream: (chunk: string) => void
): Promise<AgentResponse> => {
  
  let modelName = 'gemini-3-flash-preview';
  let systemInstruction = `You are AgentKey, a cursor-anchored AI assistant. 
  Output ONLY the requested code or text transformation without markdown fences if possible, 
  unless specifically asked for explanation. Your goal is to be pasted directly into an editor.
  
  Context from editor:
  ${context}`;

  let tools: any[] = [];
  let thinkingConfig = undefined;

  // Configuration based on command type (PRD Logic + Gemini Guidelines)
  
  if (commandType === CommandType.FIX) {
    // Complex reasoning for code fixing -> Use Thinking Mode
    modelName = 'gemini-3-pro-preview';
    thinkingConfig = { thinkingBudget: 32768 }; 
    systemInstruction += "\nAnalyze the code logic deeply before providing a fix.";
  } else if (commandType === CommandType.ASK) {
    // Knowledge retrieval -> Use Search Grounding
    modelName = 'gemini-3-flash-preview';
    tools = [{ googleSearch: {} }];
    systemInstruction += "\nUse Google Search to provide up-to-date answers.";
  }

  try {
    const stream = await ai.models.generateContentStream({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig, // Only valid for gemini-3-pro-preview
        tools: tools.length > 0 ? tools : undefined,
      },
    });

    let fullText = "";
    let groundingUrls: string[] = [];

    for await (const chunk of stream) {
      // Check for grounding chunks to extract URLs
      if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        chunk.candidates[0].groundingMetadata.groundingChunks.forEach((c: any) => {
          if (c.web?.uri) {
            groundingUrls.push(c.web.uri);
          }
        });
      }

      if (chunk.text) {
        fullText += chunk.text;
        onStream(fullText);
      }
    }

    return { text: fullText, groundingUrls: Array.from(new Set(groundingUrls)) };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
