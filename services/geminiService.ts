
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ProcessedData, ImageSize, Source, InputMode } from "../types";

export class GeminiService {
  private static getAi() {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  private static extractMermaidFromText(text: string): string | null {
    const mermaidRegex = /```mermaid\s*([\s\S]*?)\s*```/;
    const match = text.match(mermaidRegex);
    return match ? match[1].trim() : null;
  }

  static async improveVisualPrompt(currentPrompt: string, brandingName?: string): Promise<string> {
    const ai = this.getAi();
    const brandingContext = brandingName ? `The branding style is named: "${brandingName}". ` : "";

    const prompt = `You are an expert prompt engineer for AI image generators (like DALL-E 3, Midjourney, and Gemini). 
    Your task is to take a visual branding concept and transform it into a highly descriptive, professional, and aesthetic prompt optimized for creating high-quality corporate infographics and slide visuals.
    
    ${brandingContext}
    Current visual description/prompt: "${currentPrompt || 'Not provided'}"
    
    If the current prompt is empty or minimal, use the branding name to imagine and describe a professional, cohesive, and high-end visual style.
    
    The improved prompt should include:
    - Specific artistic style (e.g., minimalist, 3D claymorphism, flat vector, high-tech glassmorphism, neo-brutalism).
    - Detailed color palette (e.g., specific hex-like descriptions or professional color names).
    - Composition details (e.g., isometric view, centered layout, airy spacing).
    - Lighting and texture details (e.g., soft studio lighting, frosted glass, vibrant gradients).
    - Clear instructions on maintaining a professional corporate look.
    - Ensure it is generic enough to apply to any content while maintaining the visual style.
    
    Return ONLY the improved prompt text. No preamble, no quotes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
    });

    return response.text.trim();
  }

  static async processContent(input: string, mode: InputMode, file?: { data: string, mimeType: string }): Promise<ProcessedData> {
    const ai = this.getAi();

    let prompt = "";
    const commonInstructions = `
Your task:
1. Provide a well-structured, professional executive summary of the content. 
   - Use bullet points for key takeaways.
   - Use bold text (e.g., **Key Term**) for important concepts.
   - Keep it professional and high-level.
2. Create a Mermaid.js mindmap syntax representing the content structure.
`;

    const parts: any[] = [];

    if (mode === 'url') {
      prompt = `Visit the following blog URL and extract the core concepts and hierarchy. 
      URL: ${input}
      ${commonInstructions}
      IMPORTANT: Structure your response with the summary first, followed by the Mermaid code block.`;
      parts.push({ text: prompt });
    } else if (mode === 'file' && file) {
      prompt = `Analyze the attached file and extract all core concepts, textual information, and hierarchy.
      ${commonInstructions}
      IMPORTANT: Structure your response as JSON with 'summary' and 'mermaidCode' fields.`;
      parts.push({
        inlineData: {
          data: file.data,
          mimeType: file.mimeType
        }
      });
      parts.push({ text: prompt });
    } else {
      const existingMermaid = this.extractMermaidFromText(input);
      if (existingMermaid) {
        prompt = `Analyze the following content which includes a Mermaid diagram. 
        Content:
        """
        ${input}
        """
        ${commonInstructions}
        Even though the user provided a diagram, please provide a refined Mermaid.js mindmap version in your response.`;
      } else {
        prompt = `Analyze the following text and extract the core concepts and hierarchy. 
        Content:
        """
        ${input}
        """
        ${commonInstructions}`;
      }
      parts.push({ text: prompt });
    }

    const config: any = {};
    if (mode === 'url') {
      config.tools = [{ googleSearch: {} }];
    } else {
      config.responseMimeType = "application/json";
      config.responseSchema = {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          mermaidCode: { type: Type.STRING }
        },
        required: ["summary", "mermaidCode"]
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config
    });

    const sources: Source[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
          sources.push({
            url: chunk.web.uri,
            title: chunk.web.title || chunk.web.uri
          });
        }
      }
    }

    const rawText = response.text || '';
    let summary = '';
    let mermaidCode = '';

    if (mode === 'url') {
      mermaidCode = this.extractMermaidFromText(rawText) || "mindmap\n  root((No Content))";
      summary = rawText.replace(/```mermaid[\s\S]*?```/g, '').trim() || "No summary available.";
    } else {
      try {
        const json = JSON.parse(rawText);
        summary = json.summary || "No summary available.";
        mermaidCode = json.mermaidCode || "mindmap\n  root((No Content))";
      } catch (e) {
        console.warn("Failed to parse JSON response:", e);
        mermaidCode = this.extractMermaidFromText(rawText) || "mindmap\n  root((No Content))";
        summary = rawText.split('\n')[0] || "No summary available.";
      }
    }

    return {
      summary,
      mermaidCode,
      sources: sources.length > 0 ? sources : undefined
    };
  }

  static async generateInfographic(mermaidCode: string, size: ImageSize, brandingPrompt: string): Promise<string> {
    const ai = this.getAi();

    const prompt = `${brandingPrompt}
---
Here is a mindmap using Mermaid to visualize:
${mermaidCode}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: size
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/jpeg;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");
  }

  static async generateDirectInfographic(content: string, size: ImageSize, brandingPrompt: string): Promise<string> {
    const ai = this.getAi();

    const prompt = `${brandingPrompt}
---
CONTENT TO VISUALIZE:
${content}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: size
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/jpeg;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");
  }
}
