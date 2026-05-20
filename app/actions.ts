'use server';

import { GoogleGenAI, Type, Schema } from '@google/genai';

export async function generateContent(
  type: 'story' | 'scene' | 'shot' | 'visual',
  input: string,
  language: string,
  userApiKey?: string
) {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API key is missing. Please provide a key in the app or configure GEMINI_API_KEY.');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  let schema: Schema;
  let systemInstruction: string;
  let userPrompt: string = `Target language: ${language}. Input content:\n\n${input}`;

  switch (type) {
    case 'story':
      systemInstruction = 'You are an expert cinematic screenwriter. Convert the provided idea/concept into a compelling cinematic story. Output must be in the specified target language.';
      schema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          story: { type: Type.STRING, description: 'The detailed cinematic story separated by double newlines for paragraphs' }
        },
        required: ['title', 'story']
      };
      break;

    case 'scene':
      systemInstruction = 'You are an expert cinematic screenwriter. Break down the provided story into dramatic sequences and intense cinematic scenes. Output must be in the specified target language.';
      schema = {
        type: Type.OBJECT,
        properties: {
          movieTitle: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNo: { type: Type.NUMBER },
                intExt: { type: Type.STRING, description: 'INT or EXT' },
                dayNight: { type: Type.STRING, description: 'DAY or NIGHT' },
                location: { type: Type.STRING },
                sceneDescription: { type: Type.STRING }
              },
              required: ['sceneNo', 'intExt', 'dayNight', 'location', 'sceneDescription']
            }
          }
        },
        required: ['movieTitle', 'scenes']
      };
      break;

    case 'shot':
      systemInstruction = 'You are an expert cinematic director. Break down the provided scenes into a technical shot division including camera angles, movement, and framing. Output must be in the specified target language.';
      schema = {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNo: { type: Type.NUMBER },
                intExt: { type: Type.STRING },
                dayNight: { type: Type.STRING },
                location: { type: Type.STRING },
                sceneDescription: { type: Type.STRING },
                shots: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      shotNo: { type: Type.NUMBER },
                      shotType: { type: Type.STRING },
                      camera: { type: Type.STRING },
                      visual: { type: Type.STRING }
                    },
                    required: ['shotNo', 'shotType', 'camera', 'visual']
                  }
                }
              },
              required: ['sceneNo', 'intExt', 'dayNight', 'location', 'sceneDescription', 'shots']
            }
          }
        },
        required: ['scenes']
      };
      break;

    case 'visual':
      systemInstruction = 'You are an expert cinematic pre-visualization director. Generate detailed cinematic metadata and image/video synthesis prompts for each shot provided. Output must be in the specified target language. For imagePrompt and videoPrompt, they must be highly descriptive and in English even if the requested language is else, for best AI generator results.';
      schema = {
        type: Type.OBJECT,
        properties: {
          visuals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                shotNo: { type: Type.STRING, description: 'E.g., "SHOT 1"' },
                imagePrompt: { type: Type.STRING, description: 'High quality cinematic Midjourney style image prompt (16:9)' },
                videoPrompt: { type: Type.STRING, description: 'Runway Gen-3 style cinematic video generation prompt' },
                shotType: { type: Type.STRING },
                cameraMovement: { type: Type.STRING },
                lens: { type: Type.STRING },
                lensAperture: { type: Type.STRING },
                angle: { type: Type.STRING },
                visual: { type: Type.STRING },
                lighting: { type: Type.STRING }
              },
              required: ['shotNo', 'imagePrompt', 'videoPrompt', 'shotType', 'cameraMovement', 'lens', 'lensAperture', 'angle', 'visual', 'lighting']
            }
          }
        },
        required: ['visuals']
      };
      break;
    default:
      throw new Error('Invalid generation type requested.');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: schema,
    }
  });

  if (!response.text) {
    throw new Error('Failed to generate content: empty response');
  }

  return JSON.parse(response.text);
}
