import { GoogleGenAI } from "@google/genai";
import { Session, TreatmentType } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generatePayrollAnalysis = async (sessions: Session[], monthName: string): Promise<string> => {
  if (!sessions.length) {
    return "No sessions found for this period.";
  }

  // Prepare data for the prompt
  const sessionSummary = sessions.map(s => 
    `- Date: ${new Date(s.timestamp).toLocaleDateString()}, Patient: ${s.patientName}, Type: ${s.treatmentType}, Duration: ${s.durationMinutes} mins`
  ).join('\n');

  const prompt = `
    You are a payroll assistant for a freelance physiotherapy clinic.
    Analyze the following list of completed treatment sessions for the month of ${monthName}.
    
    Data:
    ${sessionSummary}
    
    Please provide a professional, friendly, and concise executive summary (in Markdown) that the employer can use for payroll processing.
    Include:
    1. A brief greeting.
    2. A summary of the total workload (highlighting the mix between Physio vs Massage).
    3. Any notable observations (e.g. "High volume of sports massage this month").
    4. A generated "Invoice Description" text snippet that the freelancer could paste into their invoice.
    
    Do not output the raw data list again. Focus on the insights and summary.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI analysis. Please check your API key and connection.";
  }
};