import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { DEFAULT_EXPERIENCES } from "./src/data/experiences";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to get GoogleGenAI client lazily
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Model cooldown registry to prevent repeatedly hitting temporarily overloaded models
const modelCooldowns: Record<string, number> = {};

// Universal robust JSON parser that handles code fences, preamble text, and trailing commas
function safeParseJson(text: string): any {
  if (!text) return null;
  const clean = text.trim();
  try {
    return JSON.parse(clean);
  } catch {}

  // Strip markdown code fences if present
  const noFences = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(noFences);
  } catch {}

  // Extract the largest {...} object block
  const startIdx = clean.indexOf("{");
  const endIdx = clean.lastIndexOf("}");
  if (startIdx !== -1 && endIdx > startIdx) {
    const candidate = clean.slice(startIdx, endIdx + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Remove trailing commas before } or ]
      const fixedTrailing = candidate.replace(/,\s*([\]}])/g, "$1");
      return JSON.parse(fixedTrailing);
    }
  }

  throw new Error("No valid JSON structure found in response");
}

// Resilient Gemini caller with high-speed gemini-3.1-flash-lite and fallback models
async function generateGeminiContent(options: {
  contents: any;
  responseMimeType?: string;
  temperature?: number;
  timeoutMs?: number;
}): Promise<string | null> {
  const ai = getGenAI();
  if (!ai) return null;

  // 1. gemini-3.1-flash-lite: Sub-second latency (~600ms), ultra-stable, zero 503 spike errors
  // 2. gemini-3.8-flash: High-capability model, used if flash-lite unavailable or when flash has recovered
  const candidateModels = [
    { name: "gemini-3.1-flash-lite", timeoutMs: options.timeoutMs || 6000, maxAttempts: 1 },
    { name: "gemini-3.8-flash", timeoutMs: options.timeoutMs || 6500, maxAttempts: 1 },
  ];

  for (const config of candidateModels) {
    const modelName = config.name;

    // Check if this model is in temporary cooldown (e.g. recent 503 spike)
    if (modelCooldowns[modelName] && Date.now() < modelCooldowns[modelName]) {
      continue;
    }

    const timeoutMs = config.timeoutMs;

    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
      let timer: any = null;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Gemini timeout after ${timeoutMs}ms for ${modelName}`)), timeoutMs);
        });

        const apiPromise = ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config: {
            responseMimeType: options.responseMimeType || "application/json",
            temperature: options.temperature ?? 0.8,
          },
        });

        const res: any = await Promise.race([apiPromise, timeoutPromise]);
        if (timer) clearTimeout(timer);
        if (res?.text) {
          return res.text;
        }
      } catch (err: any) {
        if (timer) clearTimeout(timer);
        const errMsg = String(err?.message || err || "");
        const status = err?.status || (errMsg.includes("503") ? 503 : (errMsg.includes("429") ? 429 : (errMsg.includes("404") ? 404 : null)));
        console.warn(`[Gemini] Model ${modelName} (attempt ${attempt + 1}) notice:`, status || errMsg);

        // If 503 or 429 occurs, place this specific model on 60-second cooldown so subsequent requests switch instantly
        if (status === 503 || status === 429) {
          modelCooldowns[modelName] = Date.now() + 60_000;
        }

        break;
      }
    }
  }

  return null;
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ============================================================================
// API: Simulation Turn
// ============================================================================
app.post("/api/simulation/turn", async (req, res) => {
  const experience = req.body.experience || req.body.currentExperience || DEFAULT_EXPERIENCES[0];
  const worldState = req.body.worldState || req.body.currentWorldState || experience.initialState;
  const {
    conversationHistory = [],
    memories = [],
    studentInput = "",
    level = experience.level,
    variety = experience.variety,
    teacherIntervention,
  } = req.body;

  const ai = getGenAI();

  // Fallback simulation engine if Gemini API Key is not set or in case of offline testing
  if (!ai) {
    const fallbackResult = generateFallbackTurn(
      experience,
      worldState,
      studentInput,
      memories,
      teacherIntervention
    );
    return res.json(formatTurnOutput(fallbackResult));
  }

  try {

    const systemPrompt = `
ERES EL DIRECTOR DEL MUNDO de una experiencia inmersiva de aprendizaje comunicativo del español llamada "SPANISH AS A SYSTEM — VOICE EXPERIENCE 2.0".
Principio pedagógico central:
«El estudiante no habla español para completar ejercicios. Habla español porque necesita el español para hacer que algo suceda en el mundo.»

DATOS DE LA EXPERIENCIA:
- Título: ${experience.title}
- Nivel MCER: ${level || experience.level}
- Variedad del español: ${variety || experience.variety}
- Objetivo comunicativo: ${experience.communicativeObjective}
- Objetivo lingüístico pedagógico oculto (NO lo menciones explícitamente al alumno): ${experience.linguisticObjective}
- Misión Principal: ${experience?.mainMission?.title || "Misión principal"} (${experience?.mainMission?.description || "Objetivo de la simulación"})
- Personajes en la escena:
${(experience?.characters || [])
  .map(
    (c: any) =>
      `  * ${c.name} (${c.role}): Personalidad: ${c.personality}. Meta: ${c.goal}. Estilo: ${c.speechStyle}. Emoción: ${c.currentEmotion}. Voz: ${c.voiceId || "Fenrir"}. Registro: ${c.register || "coloquial"}. Límites: ${c.limits?.join("; ")}`
  )
  .join("\n")}
- Estado actual del mundo:
  * Presupuesto: ${worldState?.budget ?? 300} €
  * Confianza general: ${worldState?.trust ?? 70}/100
  * Estrés grupal: ${worldState?.stress ?? 25}/100
  * Relación con el grupo: ${worldState?.relationships ?? 10} (-100 a +100)
  * Ubicación actual: ${worldState?.location || "En ruta"}
  * Progreso de la misión: ${worldState?.goal_progress ?? 10}%
  * Día y Hora: ${worldState?.day || "Viernes"} ${worldState?.timeHour ?? 18}:00
  * Recursos del viaje: ${JSON.stringify(worldState?.resources || {})}
- Memoria de hechos pasados y promesas:
${memories && memories.length > 0 ? memories.map((m: any) => `  - Turno ${m.turn}: ${m.keyFact} (${m.promiseOrDecision})`).join("\n") : "  (Aún no hay promesas previas)"}

${teacherIntervention ? `INTERVENCIÓN DIRECTA DEL PROFESOR EN DIRECTO: ${JSON.stringify(teacherIntervention)}` : ""}

REGLAS DE CONVERSACIÓN ORAL 2.0 (ESTRICTO):
1. RESPUESTAS CORTAS Y NATURALES: MÁXIMO 1-2 FRASES (3 sólo en momentos de clímax o crisis extrema). En la vida real nadie suelta párrafos explicativos ni monólogos de novela.
2. MARCADORES ORALES Y PAUSAS: Usa puntuación expresiva y marcadores conversacionales propios del español oral («Bueno...», «A ver...», «Pues...», «Ya...», «Claro.», «Es que...», «No sé...», «Oye...», «Tranquilos...»).
3. ESCUCHA ACTIVA: El personaje debe retomar o referenciar palabras clave dichas por el alumno («¿Al pueblo dices? Pero si nos queda a 15 kilómetros...»).
4. FEEDBACK IMPLÍCITO (NO CORRECCIÓN PEDÁNTICA):
   - NUNCA rompas el personaje para corregir gramática.
   - Si el estudiante comete un error, aplica un "recast" natural incorporando la formulación correcta en tu réplica conversacional (Ej: si dice "Yo fue ayer", replica: "¿Fuiste ayer? Pues no me dijiste nada.").
5. EVALÚA LA INTENCIÓN COMUNICATIVA (communicativeIntent):
   Clasifica la intervención del alumno entre: 'request', 'refusal', 'agreement', 'disagreement', 'proposal', 'negotiation', 'apology', 'complaint', 'clarification', 'persuasion', 'question', 'explanation', 'narration', 'reaction', 'uncertainty', 'acceptance', 'rejection'.
6. REACCIÓN DINÁMICA DEL MUNDO:
   - Modifica budgetDelta, trustDelta, stressDelta, relationshipDelta, goalProgressDelta.
7. MULTIPERSONAJE OPCIONAL (secondaryResponse):
   - Si el estudiante hace una propuesta importante o controvertida que afecta a los demás, otro personaje presente puede apostillar con 1 frase rápida (ej. si Alejandro duda sobre el dinero, Lucía puede intervenir brevemente).

DEBES RESPONDER EXCLUSIVAMENTE UN OBJETO JSON con la siguiente estructura:
{
  "speakerId": "alejandro" | "lucia" | "marcos" | "don-tomas" | "narrator",
  "speakerName": "Nombre del personaje",
  "dialogue": "1-2 frases cortas y vivas de conversación oral en español",
  "emotion": "aliviado" | "enfadado" | "preocupado" | "entusiasmado" | "escéptico" | "pensativo",
  "communicativeIntent": "proposal" | "negotiation" | "agreement" | "disagreement" | "question" | ...,
  "narration": "1 frase corta de contexto sensorial o ambiental",
  "consequenceSummary": "Resumen conciso del cambio en el mundo (ej: 'Presupuesto: -30 € | Estrés: -10 | Confianza: +15')",
  "worldDeltas": {
    "budgetDelta": number,
    "trustDelta": number,
    "stressDelta": number,
    "relationshipDelta": number,
    "goalProgressDelta": number,
    "timeHoursDelta": number,
    "locationChangeId": null o string
  },
  "secondaryResponse": null o {
    "speakerId": "id de otro personaje",
    "speakerName": "Nombre",
    "text": "1 frase corta de reacción espontánea",
    "emotion": "emoción"
  },
  "newMemory": null o string con promesa/hecho clave recordable,
  "triggeredEventTitle": null o string si ocurrió un evento dinámico,
  "communicativeStrategyDetected": "Negociación activa" | "Empatía" | "Propuesta alternativa" | "Confrontación" | "Evasión",
  "endingTriggered": null | "perfect" | "acceptable" | "chaotic" | "disastrous" | "unexpected",
  "endingReason": null o string
}
`;

    const lastTurnsContext = (conversationHistory || [])
      .slice(-6)
      .map(
        (t: any) =>
          `${t.speakerName || t.speaker}: "${t.text}" ${t.worldChanges ? `[Cambio: ${t.worldChanges.description || ""}]` : ""}`
      )
      .join("\n");

    const prompt = `
HISTORIAL RECIENTE:
${lastTurnsContext || "(Comienzo de la experiencia)"}

INTERVENCIÓN LIBRE DEL ESTUDIANTE:
"${studentInput}"

Genera la reacción del mundo en formato JSON:`;

    const responseText = await generateGeminiContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }],
        },
      ],
      responseMimeType: "application/json",
      temperature: 0.8,
    });

    if (!responseText) {
      console.warn("[Simulation Turn] Gemini models returned no content or timed out, generating graceful fallback simulation turn");
      const fallback = generateFallbackTurn(
        experience,
        worldState,
        studentInput,
        memories,
        teacherIntervention
      );
      return res.json(formatTurnOutput(fallback));
    }

    const parsed = safeParseJson(responseText);
    return res.json(formatTurnOutput(parsed));
  } catch (err: any) {
    console.error("Error in /api/simulation/turn:", err);
    // Fallback response so user experience is never broken
    const fallback = generateFallbackTurn(
      experience,
      worldState,
      studentInput,
      memories,
      teacherIntervention
    );
    return res.json(formatTurnOutput(fallback));
  }
});

// ============================================================================
// API: Debrief & Final Linguistic Report
// ============================================================================
app.post("/api/simulation/debrief", async (req, res) => {
  const experience = req.body.experience || req.body.currentExperience || DEFAULT_EXPERIENCES[0];
  const finalWorldState = req.body.finalWorldState || req.body.worldState || experience.initialState;
  const {
    conversationHistory = [],
    memories = [],
    level = experience.level,
    variety = experience.variety,
  } = req.body;

  const ai = getGenAI();

  if (!ai) {
    return res.json(
      generateFallbackDebrief(
        finalWorldState,
        conversationHistory,
        experience
      )
    );
  }

  try {

    const studentTurns = (conversationHistory || []).filter(
      (t: any) => t.speaker === "student"
    );

    const prompt = `
ERES UN LINGÜISTA Y ASESOR PEDAGÓGICO DE ESPAÑOL COMO LENGUA EXTRANJERA (ELE) de alto nivel.
Debes generar el "INFORME DE COMUNICACIÓN" (DEBRIEF FINAL) tras una sesión de simulación en "SPANISH AS A SYSTEM".

INFORMACIÓN DE LA SESIÓN:
- Título: ${experience.title}
- Nivel del estudiante: ${level}
- Variedad de referencia: ${variety}
- Misión Principal: ${experience.mainMission.title}
- Estado Final:
  * Presupuesto restante: ${finalWorldState.budget} €
  * Estrés: ${finalWorldState.stress}/100
  * Confianza: ${finalWorldState.trust}/100
  * Relaciones: ${finalWorldState.relationships}/100
  * Progreso de la misión: ${finalWorldState.goal_progress}%

INTERVENCIONES TOTALES DEL ESTUDIANTE (${studentTurns.length} intervenciones):
${studentTurns
  .map((t: any, idx: number) => `${idx + 1}. "${t.text}"`)
  .join("\n")}

MEMORIA DE DECISIONES Y PROMESAS:
${JSON.stringify(memories || [])}

INSTRUCCIONES PARA EL INFORME:
1. Divide el informe en:
   - FLUIDEZ: Qué hizo bien el estudiante comunicativamente.
   - RECURSOS LINGÜÍSTICOS: Vocabulario clave y estructuras gramaticales que utilizó efectivamente.
   - EFICACIA COMUNICATIVA: Si logró sus metas, cómo negoció y si resolvió los problemas.
   - INTERACCIÓN: Cómo reaccionó ante la actitud, secretos o emociones de los personajes.
   - PUNTOS A MEJORAR: MÁXIMO 5 puntos pedagógicamente valiosos.
     * Cada punto debe tener formato:
       - type: 'GRAMATICAL' | 'NATURALIDAD' | 'REGISTRO' | 'PRAGMATICA' | 'VOCABULARIO'
       - studentPhrase: La frase real que dijo el alumno (o fragmento)
       - improvedPhrase: La versión natural y precisa en español
       - explanation: Explicación formativa y amable (ej: "En esta situación usaste... La forma más natural aquí sería...")
     * No penalices variantes legítimas de otras variedades del español (${variety}).
   - EARNED BADGES: Lista de insignias ganadas según su desempeño (elige entre Negociador, Pacificador, Improvisador, Detective, Persuasor, Superviviente Lingüístico).
   - ENDING: Tipo de final alcanzado ('perfect' | 'acceptable' | 'chaotic' | 'disastrous' | 'unexpected'), título y resumen narrativo.

RESPONDE EXCLUSIVAMENTE UN OBJETO JSON con esta estructura exacta:
{
  "fluency": {
    "summary": "Resumen entusiasta y profesional sobre la soltura comunicativa",
    "positivePoints": ["punto 1", "punto 2", "punto 3"]
  },
  "linguisticResources": {
    "vocabularyUsed": ["palabra/expresión 1", "palabra/expresión 2"],
    "grammaticalStructures": ["estructura 1", "estructura 2"]
  },
  "communicativeEfficacy": {
    "goalAchieved": boolean,
    "outcomeDescription": "Descripción de los resultados prácticos alcanzados en el mundo",
    "successfulNegotiations": ["negociación 1", "negociación 2"]
  },
  "interactionQuality": {
    "adaptationToCharacters": "Cómo se adaptó a los distintos personajes",
    "reactionToPressure": "Cómo manejó los momentos de tensión o conflicto"
  },
  "communicativeProfile": {
    "fluencyScore": 85,
    "interactionScore": 88,
    "efficacyScore": 80,
    "linguisticScore": 82,
    "vocabularyScore": 84,
    "overallAssessment": "Evaluación general del desempeño comunicativo oral"
  },
  "highlightMoments": [
    {
      "quote": "Frase clave que dijo el estudiante",
      "context": "Situación en la que la dijo",
      "outcome": "Qué logró en el mundo con esa frase",
      "whyItWorked": "Por qué funcionó tan bien comunicativamente"
    }
  ],
  "improvementMoments": [
    {
      "studentPhrase": "Frase que dijo",
      "nativeAlternative": "Versión más idiomática o asertiva",
      "explanation": "Explicación clara y amable",
      "communicativeContext": "Contexto de uso"
    }
  ],
  "pointsToImprove": [
    {
      "type": "NATURALIDAD" | "GRAMATICAL" | "REGISTRO" | "PRAGMATICA" | "VOCABULARIO",
      "studentPhrase": "frase que dijo",
      "improvedPhrase": "frase mejorada",
      "explanation": "explicación pedagógica constructiva"
    }
  ],
  "earnedBadges": [
    {
      "id": "negociador",
      "title": "🏆 NEGOCIADOR",
      "icon": "Handshake",
      "description": "Lograste acuerdos económicos o logísticos justos con el grupo.",
      "unlocked": true
    }
  ],
  "ending": {
    "type": "perfect" | "acceptable" | "chaotic" | "disastrous" | "unexpected",
    "title": "Título del final",
    "description": "Descripción general",
    "finalSummary": "Cierre narrativo del fin de semana"
  }
}
`;

    const responseText = await generateGeminiContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      responseMimeType: "application/json",
      temperature: 0.7,
    });

    if (!responseText) {
      throw new Error("No response from Gemini, using fallback debrief");
    }

    const parsed = safeParseJson(responseText);
    return res.json(parsed);
  } catch (err) {
    console.error("Error in /api/simulation/debrief:", err);
    return res.json(
      generateFallbackDebrief(
        finalWorldState,
        conversationHistory,
        experience
      )
    );
  }
});

// ============================================================================
// API: Generate Experience (Teacher Mode)
// ============================================================================
app.post("/api/simulation/generate-experience", async (req, res) => {
  try {
    const {
      prompt,
      level = "B1",
      variety = "spain",
      duration = "45 min",
      theme,
      communicativeObjective,
      linguisticObjective,
      characterCount = 3,
    } = req.body;

    const ai = getGenAI();
    if (!ai) {
      return res.status(400).json({
        error: "Se requiere GEMINI_API_KEY en los secretos para generar nuevas experiencias automáticamente con IA.",
      });
    }

    const systemPrompt = `
ERES EL CREADOR DE MUNDOS PEDAGÓGICOS para la plataforma "SPANISH AS A SYSTEM".
Tu objetivo es generar una EXPERIENCIA DE SIMULACIÓN COMUNICATIVA completa a partir de la descripción del profesor.

PRINCIPIOS:
- No generes un juego de preguntas y respuestas ni un test.
- Genera un PEQUEÑO MUNDO DINÁMICO con personajes que tienen objetivos, secretos y limitaciones.
- La experiencia debe requerir que el estudiante hable español para hacer que algo suceda.
- Adapta la dificultad estrictamente al nivel MCER (${level}) y variedad seleccionada (${variety}).

REQUISITOS DEL FORMATO DE SALIDA:
Genera un objeto JSON EXACTO compatible con la interfaz Experience:
{
  "id": "slug-unico",
  "title": "Título evocador",
  "level": "${level}",
  "duration": "${duration}",
  "theme": "${theme || "Tema principal"}",
  "communicativeObjective": "${communicativeObjective || "Objetivo comunicativo principal"}",
  "linguisticObjective": "${linguisticObjective || "Objetivo lingüístico pedagógico oculto"}",
  "vocabularyTopics": ["tema 1", "tema 2", "tema 3"],
  "variety": "${variety}",
  "setting": "Descripción cinematográfica y contextual del mundo inicial",
  "mainMission": {
    "id": "main-mission",
    "title": "Misión principal clara",
    "description": "Qué debe conseguir el alumno",
    "isMain": true,
    "completed": false,
    "progressPercent": 0
  },
  "secondaryMissions": [
    {
      "id": "sec-1",
      "title": "Misión secundaria 1",
      "description": "Objetivo opcional de optimización o relación",
      "isMain": false,
      "completed": false,
      "progressPercent": 0
    },
    {
      "id": "sec-2",
      "title": "Misión secundaria 2",
      "description": "Objetivo opcional de investigación o descubrimiento",
      "isMain": false,
      "completed": false,
      "progressPercent": 0
    }
  ],
  "characters": [
    {
      "id": "char-1",
      "name": "Nombre",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      "role": "Rol en la historia",
      "personality": "Rasgos de personalidad",
      "goal": "Qué quiere este personaje",
      "relationshipWithPlayer": 20,
      "trust": 60,
      "stress": 30,
      "currentEmotion": "neutro",
      "speechStyle": "Cómo habla y ejemplos de frases",
      "register": "coloquial",
      "gender": "male" | "female",
      "voiceId": "Kore" | "Puck" | "Fenrir" | "Charon" | "Aoede" | "Zephyr",
      "voicePitch": 1.0,
      "voiceRate": 1.0,
      "knownInfo": ["Dato 1"],
      "secrets": ["Secreto oculto que solo revelará con confianza"],
      "limits": ["Qué le hará enfadarse o negarse a colaborar"]
    }
  ],
  "locations": [
    {
      "id": "loc-1",
      "name": "Lugar 1",
      "icon": "Home",
      "description": "Descripción visual",
      "unlocked": true,
      "isCurrent": true
    },
    {
      "id": "loc-2",
      "name": "Lugar 2",
      "icon": "Compass",
      "description": "Descripción visual",
      "unlocked": false,
      "isCurrent": false
    }
  ],
  "initialState": {
    "budget": 250,
    "timeHour": 10,
    "day": "Sábado",
    "relationships": 20,
    "trust": 65,
    "stress": 20,
    "reputation": 50,
    "location": "loc-1",
    "goal_progress": 0,
    "resources": {},
    "language_level": "${level}",
    "variety": "${variety}"
  },
  "possibleEvents": [
    {
      "id": "ev-1",
      "title": "Evento inesperado 1",
      "description": "Giro o problema repentino",
      "triggerCondition": "Condición de activación",
      "consequencesText": "Qué pone en riesgo",
      "applied": false,
      "impact": { "stressDelta": 15, "budgetDelta": -20 }
    }
  ],
  "possibleEndings": [
    {
      "type": "perfect",
      "title": "Final Perfecto",
      "description": "Logro total",
      "triggerCondition": "goal_progress >= 85"
    },
    {
      "type": "acceptable",
      "title": "Final Aceptable",
      "description": "Logro parcial",
      "triggerCondition": "goal_progress >= 50"
    },
    {
      "type": "chaotic",
      "title": "Final Caótico",
      "description": "Complicaciones graves",
      "triggerCondition": "stress >= 75"
    },
    {
      "type": "disastrous",
      "title": "Final Desastroso",
      "description": "Fracaso total",
      "triggerCondition": "relationships <= -20"
    }
  ]
}
`;

    const userPrompt = `
DESCRIPCIÓN DEL PROFESOR:
"${prompt}"

NIVEL: ${level}
VARIEDAD: ${variety}
NÚMERO DE PERSONAJES: ${characterCount}

INSTRUCCIÓN CRÍTICA DE VOCES PARA DIÁLOGOS:
Cada personaje DEBE tener una voz acústica diferente para que en los diálogos se distingan con claridad:
- Voces disponibles:
  * "Kore": Femenina expresiva, ágil y melódica (pitch: 1.18, rate: 1.02)
  * "Puck": Masculino juvenil, enérgico y fresco (pitch: 1.06, rate: 1.04)
  * "Aoede": Femenina cálida, madura o reflexiva (pitch: 1.12, rate: 0.95)
  * "Fenrir": Masculino templado, sereno y equilibrado (pitch: 0.95, rate: 0.98)
  * "Charon": Masculino grave, veterano o de autoridad (pitch: 0.82, rate: 0.90)
  * "Zephyr": Voz clara y cinematográfica
NUNCA repitas la misma voz entre personajes del mismo escenario. Asigna género coherente con el nombre/rol.

Genera la experiencia completa en formato JSON:`;

    const text = await generateGeminiContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      responseMimeType: "application/json",
      temperature: 0.8,
      timeoutMs: 15000,
    });

    if (!text) {
      throw new Error("No se obtuvo respuesta de los modelos Gemini para generar la experiencia.");
    }

    const generatedExperience = safeParseJson(text);

    // Ensure strictly unique voices across characters
    const VOICE_PALETTE: Array<{ voiceId: 'Kore' | 'Puck' | 'Aoede' | 'Fenrir' | 'Charon' | 'Zephyr'; gender: 'female' | 'male'; pitch: number; rate: number }> = [
      { voiceId: 'Kore', gender: 'female', pitch: 1.18, rate: 1.02 },
      { voiceId: 'Puck', gender: 'male', pitch: 1.06, rate: 1.04 },
      { voiceId: 'Aoede', gender: 'female', pitch: 1.12, rate: 0.95 },
      { voiceId: 'Fenrir', gender: 'male', pitch: 0.95, rate: 0.98 },
      { voiceId: 'Charon', gender: 'male', pitch: 0.82, rate: 0.90 },
      { voiceId: 'Zephyr', gender: 'male', pitch: 1.00, rate: 1.00 },
    ];

    if (Array.isArray(generatedExperience.characters)) {
      const assignedVoices = new Set<string>();
      generatedExperience.characters.forEach((char: any, idx: number) => {
        const charNameLower = (char.name || '').toLowerCase();
        const isPresumedFemale = char.gender === 'female' ||
          charNameLower.endsWith('a') || charNameLower.includes('maría') ||
          charNameLower.includes('lucía') || charNameLower.includes('carmen') ||
          charNameLower.includes('elena') || charNameLower.includes('rosa') ||
          charNameLower.includes('sofía') || charNameLower.includes('camila');

        if (!char.voiceId || assignedVoices.has(char.voiceId)) {
          // Select an unused voice matching gender preference
          let matched = VOICE_PALETTE.find(
            (v) => !assignedVoices.has(v.voiceId) && (isPresumedFemale ? v.gender === 'female' : v.gender === 'male')
          );
          if (!matched) {
            matched = VOICE_PALETTE.find((v) => !assignedVoices.has(v.voiceId));
          }
          if (!matched) {
            matched = VOICE_PALETTE[idx % VOICE_PALETTE.length];
          }

          char.voiceId = matched.voiceId;
          char.gender = matched.gender;
          char.voicePitch = matched.pitch;
          char.voiceRate = matched.rate;
        }
        assignedVoices.add(char.voiceId);
      });
    }

    return res.json(generatedExperience);
  } catch (err: any) {
    console.error("Error in /api/simulation/generate-experience:", err);
    return res.status(500).json({
      error: "No se pudo generar la experiencia con IA: " + (err.message || String(err)),
    });
  }
});

// ============================================================================
// API: Replayability "What If...?" (¿Qué habría pasado si...?)
// ============================================================================
app.post("/api/simulation/what-if", async (req, res) => {
  try {
    const { originalInput, alternativeInput, currentContext } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        alternativeReaction:
          "Si hubieras dicho eso, el personaje habría reaccionado con mayor escepticismo y habrías tenido que buscar otra alternativa para no agotar el presupuesto.",
        divergentConsequence:
          "Presupuesto: -20 € | Confianza: -5 | Se habría desbloqueado una ruta secundaria por el pueblo.",
        pedagogicalInsight:
          "Esta alternativa utiliza una fórmula más asertiva que cambia la dinámica de poder en la conversación.",
      });
    }

    const prompt = `
En la simulación interactiva en español, el estudiante originalmente dijo:
"${originalInput}"

Ahora quiere explorar una simulación alternativa («¿Qué habría pasado si...?»):
"${alternativeInput}"

Contexto situacional:
${JSON.stringify(currentContext || {})}

Describe de forma cinematográfica y analítica qué habría ocurrido en ese universo alternativo:
1. alternativeReaction: Cómo habrían reaccionado los personajes ante este enfoque.
2. divergentConsequence: Qué variables del mundo habrían cambiado de modo distinto.
3. pedagogicalInsight: Reflexión pedagógica sobre la diferencia pragmática y lingüística entre ambas opciones.

Responde en formato JSON:
{
  "alternativeReaction": "...",
  "divergentConsequence": "...",
  "pedagogicalInsight": "..."
}
`;

    const clean = await generateGeminiContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      responseMimeType: "application/json",
      temperature: 0.7,
      timeoutMs: 8000,
    });

    if (!clean) {
      throw new Error("No response from Gemini for what-if");
    }

    const parsed = safeParseJson(clean);
    return res.json(parsed);
  } catch (err: any) {
    return res.json({
      alternativeReaction:
        "La alternativa habría abierto una vía de negociación diferente, cambiando la disposición de los interlocutores.",
      divergentConsequence: "Variación estimada en confianza y recursos.",
      pedagogicalInsight:
        "Analizar diferentes formulaciones permite ganar flexibilidad pragmática en español.",
    });
  }
});

// ============================================================================
// VOICE PROVIDER ARCHITECTURE (Abstracted Voice Engine)
// Supports: Gemini TTS, ElevenLabs (server-side), and seamless Browser Speech Fallback
// ============================================================================
export interface TTSOptions {
  text: string;
  speakerId?: string;
  speakerName?: string;
  variety?: string;
  emotion?: string;
  voiceId?: string;
  gender?: string;
  pitch?: number;
  rate?: number;
  provider?: 'gemini' | 'elevenlabs' | 'browser';
  elevenlabsVoiceId?: string;
  elevenlabsSettings?: {
    stability?: number;
    similarity?: number;
    style?: number;
    speed?: number;
  };
}

export interface VoiceProvider {
  name: string;
  isAvailable(): boolean;
  synthesize(options: TTSOptions): Promise<{ audioDataUrl?: string; fallbackToBrowser?: boolean; source: string; voiceName?: string; message?: string }>;
}

// In-memory cache to ensure instantaneous repeated speech playback
const ttsAudioCache = new Map<string, string>();
// Circuit breaker when Gemini TTS quota (10 free requests/day) is reached
let geminiTtsCooldownUntil = 0;

function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  // RIFF header
  header.write("RIFF", 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write("WAVE", 8);
  // fmt chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // Linear PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  // data chunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Character-specific ElevenLabs voice mapping for independent character vocal identities
const ELEVENLABS_CHARACTER_MAP: Record<string, string> = {
  marta: "EXAVITQu4vr4xnSDxMaL",     // Bella (expresiva, femenina)
  carlos: "VR6AewLTigWG4xSOukaG",    // Arnold (masculina, juvenil/analítica)
  alejandro: "ErXwobaYiN019PkySvjV", // Antoni (masculina, formal/serena)
  lucia: "AZnzlk1XvdvUeBnXmlld",     // Domi (femenina, animada)
  marcos: "TxGEqnHWrfWFTfGW9XjX",    // Josh (masculina, tranquila)
  "don-tomas": "onwK4e9ZLuTAKqWW03F9", // Daniel (masculina, madura/veterana)
  beto: "N2lVS1w4EtoT3dr4eOWO",      // Callum (masculina, enérgica)
  "dona-rosa": "21m00Tcm4TlvDq8ikWAM", // Rachel (femenina, cálida)
  narrator: "pNInz6obpgDQGcFmaJgB",  // Adam (neutra, narrativa)
  system: "pNInz6obpgDQGcFmaJgB",    // Adam
  event: "pNInz6obpgDQGcFmaJgB",     // Adam
};

// Map speaker profile to Gemini voice
function resolveGeminiVoiceName(options: TTSOptions): string {
  const VALID_VOICES = ["Puck", "Charon", "Kore", "Fenrir", "Aoede", "Zephyr"];
  if (options.voiceId && VALID_VOICES.some((v) => v.toLowerCase() === String(options.voiceId).toLowerCase())) {
    return VALID_VOICES.find((v) => v.toLowerCase() === String(options.voiceId).toLowerCase())!;
  }

  const cleanSpeaker = `${options.speakerId || ""} ${options.speakerName || ""}`.toLowerCase();
  
  if (cleanSpeaker.includes("narrator") || cleanSpeaker.includes("director") || cleanSpeaker.includes("mundo") || cleanSpeaker.includes("sistema") || cleanSpeaker.includes("acontecimiento")) {
    return "Zephyr";
  }
  if (cleanSpeaker.includes("marta")) return "Kore";
  if (cleanSpeaker.includes("carlos")) return "Puck";
  if (cleanSpeaker.includes("alejandro")) return "Fenrir";
  if (cleanSpeaker.includes("lucia") || cleanSpeaker.includes("lucía")) return "Kore";
  if (cleanSpeaker.includes("marcos")) return "Puck";
  if (cleanSpeaker.includes("tomas") || cleanSpeaker.includes("tomás") || cleanSpeaker.includes("don ")) return "Charon";
  if (cleanSpeaker.includes("beto") || cleanSpeaker.includes("primo")) return "Puck";
  if (cleanSpeaker.includes("rosa") || cleanSpeaker.includes("dona") || cleanSpeaker.includes("doña")) return "Aoede";

  const isFemale =
    options.gender === "female" ||
    cleanSpeaker.includes("mujer") ||
    cleanSpeaker.includes("chica") ||
    cleanSpeaker.includes("madre") ||
    cleanSpeaker.includes("camila") ||
    cleanSpeaker.includes("sofia") ||
    cleanSpeaker.includes("sofía") ||
    cleanSpeaker.includes("valeria");

  const isElder =
    cleanSpeaker.includes("abuelo") ||
    cleanSpeaker.includes("anciano") ||
    cleanSpeaker.includes("veterano");

  if (isFemale) return isElder ? "Aoede" : "Kore";
  if (isElder) return "Charon";
  if (options.gender === "male") return "Puck";

  return "Zephyr";
}

// 1. Gemini Voice Provider
class GeminiVoiceProvider implements VoiceProvider {
  name = "gemini";

  isAvailable(): boolean {
    const ai = getGenAI();
    return Boolean(ai) && Date.now() >= geminiTtsCooldownUntil;
  }

  async synthesize(options: TTSOptions) {
    const voiceName = resolveGeminiVoiceName(options);
    const cleanText = options.text.trim();
    const speakerKey = options.speakerId || options.speakerName || "unknown";
    const cacheKey = `gemini:${speakerKey}:${voiceName}:${cleanText}`;

    console.log(`[VOICE SERVER] characterId = ${speakerKey} | voiceId = ${voiceName} | provider = gemini | text = "${cleanText.substring(0, 35)}"`);

    if (ttsAudioCache.has(cacheKey)) {
      return { audioDataUrl: ttsAudioCache.get(cacheKey), source: "cache", voiceName };
    }

    const ai = getGenAI();
    if (!ai || Date.now() < geminiTtsCooldownUntil) {
      return { fallbackToBrowser: true, source: "client_synthesis", voiceName, message: "Modo cliente activado." };
    }

    let speechPrompt = cleanText;
    if (options.emotion) {
      speechPrompt = `Di con entonación natural en español (${options.emotion}): ${cleanText}`;
    }

    let rawBase64: string | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const responsePromise = ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: speechPrompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini TTS timeout")), 7000)
        );

        const response: any = await Promise.race([responsePromise, timeoutPromise]);
        rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (rawBase64) break;
      } catch (errAttempt: any) {
        const errMsg = errAttempt?.message || String(errAttempt);
        // If quota exceeded (free tier limit 10/day) or service unavailable, set long cooldown and fallback immediately
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
          geminiTtsCooldownUntil = Date.now() + 24 * 3600 * 1000;
          return { fallbackToBrowser: true, source: "client_synthesis", voiceName, message: "Síntesis nativa del navegador activada." };
        }
        if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE")) {
          geminiTtsCooldownUntil = Date.now() + 120_000;
          return { fallbackToBrowser: true, source: "client_synthesis", voiceName, message: "Síntesis nativa del navegador activada." };
        }
        geminiTtsCooldownUntil = Date.now() + 60_000;
        return { fallbackToBrowser: true, source: "client_synthesis", voiceName, message: "Síntesis nativa del navegador activada." };
      }
    }

    if (!rawBase64) {
      return { fallbackToBrowser: true, source: "client_synthesis", voiceName };
    }

    const pcmBuffer = Buffer.from(rawBase64, "base64");
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
    const audioDataUrl = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;

    if (ttsAudioCache.size > 120) {
      const firstKey = ttsAudioCache.keys().next().value;
      if (firstKey) ttsAudioCache.delete(firstKey);
    }
    ttsAudioCache.set(cacheKey, audioDataUrl);

    return { audioDataUrl, source: "gemini", voiceName };
  }
}

// 2. ElevenLabs Voice Provider (Server-Side only, API Key never exposed)
class ElevenLabsVoiceProvider implements VoiceProvider {
  name = "elevenlabs";

  isAvailable(): boolean {
    const key = process.env.ELEVENLABS_API_KEY;
    return Boolean(key && key.trim() !== "");
  }

  async synthesize(options: TTSOptions) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      // Fallback to Gemini
      return new GeminiVoiceProvider().synthesize(options);
    }

    const speakerKey = (options.speakerId || options.speakerName || "unknown").toLowerCase();
    
    // Explicit character voice resolution:
    let voiceId = options.elevenlabsVoiceId;
    if (!voiceId && options.voiceId && options.voiceId.length > 10 && !["puck", "charon", "kore", "fenrir", "aoede", "zephyr"].includes(options.voiceId.toLowerCase())) {
      voiceId = options.voiceId;
    }

    if (!voiceId) {
      // Check known character mapping
      for (const [key, id] of Object.entries(ELEVENLABS_CHARACTER_MAP)) {
        if (speakerKey.includes(key)) {
          voiceId = id;
          break;
        }
      }
    }

    if (!voiceId) {
      if (options.gender === "female") {
        voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel
      } else if (options.voiceId === "Charon" || options.voiceId === "Zephyr") {
        voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam
      } else {
        voiceId = "ErXwobaYiN019PkySvjV"; // Antoni
      }
    }

    const cleanText = options.text.trim();
    const cacheKey = `elevenlabs:${speakerKey}:${voiceId}:${cleanText}`;

    console.log(`[VOICE SERVER] characterId = ${speakerKey} | voiceId = ${voiceId} | provider = elevenlabs | text = "${cleanText.substring(0, 35)}"`);

    if (ttsAudioCache.has(cacheKey)) {
      return { audioDataUrl: ttsAudioCache.get(cacheKey), source: "cache", voiceName: voiceId };
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: options.text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: options.elevenlabsSettings?.stability ?? 0.5,
            similarity_boost: options.elevenlabsSettings?.similarity ?? 0.75,
            style: options.elevenlabsSettings?.style ?? 0.3,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        console.warn("[ElevenLabs] API returned status:", response.status, "Falling back to Gemini TTS");
        return new GeminiVoiceProvider().synthesize(options);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const audioDataUrl = `data:audio/mpeg;base64,${base64}`;

      if (ttsAudioCache.size > 120) {
        const firstKey = ttsAudioCache.keys().next().value;
        if (firstKey) ttsAudioCache.delete(firstKey);
      }
      ttsAudioCache.set(cacheKey, audioDataUrl);

      return { audioDataUrl, source: "elevenlabs", voiceName: voiceId };
    } catch (err) {
      console.warn("[ElevenLabs] Request failed, falling back to Gemini TTS:", err);
      return new GeminiVoiceProvider().synthesize(options);
    }
  }
}

// Voice Provider Manager
const geminiProvider = new GeminiVoiceProvider();
const elevenlabsProvider = new ElevenLabsVoiceProvider();

function getVoiceProvider(requestedProvider?: string): VoiceProvider {
  if (requestedProvider === "elevenlabs" && elevenlabsProvider.isAvailable()) {
    return elevenlabsProvider;
  }
  return geminiProvider;
}

app.post("/api/simulation/tts", async (req, res) => {
  try {
    const {
      text,
      speakerId,
      speakerName,
      variety = "spain",
      emotion,
      voiceId,
      gender,
      pitch,
      rate,
      provider,
      elevenlabsVoiceId,
      elevenlabsSettings,
    } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "El texto es obligatorio para la síntesis de voz." });
    }

    const ttsOptions: TTSOptions = {
      text,
      speakerId,
      speakerName,
      variety,
      emotion,
      voiceId,
      gender,
      pitch,
      rate,
      provider,
      elevenlabsVoiceId,
      elevenlabsSettings,
    };

    const activeProvider = getVoiceProvider(provider);
    const result = await activeProvider.synthesize(ttsOptions);

    return res.json({
      audioUrl: result.audioDataUrl,
      fallbackToBrowser: result.fallbackToBrowser,
      source: result.source,
      voiceName: result.voiceName,
      message: result.message,
    });
  } catch (err: any) {
    return res.status(200).json({
      fallbackToBrowser: true,
      source: "client_synthesis",
      message: "Síntesis gestionada por el navegador.",
    });
  }
});


function formatTurnOutput(parsed: any) {
  const worldDeltas = parsed.worldDeltas || {};
  const charResp = parsed.characterResponse || {
    speakerId: parsed.speakerId || "alejandro",
    speakerName: parsed.speakerName || "Alejandro",
    text: parsed.dialogue || parsed.text || "",
    emotion: parsed.emotion || "pensativo",
  };
  
  // Ensure voiceId is mapped explicitly if not provided
  if (!charResp.voiceId) {
    const sId = (charResp.speakerId || charResp.speakerName || "").toLowerCase();
    if (sId.includes("marta")) charResp.voiceId = "Kore";
    else if (sId.includes("carlos")) charResp.voiceId = "Puck";
    else if (sId.includes("alejandro")) charResp.voiceId = "Fenrir";
    else if (sId.includes("lucia") || sId.includes("lucía")) charResp.voiceId = "Kore";
    else if (sId.includes("marcos")) charResp.voiceId = "Puck";
    else if (sId.includes("tomas") || sId.includes("tomás") || sId.includes("don")) charResp.voiceId = "Charon";
    else if (sId.includes("rosa")) charResp.voiceId = "Aoede";
    else if (sId.includes("beto")) charResp.voiceId = "Puck";
    else if (sId.includes("narrator") || sId.includes("director") || sId.includes("mundo")) charResp.voiceId = "Zephyr";
  }

  let secResp = parsed.secondaryResponse || null;
  if (secResp && !secResp.voiceId) {
    const sId = (secResp.speakerId || secResp.speakerName || "").toLowerCase();
    if (sId.includes("marta")) secResp.voiceId = "Kore";
    else if (sId.includes("carlos")) secResp.voiceId = "Puck";
    else if (sId.includes("alejandro")) secResp.voiceId = "Fenrir";
    else if (sId.includes("lucia") || sId.includes("lucía")) secResp.voiceId = "Kore";
    else if (sId.includes("marcos")) secResp.voiceId = "Puck";
    else if (sId.includes("tomas") || sId.includes("tomás") || sId.includes("don")) secResp.voiceId = "Charon";
    else if (sId.includes("rosa")) secResp.voiceId = "Aoede";
    else if (sId.includes("beto")) secResp.voiceId = "Puck";
    else if (sId.includes("narrator") || sId.includes("director") || sId.includes("mundo")) secResp.voiceId = "Zephyr";
  }

  return {
    ...parsed,
    communicativeStrategy:
      parsed.communicativeStrategy || parsed.communicativeStrategyDetected || "Comunicación interactiva",
    narrativeEvent: parsed.narrativeEvent || parsed.narration || null,
    characterResponse: charResp,
    secondaryResponse: secResp,
    communicativeIntent: parsed.communicativeIntent || "proposal",
    worldChanges: parsed.worldChanges || {
      budgetDelta: worldDeltas.budgetDelta ?? 0,
      trustDelta: worldDeltas.trustDelta ?? 0,
      stressDelta: worldDeltas.stressDelta ?? 0,
      relationshipDelta: worldDeltas.relationshipDelta ?? 0,
      goalProgressDelta: worldDeltas.goalProgressDelta ?? 8,
      timeHourDelta: worldDeltas.timeHoursDelta ?? 1,
      newLocationId: worldDeltas.locationChangeId ?? null,
      description: parsed.consequenceSummary || "",
    },
    isMissionComplete: Boolean(parsed.endingTriggered || parsed.isMissionComplete),
  };
}

// ============================================================================
// FALLBACK INTELLIGENT SIMULATOR (Guarantees zero crashes & 100% playable demo)
// ============================================================================
function generateFallbackTurn(
  experience: any,
  worldState: any,
  studentInput: string,
  memories: any[],
  teacherIntervention?: any
) {
  const exp = experience || DEFAULT_EXPERIENCES[0];
  const state = worldState || exp.initialState || { goal_progress: 10 };
  const inputLower = (studentInput || "").toLowerCase();

  // Determine intent based on keywords
  const isBudgetFocus =
    inputLower.includes("hotel") ||
    inputLower.includes("dinero") ||
    inputLower.includes("pagar") ||
    inputLower.includes("presupuesto") ||
    inputLower.includes("precio") ||
    inputLower.includes("caro") ||
    inputLower.includes("barato");

  const isCarFocus =
    inputLower.includes("coche") ||
    inputLower.includes("gasolina") ||
    inputLower.includes("reparar") ||
    inputLower.includes("avería") ||
    inputLower.includes("humo") ||
    inputLower.includes("taller") ||
    inputLower.includes("mecánico");

  const isNegotiation =
    inputLower.includes("podríamos") ||
    inputLower.includes("y si") ||
    inputLower.includes("creo que") ||
    inputLower.includes("te propongo") ||
    inputLower.includes("de acuerdo") ||
    inputLower.includes("hablar");

  const isEmpathy =
    inputLower.includes("entiendo") ||
    inputLower.includes("tranquil") ||
    inputLower.includes("perdona") ||
    inputLower.includes("lo siento") ||
    inputLower.includes("gracias");

  let speakerId = "alejandro";
  let speakerName = "Alejandro";
  let dialogue = "";
  let emotion = "pensativo";
  let narration = "";
  let consequenceSummary = "";
  let budgetDelta = 0;
  let trustDelta = 5;
  let stressDelta = -5;
  let relationshipDelta = 5;
  let goalProgressDelta = 12;
  let newMemory: string | null = null;
  let locationChangeId: string | null = null;
  let secondaryResponse: any = null;
  let communicativeIntent: string = "proposal";

  if (teacherIntervention?.customEvent) {
    speakerId = "narrator";
    speakerName = "Director del Mundo";
    dialogue = `¡Acontecimiento imprevisto en ruta! ${teacherIntervention.customEvent}`;
    narration = "El profesor ha introducido una nueva variable que altera el rumbo del viaje.";
    stressDelta = 15;
    consequenceSummary = "Intervención del profesor: Nuevo desafío activo | Estrés: +15";
    communicativeIntent = "reaction";
  } else if (isBudgetFocus) {
    speakerId = "alejandro";
    speakerName = "Alejandro";
    emotion = "aliviado";
    dialogue =
      "Menos mal que alguien piensa con la cabeza. Si renegociamos eso o buscamos una opción más económica, aseguramos la vuelta.";
    narration =
      "Alejandro anota en su libreta con visible alivio. Lucía asiente ante tu sugerencia.";
    budgetDelta = 10;
    stressDelta = -10;
    trustDelta = 8;
    consequenceSummary = "Presupuesto protegido (+10 € margen) | Estrés de Alejandro: -10 | Confianza grupal: +8";
    newMemory = `El estudiante propuso vigilar el gasto y revisar el alojamiento con Don Tomás.`;
    secondaryResponse = {
      speakerId: "lucia",
      speakerName: "Lucía",
      text: "Totalmente de acuerdo, pero tampoco vayamos a dormir en cualquier sitio, ¿eh?",
      emotion: "animada",
    };
    communicativeIntent = "negotiation";
  } else if (isCarFocus) {
    speakerId = "marcos";
    speakerName = "Marcos";
    emotion = "aliviado";
    dialogue =
      "Oye, de verdad gracias por no agobiarte. Si paramos en el pueblo de San Millán revisamos el radiador con calma antes de subir.";
    narration =
      "El coche tose levemente al reducir marcha, pero Marcos respira aliviado con tu respaldo.";
    budgetDelta = -15;
    trustDelta = 12;
    relationshipDelta = 10;
    consequenceSummary = "Marcos gana confianza (+12) | Gasto en refrigerante: -15 € | Seguridad: +20%";
    newMemory = `El estudiante ayudó a Marcos con el problema del coche sin recriminarle.`;
    locationChangeId = "loc-pueblo";
    secondaryResponse = {
      speakerId: "alejandro",
      speakerName: "Alejandro",
      text: "Bueno, 15 euros en refrigerante es asumible. Vale la pena parar.",
      emotion: "pensativo",
    };
    communicativeIntent = "proposal";
  } else if (isNegotiation || isEmpathy) {
    speakerId = "lucia";
    speakerName = "Lucía";
    emotion = "animada";
    dialogue =
      "¡Ves! Hablando con calma se entiende todo el mundo. Me parece una propuesta estupenda para no discutir.";
    narration =
      "La tensión acumulada en el habitáculo se disuelve con naturalidad.";
    stressDelta = -15;
    relationshipDelta = 12;
    trustDelta = 10;
    consequenceSummary = "Consenso alcanzado | Estrés grupal: -15 | Cohesión del equipo: +12";
    newMemory = `El estudiante medió eficazmente con una propuesta conciliadora.`;
    secondaryResponse = {
      speakerId: "marcos",
      speakerName: "Marcos",
      text: "¡Así da gusto viajar con vosotros!",
      emotion: "aliviado",
    };
    communicativeIntent = "agreement";
  } else {
    speakerId = "marcos";
    speakerName = "Marcos";
    emotion = "pensativo";
    dialogue =
      "Vale, te he escuchado. Vamos a ver cómo reacciona Don Tomás cuando lleguemos a la casa rural.";
    narration =
      "El atardecer tiñe las cumbres de color cobrizo mientras el coche continúa avanzando por la comarcal.";
    stressDelta = 0;
    trustDelta = 5;
    consequenceSummary = "Decisión registrada | Progreso del viaje: +10%";
    newMemory = `El estudiante tomó la iniciativa en la toma de decisiones.`;
    communicativeIntent = "proposal";
  }

  const newProgress = Math.min(100, (state.goal_progress || 0) + goalProgressDelta);
  let endingTriggered: any = null;
  let endingReason: string | null = null;

  if (newProgress >= 90) {
    endingTriggered = "perfect";
    endingReason = "Habéis alcanzado el mirador con éxito, resolviendo los desacuerdos y cuidando al grupo.";
  }

  return {
    speakerId,
    speakerName,
    dialogue,
    emotion,
    narration,
    consequenceSummary,
    worldDeltas: {
      budgetDelta,
      trustDelta,
      stressDelta,
      relationshipDelta,
      goalProgressDelta,
      timeHoursDelta: 1,
      locationChangeId,
    },
    secondaryResponse,
    communicativeIntent,
    newMemory,
    triggeredEventTitle: null,
    communicativeStrategyDetected: isNegotiation
      ? "Negociación activa"
      : isEmpathy
        ? "Cortesía y mediación"
        : "Proactividad pragmática",
    endingTriggered,
    endingReason,
  };
}

function generateFallbackDebrief(finalState: any, turns: any[], experience: any) {
  const studentTurns = (turns || []).filter((t: any) => t.speaker === "student");
  const count = studentTurns.length;

  return {
    fluency: {
      summary:
        "Demostraste una notable capacidad para intervenir en los momentos clave de la conversación oral, expresando desacuerdo y propuestas con naturalidad.",
      positivePoints: [
        "Intervenciones orales contextualizadas que hicieron avanzar la trama.",
        "Manejo adecuado de marcadores conversacionales («bueno», «a ver», «podríamos», «y si...»).",
        "Capacidad de negociación oral bajo presión temporal y de recursos.",
      ],
    },
    linguisticResources: {
      vocabularyUsed: [
        "Alojamiento",
        "Presupuesto",
        "Avería",
        "Negociar",
        "Tranquilidad",
        "Alternativa",
      ],
      grammaticalStructures: [
        "Condicional de cortesía («Podríamos buscar...»)",
        "Estructuras de hipótesis («¿Y si vamos...?»)",
        "Perífrasis de obligación atenuada («Deberíamos hablar...»)",
      ],
    },
    communicativeEfficacy: {
      goalAchieved: (finalState?.goal_progress || 0) >= 50,
      outcomeDescription:
        "Lograste mantener al grupo unido y gestionar los recursos con tacto, evitando una ruptura entre los amigos.",
      successfulNegotiations: [
        "Acuerdo de ruta compartida",
        "Protección del presupuesto para combustible",
        "Mediación entre las posturas opuestas de Alejandro y Lucía",
      ],
    },
    interactionQuality: {
      adaptationToCharacters:
        "Supiste tranquilizar a Marcos respecto a su coche y responder a las exigencias numéricas de Alejandro sin perder la paciencia.",
      reactionToPressure:
        "Reaccionaste con templanza cuando surgieron contratiempos, priorizando la solución práctica sobre la queja.",
    },
    communicativeProfile: {
      fluencyScore: 86,
      interactionScore: 90,
      efficacyScore: 84,
      linguisticScore: 82,
      vocabularyScore: 85,
      overallAssessment:
        "Excelente desempeño oral: fuiste capaz de comunicarte con espontaneidad, adaptándote al registro grupal y alcanzando acuerdos en tiempo real.",
    },
    highlightMoments: [
      {
        quote: studentTurns[0]?.text || "Podríamos parar a revisar el coche y buscar una opción más barata.",
        context: "Momento de tensión en el coche por la temperatura del radiador y el gasto del alojamiento.",
        outcome: "Alejandro relajó la tensión del presupuesto y Marcos se sintió comprendido.",
        whyItWorked: "Utilizaste el condicional de cortesía para atenuar la orden y sugerir una solución de beneficio mutuo.",
      },
      {
        quote: studentTurns[1]?.text || "Hablemos con Don Tomás con calma.",
        context: "Frente a la posibilidad de conflicto con el dueño de la casa rural.",
        outcome: "El grupo aceptó negociar antes de tomar decisiones precipitadas.",
        whyItWorked: "Introdujiste una actitud mediadora mediante el imperativo de nosotros en registro cortés.",
      },
    ],
    improvementMoments: [
      {
        studentPhrase: "Yo quiero cambiar de hotel ahora.",
        nativeAlternative: "Quizá nos convendría mirar otro alojamiento más económico.",
        explanation:
          "En español oral, modular la asertividad mediante condicionales («nos convendría», «podríamos») resulta mucho más persuasivo en decisiones grupales.",
        communicativeContext: "Negociación del alojamiento rural",
      },
      {
        studentPhrase: "Dile a Don Tomás que no pagamos más.",
        nativeAlternative: "Será mejor que hablemos con Don Tomás con calma para explicarle nuestra situación.",
        explanation:
          "Con personas mayores en el ámbito rural español, el tratamiento cortés y justificado abre muchas más puertas que una negativa tajante.",
        communicativeContext: "Tratamiento intergeneracional y respeto pragmático",
      },
    ],
    pointsToImprove: [
      {
        type: "NATURALIDAD",
        studentPhrase: "Yo quiero cambiar de hotel ahora.",
        improvedPhrase: "Quizá nos convendría mirar otro alojamiento más económico.",
        explanation:
          "En español, modular la asertividad mediante condicionales («nos convendría», «podríamos») resulta mucho más persuasivo en decisiones grupales.",
      },
      {
        type: "REGISTRO",
        studentPhrase: "Dile a Don Tomás que no pagamos más.",
        improvedPhrase: "Será mejor que hablemos con Don Tomás con calma para explicarle nuestra situación.",
        explanation:
          "Con personas mayores en el ámbito rural español, el tratamiento cortés y justificado abre muchas más puertas que una negativa tajante.",
      },
      {
        type: "GRAMATICAL",
        studentPhrase: "Si tendríamos tiempo, vamos al pueblo.",
        improvedPhrase: "Si tuviéramos tiempo, iríamos al pueblo.",
        explanation:
          "En oraciones condicionales irreales o hipotéticas de nivel B1/B2, la prótasis se construye con pretérito imperfecto de subjuntivo («si tuviéramos»).",
      },
    ],
    earnedBadges: [
      {
        id: "negociador",
        title: "🏆 NEGOCIADOR",
        icon: "Handshake",
        description: "Encontraste un punto medio entre gastar y disfrutar.",
        unlocked: true,
      },
      {
        id: "pacificador",
        title: "🏆 PACIFICADOR",
        icon: "ShieldCheck",
        description: "Evitaste que la discusión entre Alejandro y Lucía escalase a mayores.",
        unlocked: true,
      },
      {
        id: "superviviente",
        title: "🏆 SUPERVIVIENTE LINGÜÍSTICO",
        icon: "Flame",
        description: "Resolviste imprevistos utilizando el español como tu principal herramienta de supervivencia.",
        unlocked: true,
      },
    ],
    ending: {
      type: (finalState?.goal_progress || 0) >= 80 ? "perfect" : "acceptable",
      title: (finalState?.goal_progress || 0) >= 80 ? "Armonía en las Cumbres (Final Perfecto)" : "Aventuras con Cicatrices (Final Aceptable)",
      description:
        "El viaje llegó a buen puerto gracias a tu capacidad de comunicación y empatía grupal.",
      finalSummary:
        "A pesar de los sustos con el coche y las cuentas ajustadas, los cuatro amigos brindáis al anochecer con la satisfacción de haber superado juntos el fin de semana.",
    },
  };
}

// ============================================================================
// VITE MIDDLEWARE SETUP
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SPANISH AS A SYSTEM] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
