import { GoogleGenAI, Modality } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function chatWithAI(
  language: string,
  level: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string
) {
  const ai = getAI();
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are a patient and friendly language learning partner named LingoBuddy. 
      The user wants to practice ${language} at a ${level} level. 
      - Always respond primarily in ${language}.
      - If the user's message in ${language} has a significant grammatical error, provide a gentle correction in English at the end of your message, clearly labeled as "Correction:".
      - Keep the conversation engaging and ask open-ended questions.
      - If the user asks for a translation, provide it.
      - Use vocabulary appropriate for the ${level} level.`,
    },
    history: history,
  });

  const response = await chat.sendMessage({ message });
  return response;
}

export async function generateSpeech(text: string) {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return pcmToBase64Wav(base64Audio, 24000);
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
  return null;
}

/**
 * Prepends a WAV header to raw PCM data so it can be played by standard Audio elements.
 * Gemini TTS returns 16-bit PCM, Mono, 24kHz.
 */
function pcmToBase64Wav(base64Pcm: string, sampleRate: number): string {
  const binaryString = atob(base64Pcm);
  const dataSize = binaryString.length;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  const headerArray = new Uint8Array(header);
  const pcmArray = new Uint8Array(dataSize);
  for (let i = 0; i < dataSize; i++) {
    pcmArray[i] = binaryString.charCodeAt(i);
  }

  const combined = new Uint8Array(headerArray.length + pcmArray.length);
  combined.set(headerArray);
  combined.set(pcmArray, headerArray.length);

  const base64 = btoa(
    Array.from(combined)
      .map(b => String.fromCharCode(b))
      .join('')
  );
  return `data:audio/wav;base64,${base64}`;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
