
import { GoogleGenAI } from "@google/genai";
import { ModelType, GarmentConfig, Gender, GroundingSource } from "../types";
import { SYSTEM_PROMPT } from "../constants";

/**
 * Creates a fresh instance of the Google GenAI client.
 * Adheres to the requirement of initializing right before API calls to ensure
 * the most up-to-date environment variables (like API_KEY) are utilized.
 * This is especially important for serverless or edge-based deployments like Netlify.
 */
// Use named parameter and direct access to process.env.API_KEY as per guidelines.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFabric = async (fabricBase64: string): Promise<string> => {
  const ai = getAIClient();
  // Fixed: Correcting contents structure to a single Content object { parts: [...] }
  const response = await ai.models.generateContent({
    model: ModelType.GEMINI_TEXT,
    contents: {
      parts: [
        { inlineData: { data: fabricBase64.split(',')[1], mimeType: 'image/jpeg' } },
        { text: "Analyze this luxury fabric. Describe its artistic potential for haute couture in one elegant sentence." }
      ]
    }
  });
  return response.text || "Material essence captured by Arslan Wazir.";
};

export const updateDesignLogic = async (
  userPrompt: string, 
  currentConfig: GarmentConfig, 
  chatHistory: { role: string, content: string }[]
): Promise<{ updatedConfig: GarmentConfig; message: string; sources?: GroundingSource[] }> => {
  const ai = getAIClient();
  const historyParts = chatHistory.map(h => `${h.role === 'user' ? 'Client' : 'Arslan Wazir'}: ${h.content}`).join('\n');
  
  const prompt = `
    CURRENT_ATELIER_STATE: ${JSON.stringify(currentConfig)}
    CLIENT_WISH: "${userPrompt}"
    
    ${SYSTEM_PROMPT}
    
    PREVIOUS_CONVERSATION_LOG:
    ${historyParts}

    TASK:
    Analyze the Client's wish. If they want a specific change, update only that part of the JSON while keeping everything else. If they want a new design, overhaul it. Always provide the full resulting JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { 
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 4000 } 
    }
  });

  let sources: GroundingSource[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    sources = groundingChunks
      .filter(c => c.web)
      .map(c => ({ title: c.web?.title || 'Boutique Inspiration', uri: c.web?.uri || '' }));
  }

  const text = response.text || '';
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Aesthetic manifest missing.");
    const data = JSON.parse(jsonMatch[0]);
    
    const displayMessage = text.replace(/\{[\s\S]*\}/, '').replace(/```json|```/g, '').trim() || "The design has been refined to your standards.";

    const modelVal = data.render_profile.model?.toLowerCase();
    let modelType: Gender = currentConfig.render_profile.model;
    if (modelVal === 'man') modelType = 'Man';
    else if (modelVal === 'woman') modelType = 'Woman';
    else if (modelVal === 'child') modelType = 'Child';
    else if (modelVal === 'personal') modelType = 'Personal';

    const finalConfig: GarmentConfig = {
      kernel_state: 'ACTIVE',
      render_profile: {
        ...currentConfig.render_profile,
        model: modelType,
        background: 'minimal_white',
        modifications: {
          ...currentConfig.render_profile.modifications,
          ...data.render_profile.modifications
        }
      }
    };

    return { updatedConfig: finalConfig, message: displayMessage, sources: sources.length > 0 ? sources : undefined };
  } catch (e) {
    return { updatedConfig: currentConfig, message: text.replace(/\{[\s\S]*\}/, '').trim(), sources: sources.length > 0 ? sources : undefined };
  }
};

export const renderGarment = async (
  fabricBase64: string, 
  config: GarmentConfig
): Promise<string> => {
  const ai = getAIClient();
  const profile = config.render_profile;
  const mods = profile.modifications;
  
  const isPersonal = profile.model === 'Personal' && profile.userSilhouette;
  
  let contents: any;

  if (isPersonal) {
    const fabricPart = { inlineData: { data: fabricBase64.split(',')[1], mimeType: 'image/jpeg' } };
    const personPart = { inlineData: { data: profile.userSilhouette!.split(',')[1], mimeType: 'image/jpeg' } };
    const promptPart = { text: `Perform a professional virtual try-on. Redress the person in the second image with a custom haute couture garment.
    FABRIC: Use the exact texture and color from the first image.
    SILHOUETTE: ${mods.fit}.
    SLEEVES: ${mods.sleeves}.
    DETAILS: Includes ${mods.pockets} architectural pockets.
    The output must maintain the person's exact face, pose, and background while seamlessly mapping the fabric onto the new garment structure. High-end fashion editorial quality.` };
    
    contents = { parts: [fabricPart, personPart, promptPart] };
  } else {
    const fabricPrompt = `A high-fashion editorial, full-body portrait of a ${profile.model} model.
    STYLE: An avant-garde couture masterpiece featuring a ${mods.fit}.
    SPECIFICS: ${mods.sleeves} sleeves, with ${mods.pockets} designer pockets integrated into the seams.
    FABRIC: The garment is constructed entirely from the provided textile swatch, showing realistic drape and high-resolution weave.
    SETTING: Minimalist Parisian atelier, soft cinematic lighting, neutral luxury background.
    Composition: Full length head-to-toe, impeccable tailoring, 8k resolution, photorealistic fashion photography.`;

    contents = {
      parts: [
        { inlineData: { data: fabricBase64.split(',')[1], mimeType: 'image/jpeg' } },
        { text: fabricPrompt }
      ]
    };
  }

  // Fix: Removed 'imageSize: "1K"' as it is only supported for gemini-3-pro-image-preview
  const response = await ai.models.generateContent({
    model: ModelType.GEMINI_IMAGE,
    contents,
    config: { 
      imageConfig: { 
        aspectRatio: "9:16"
      } 
    }
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
  throw new Error("Synthesis disrupted.");
};
