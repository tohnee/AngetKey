import { GoogleGenAI } from "@google/genai";
import { AgentResponse, AgentPersona } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const AGENT_REGISTRY: Record<string, AgentPersona> = {
  default: {
    id: 'default',
    name: 'General',
    description: 'Helpful Assistant',
    systemInstruction: 'You are AgentKey. Be concise and helpful.',
    model: 'gemini-3-flash-preview',
    type: 'text'
  },
  coder: {
    id: 'coder',
    name: 'DevBox',
    description: 'Senior Engineer',
    systemInstruction: 'You are a Senior Software Engineer. Provide efficient, clean, and modern code solutions. Analyze bugs deeply.',
    model: 'gemini-3-pro-preview',
    type: 'text'
  },
  writer: {
    id: 'writer',
    name: 'CopyEditor',
    description: 'Content Polisher',
    systemInstruction: 'You are a professional editor. Improve grammar, tone, and clarity. Make the text engaging.',
    model: 'gemini-3-flash-preview',
    type: 'text'
  },
  researcher: {
    id: 'researcher',
    name: 'Search',
    description: 'Web Researcher',
    systemInstruction: 'You are a researcher. Use Google Search to find facts.',
    model: 'gemini-3-pro-preview',
    tools: ['googleSearch'],
    type: 'text'
  },
  memer: {
    id: 'memer',
    name: 'MemeGen',
    description: 'Visual Artist',
    systemInstruction: 'You are a creative visual artist. Create funny or relevant images based on the text.',
    model: 'gemini-2.5-flash-image',
    type: 'image'
  }
};

export const generateAgentResponse = async (
  prompt: string,
  context: string,
  savedMemory: string | null,
  agentId: string,
  onStream: (chunk: string) => void
): Promise<AgentResponse> => {
  
  const agent = AGENT_REGISTRY[agentId] || AGENT_REGISTRY.default;
  
  // Construct the full prompt context
  let fullContext = `Context from editor:\n${context}`;
  if (savedMemory) {
    fullContext += `\n\n[PRIOR SAVED CONTEXT/MEMORY]:\n${savedMemory}\n(Use this information to inform your response)`;
  }

  // Handle Image Generation
  if (agent.type === 'image') {
    try {
      // For image generation, we use generateContent but extract inlineData
      const response = await ai.models.generateContent({
        model: agent.model,
        contents: {
          parts: [{ text: `Generate an image based on this context and prompt: ${prompt}. Context: ${context}` }]
        }
        // Note: No responseMimeType for nano banana models (gemini-2.5-flash-image)
      });

      const images: string[] = [];
      let text = "";

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            images.push(part.inlineData.data);
          } else if (part.text) {
            text += part.text;
          }
        }
      }
      
      return { text, images };
    } catch (e) {
      console.error("Image Gen Error", e);
      throw e;
    }
  }

  // Handle Text/Thinking/Search Generation
  let tools: any[] = [];
  let thinkingConfig = undefined;

  if (agent.tools?.includes('googleSearch')) {
    tools.push({ googleSearch: {} });
  }

  if (agent.model === 'gemini-3-pro-preview' && !agent.tools?.length) {
    thinkingConfig = { thinkingBudget: 1024 }; // Enable thinking for Pro coder
  }

  const systemInstruction = `${agent.systemInstruction}\nOutput ONLY the requested content directly usable in the editor.`;

  try {
    const stream = await ai.models.generateContentStream({
      model: agent.model,
      contents: `Prompt: ${prompt}\n\n${fullContext}`,
      config: {
        systemInstruction,
        thinkingConfig,
        tools: tools.length > 0 ? tools : undefined,
      },
    });

    let fullText = "";
    let groundingUrls: string[] = [];

    for await (const chunk of stream) {
      // Extract grounding
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
