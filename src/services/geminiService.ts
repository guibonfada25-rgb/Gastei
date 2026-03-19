import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ExtractedExpense {
  description: string;
  amount: number;
  category: string;
  type: string;
  date: string;
}

export const extractExpenseFromText = async (text: string, categories: string[]): Promise<ExtractedExpense | null> => {
  const categoriesStr = categories.join(", ");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract expense details from this text: "${text}". 
    Return a JSON object with: description, amount (number), category (one of: ${categoriesStr}), 
    type (one of: Necessidade Fixa, Desejo Pessoal, Dívida/Investimento), and date (ISO string).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          category: { type: Type.STRING },
          type: { type: Type.STRING },
          date: { type: Type.STRING }
        },
        required: ["description", "amount", "category", "type", "date"]
      }
    }
  });

  try {
    return JSON.parse(response.text) as ExtractedExpense;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
};

export const extractExpensesFromDocument = async (base64Data: string, mimeType: string, categories: string[]): Promise<ExtractedExpense[]> => {
  const categoriesStr = categories.join(", ");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: `Extract all expenses from this document (it could be a receipt image, a PDF statement, or a spreadsheet screenshot). Return a JSON array of objects with: description, amount (number), category (one of: ${categoriesStr}), type (one of: Necessidade Fixa, Desejo Pessoal, Dívida/Investimento), and date (ISO string).` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            type: { type: Type.STRING },
            date: { type: Type.STRING }
          },
          required: ["description", "amount", "category", "type", "date"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text) as ExtractedExpense[];
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const extractExpensesFromTextContent = async (content: string, categories: string[]): Promise<ExtractedExpense[]> => {
  const categoriesStr = categories.join(", ");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract all expenses from this text data (it could be a CSV or raw text):
    
    ${content}
    
    Return a JSON array of objects with: description, amount (number), category (one of: ${categoriesStr}), type (one of: Necessidade Fixa, Desejo Pessoal, Dívida/Investimento), and date (ISO string).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            type: { type: Type.STRING },
            date: { type: Type.STRING }
          },
          required: ["description", "amount", "category", "type", "date"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text) as ExtractedExpense[];
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const getFinancialInsight = async (expenses: any[], budget: number): Promise<string> => {
  const expensesSummary = expenses.map(e => `${e.description}: R$${e.amount} (${e.category})`).join("\n");
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze these expenses for a monthly budget of R$${budget}:\n${expensesSummary}\n
    Provide a response in Portuguese following the "Gastei" format:
    1. Validação: O gasto era necessário ou impulsivo?
    2. Impacto: Como esse gasto afeta sua meta mensal?
    3. Alternativa: Existe uma forma de reduzir esse custo no futuro?
    Include a "Insight do Gastei" and a "Pílula de Conhecimento". Use Markdown.`,
  });

  return response.text || "Não foi possível gerar insights no momento.";
};
