import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

const SYSTEM_INSTRUCTION = `Eres LIS-AI, el asistente clínico especializado de PLATAFORMA-LIS.
Tu propósito es asistir a tecnólogos médicos, microbiólogos y jefes de laboratorio en:
1. Interpretación de valores críticos (pánico biológico) según guías internacionales y del MINSA Panamá.
2. Control de calidad analítico (Reglas de Westgard, índices HIL: Hemólisis, Ictericia, Lipemia).
3. Trazabilidad y no conformidades bajo norma ISO 15189:2022.
4. Protocolos de Banco de Sangre e ISBT 128.
Tus respuestas deben ser técnicas, concisas y orientadas a la seguridad del paciente.`;

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      text: 'Hola. Soy LIS-AI, asistente clínico de apoyo diagnóstico y aseguramiento de la calidad ISO 15189. ¿En qué puedo ayudarte hoy?',
      sender: 'system',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getOfflineClinicalResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('glucosa') || q.includes('panico') || q.includes('critico')) {
      return 'Para valores críticos de glucosa (> 300 mg/dL o < 50 mg/dL): Debe confirmarse inmediatamente en el analizador (verificar ausencia de coágulo/hemólisis), notificar por teléfono al médico tratante y registrar fecha, hora y receptor en la bitácora de pánico según ISO 15189 §7.4.';
    }
    if (q.includes('westgard') || q.includes('qc') || q.includes('calidad') || q.includes('levey')) {
      return 'Reglas de Westgard principales: 1-3s (Alerta de rechazo aleatorio), 2-2s (Rechazo sistemático, calibrar o cambiar reactivo), R-4s (Error aleatorio significativo). Si se viola una regla de rechazo, suspenda la corrida y retenga resultados.';
    }
    if (q.includes('hemolisis') || q.includes('hil') || q.includes('lipemia')) {
      return 'Interferencias HIL: La hemólisis eleva falsamente el Potasio (K+), DHL, AST y Magnesio por liberación intracelular. Solicite nueva muestra o añada nota de interferencia preanalítica en el reporte.';
    }
    if (q.includes('banco de sangre') || q.includes('isbt') || q.includes('transfusion')) {
      return 'Protocolo ISBT 128: Toda unidad en cuarentena debe contar con tamizaje serológico no reactivo (VIH, VHB, VHC, Sífilis, Chagas, HTLV-I/II) y doble tipificación ABO/Rh antes de su liberación a inventario transfusional.';
    }
    return `Consulta clínica registrada: "${query}". Los procedimientos operativos estandarizados (POEs) y las directrices técnicas del laboratorio están disponibles en el Gestor Documental ISO 15189.`;
  };

  const sendMessage = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: trimmedText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? (process as any).env?.GEMINI_API_KEY : undefined);

    try {
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: trimmedText,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.2,
          }
        });

        const replyText = response.text || 'No se obtuvo respuesta del modelo clínico.';
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            text: replyText,
            sender: 'system',
            timestamp: new Date(),
          }
        ]);
      } else {
        // Asistente Clínico Inteligente Offline
        await new Promise((resolve) => setTimeout(resolve, 500));
        const offlineReply = getOfflineClinicalResponse(trimmedText);
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            text: offlineReply,
            sender: 'system',
            timestamp: new Date(),
          }
        ]);
      }
    } catch (err: any) {
      console.warn('LIS-AI fallback offline activado:', err);
      const fallbackReply = getOfflineClinicalResponse(trimmedText);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          text: fallbackReply,
          sender: 'system',
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    inputText,
    setInputText,
    sendMessage,
    isLoading,
  };
};
