import { GEMINI_API_KEY } from '@env';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Add debugging to check if the API key is loaded
console.log('API Key status:', GEMINI_API_KEY ? 'Present' : 'Missing');

if (!GEMINI_API_KEY) {
  console.warn(
    "Gemini API key is not configured. Please check:\n" +
    "1. .env file exists in project root\n" +
    "2. GEMINI_API_KEY is correctly set in .env\n" +
    "3. You've rebuilt the app after adding the .env file"
  );
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

export const sendMessageToBot = async (message: string): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return "Chatbot is not configured. Please add your API key to the .env file.";
  }
  
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: "You are a helpful study assistant called FocusBot. Your goal is to provide concise, accurate information for studying, like a search engine. Keep your answers brief and to the point. Do not engage in casual conversation. If a user asks a question unrelated to studying or general knowledge, politely decline and state your purpose." }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am FocusBot. How can I help you study?" }],
        },
      ],
    });

    const result = await chatSession.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
}; 