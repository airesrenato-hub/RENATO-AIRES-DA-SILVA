import { SpanishVariety, VoiceId, Character, VoiceProvider, ResolvedCharacterVoice } from '../types';

export interface VoiceProfile {
  id: VoiceId;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  tag: string;
  description: string;
  defaultPitch: number;
  defaultRate: number;
  sampleText: string;
}

/**
 * Fallback voice used strictly when a character has no voice configuration
 * and cannot be matched to any known vocal identity.
 */
export const DEFAULT_VOICE: ResolvedCharacterVoice = {
  characterId: 'default',
  characterName: 'Voz General',
  provider: 'gemini',
  voiceId: 'Zephyr',
  gender: 'neutral',
  pitch: 1.0,
  rate: 1.0,
  isDefaultFallback: true,
};

/**
 * Registry of known character vocal identities.
 * Guarantees that even if only a characterId or name is passed,
 * every character gets its distinct, independent voice.
 */
export const KNOWN_CHARACTER_VOICES: Record<
  string,
  {
    name: string;
    gender: 'female' | 'male' | 'neutral';
    geminiVoiceId: VoiceId;
    elevenlabsVoiceId: string;
    pitch: number;
    rate: number;
  }
> = {
  marta: {
    name: 'Marta',
    gender: 'female',
    geminiVoiceId: 'Kore',
    elevenlabsVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella (femenina expresiva)
    pitch: 1.22,
    rate: 1.04,
  },
  carlos: {
    name: 'Carlos',
    gender: 'male',
    geminiVoiceId: 'Puck',
    elevenlabsVoiceId: 'VR6AewLTigWG4xSOukaG', // Arnold (masculina juvenil/analítica)
    pitch: 0.98,
    rate: 1.00,
  },
  alejandro: {
    name: 'Alejandro',
    gender: 'male',
    geminiVoiceId: 'Fenrir',
    elevenlabsVoiceId: 'ErXwobaYiN019PkySvjV', // Antoni (masculina serena)
    pitch: 0.95,
    rate: 0.97,
  },
  lucia: {
    name: 'Lucía',
    gender: 'female',
    geminiVoiceId: 'Kore',
    elevenlabsVoiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi (femenina animada)
    pitch: 1.18,
    rate: 1.02,
  },
  marcos: {
    name: 'Marcos',
    gender: 'male',
    geminiVoiceId: 'Puck',
    elevenlabsVoiceId: 'TxGEqnHWrfWFTfGW9XjX', // Josh (masculina mediadora)
    pitch: 1.06,
    rate: 1.03,
  },
  'don-tomas': {
    name: 'Don Tomás',
    gender: 'male',
    geminiVoiceId: 'Charon',
    elevenlabsVoiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel (masculina grave/veterana)
    pitch: 0.82,
    rate: 0.89,
  },
  beto: {
    name: 'Primo Beto',
    gender: 'male',
    geminiVoiceId: 'Puck',
    elevenlabsVoiceId: 'N2lVS1w4EtoT3dr4eOWO', // Callum (masculina enérgica)
    pitch: 1.05,
    rate: 1.04,
  },
  'dona-rosa': {
    name: 'Doña Rosa',
    gender: 'female',
    geminiVoiceId: 'Aoede',
    elevenlabsVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel (femenina cálida)
    pitch: 1.14,
    rate: 0.95,
  },
  narrator: {
    name: 'Narrador',
    gender: 'neutral',
    geminiVoiceId: 'Zephyr',
    elevenlabsVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam (narrativa neutra)
    pitch: 0.98,
    rate: 0.92,
  },
  system: {
    name: 'Sistema',
    gender: 'neutral',
    geminiVoiceId: 'Zephyr',
    elevenlabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
    pitch: 0.98,
    rate: 0.92,
  },
  event: {
    name: 'Acontecimiento',
    gender: 'neutral',
    geminiVoiceId: 'Zephyr',
    elevenlabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
    pitch: 0.98,
    rate: 0.92,
  },
};

/**
 * Centralized character voice resolver.
 * NEVER uses a global voice across characters.
 * Each character identity maps to its own voice configuration.
 */
export function getVoiceForCharacter(
  characterId: string,
  characters?: Character[],
  options?: Partial<PlayAudioOptions>
): ResolvedCharacterVoice {
  const cleanId = (characterId || '').toLowerCase().trim();

  // 1. Narrator / System / Event
  if (
    cleanId === 'narrator' ||
    cleanId === 'director' ||
    cleanId === 'system' ||
    cleanId === 'sistema' ||
    cleanId === 'event' ||
    cleanId === 'acontecimiento'
  ) {
    const provider: VoiceProvider = options?.provider || 'gemini';
    const voiceId =
      provider === 'elevenlabs'
        ? options?.elevenlabsVoiceId || 'pNInz6obpgDQGcFmaJgB'
        : 'Zephyr';
    return {
      characterId: 'narrator',
      characterName: options?.speakerName || 'Narrador',
      provider,
      voiceId,
      gender: 'neutral',
      pitch: options?.pitch ?? 0.98,
      rate: options?.rate ?? 0.92,
      isDefaultFallback: false,
    };
  }

  // 2. Lookup in passed characters list
  const char =
    characters?.find(
      (c) =>
        c.id.toLowerCase() === cleanId ||
        c.name.toLowerCase() === cleanId ||
        cleanId.includes(c.id.toLowerCase()) ||
        cleanId.includes(c.name.toLowerCase())
    ) || options?.character;

  if (char) {
    const provider: VoiceProvider =
      options?.provider ||
      char.voice?.provider ||
      char.voiceProfile?.provider ||
      'gemini';

    let voiceId =
      options?.voiceId ||
      options?.elevenlabsVoiceId ||
      char.voice?.voiceId ||
      char.voiceId;

    if (provider === 'elevenlabs') {
      if (
        !voiceId ||
        ['kore', 'puck', 'fenrir', 'charon', 'aoede', 'zephyr'].includes(
          String(voiceId).toLowerCase()
        )
      ) {
        const known = KNOWN_CHARACTER_VOICES[char.id.toLowerCase()];
        voiceId = known
          ? known.elevenlabsVoiceId
          : char.gender === 'female'
          ? '21m00Tcm4TlvDq8ikWAM'
          : 'ErXwobaYiN019PkySvjV';
      }
    } else {
      if (!voiceId) {
        const known = KNOWN_CHARACTER_VOICES[char.id.toLowerCase()];
        voiceId = known
          ? known.geminiVoiceId
          : char.gender === 'female'
          ? 'Kore'
          : 'Puck';
      }
    }

    const pitch =
      options?.pitch ??
      char.voice?.pitch ??
      char.voicePitch ??
      char.voiceProfile?.pitch ??
      (char.gender === 'female' ? 1.18 : 0.98);

    const rate =
      options?.rate ??
      char.voice?.speed ??
      char.voiceRate ??
      char.voiceProfile?.speed ??
      1.0;

    return {
      characterId: char.id,
      characterName: char.name,
      provider,
      voiceId: String(voiceId),
      gender: char.gender || 'neutral',
      pitch,
      rate,
      stability:
        char.voice?.stability ??
        char.voiceProfile?.elevenlabsSettings?.stability,
      similarity:
        char.voice?.similarity ??
        char.voiceProfile?.elevenlabsSettings?.similarity,
      style:
        char.voice?.style ?? char.voiceProfile?.elevenlabsSettings?.style,
      isDefaultFallback: false,
    };
  }

  // 3. Lookup in known character dictionary
  for (const [key, known] of Object.entries(KNOWN_CHARACTER_VOICES)) {
    if (cleanId.includes(key)) {
      const provider: VoiceProvider = options?.provider || 'gemini';
      const voiceId =
        provider === 'elevenlabs'
          ? options?.elevenlabsVoiceId || known.elevenlabsVoiceId
          : options?.voiceId || known.geminiVoiceId;

      return {
        characterId: key,
        characterName: options?.speakerName || known.name,
        provider,
        voiceId: String(voiceId),
        gender: known.gender,
        pitch: options?.pitch ?? known.pitch,
        rate: options?.rate ?? known.rate,
        isDefaultFallback: false,
      };
    }
  }

  // 4. If gender is specified or deduced, assign a distinct voice matching gender
  const isFemale =
    options?.gender === 'female' ||
    cleanId.includes('chica') ||
    cleanId.includes('mujer');
  const isElder =
    cleanId.includes('abuelo') ||
    cleanId.includes('anciano') ||
    cleanId.includes('don');

  const provider: VoiceProvider = options?.provider || DEFAULT_VOICE.provider;
  let voiceId: string = options?.voiceId || DEFAULT_VOICE.voiceId;
  let gender: 'female' | 'male' | 'neutral' = options?.gender || 'neutral';
  let pitch = options?.pitch ?? 1.0;
  let rate = options?.rate ?? 1.0;

  if (isFemale) {
    gender = 'female';
    voiceId =
      provider === 'elevenlabs'
        ? '21m00Tcm4TlvDq8ikWAM'
        : isElder
        ? 'Aoede'
        : 'Kore';
    pitch = isElder ? 1.12 : 1.18;
  } else if (gender === 'male' || cleanId.includes('chico') || cleanId.includes('joven')) {
    gender = 'male';
    voiceId =
      provider === 'elevenlabs'
        ? 'ErXwobaYiN019PkySvjV'
        : isElder
        ? 'Charon'
        : 'Puck';
    pitch = isElder ? 0.82 : 1.04;
  }

  return {
    characterId: cleanId || 'unknown',
    characterName: options?.speakerName || 'Personaje',
    provider,
    voiceId,
    gender,
    pitch,
    rate,
    isDefaultFallback: true,
  };
}

// Real-time Voice Debug event bus
export interface VoiceDebugInfo {
  timestamp: number;
  characterId: string;
  characterName: string;
  provider: VoiceProvider;
  voiceId: string;
  gender: string;
  pitch: number;
  rate: number;
  text: string;
  status: 'playing' | 'ended' | 'error';
  source?: string;
}

let activeVoiceResolution: VoiceDebugInfo | null = null;
const voiceDebugHistory: VoiceDebugInfo[] = [];
const voiceDebugListeners = new Set<(info: VoiceDebugInfo) => void>();

export function getActiveVoiceResolution(): VoiceDebugInfo | null {
  return activeVoiceResolution;
}

export function getVoiceDebugHistory(): VoiceDebugInfo[] {
  return [...voiceDebugHistory];
}

export function subscribeVoiceDebug(
  listener: (info: VoiceDebugInfo) => void
): () => void {
  voiceDebugListeners.add(listener);
  return () => {
    voiceDebugListeners.delete(listener);
  };
}

export function notifyVoiceDebug(info: VoiceDebugInfo) {
  activeVoiceResolution = info;
  if (info.status === 'playing') {
    voiceDebugHistory.unshift(info);
    if (voiceDebugHistory.length > 30) voiceDebugHistory.pop();
  }
  voiceDebugListeners.forEach((fn) => {
    try {
      fn(info);
    } catch {
      // Ignore listener error
    }
  });
}

// Client-side in-memory audio cache: characterId + voiceId + text
const clientAudioMemoryCache = new Map<string, ArrayBuffer>();

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'female',
    tag: 'Femenina Expresiva',
    description: 'Ágil, melódica y enérgica, ideal para personajes dinámicos y jóvenes.',
    defaultPitch: 1.18,
    defaultRate: 1.02,
    sampleText: '¡Venga ya! Que esto se pone emocionante y no podemos perder el tiempo.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'male',
    tag: 'Masculino Juvenil',
    description: 'Fresco, dinámico y bromista, perfecto para amigos y cómplices de viaje.',
    defaultPitch: 1.06,
    defaultRate: 1.04,
    sampleText: 'Tranquilos todos, que mientras el coche aguante tenemos aventura para rato.',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'female',
    tag: 'Femenina Cálida',
    description: 'Cálida, pausada y madura, idónea para mentoras, dueñas de puestos o figuras serenas.',
    defaultPitch: 1.12,
    defaultRate: 0.95,
    sampleText: 'Pasa adelante con confianza, aquí todo se hace con paciencia y buen agrado.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'male',
    tag: 'Masculino Sereno',
    description: 'Equilibrado, pragmático y sensato, idóneo para organizadores y mediadores.',
    defaultPitch: 0.95,
    defaultRate: 0.98,
    sampleText: 'Hagamos números antes de tomar cualquier decisión precipitada.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'male',
    tag: 'Masculino Grave',
    description: 'Autoritario, veterano y profundo, para figuras de respeto, ancianos o anfitriones severos.',
    defaultPitch: 0.82,
    defaultRate: 0.89,
    sampleText: 'Miren ustedes, en esta casa las normas se respetan desde el primer minuto.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'male',
    tag: 'Voz Narrativa',
    description: 'Clara, neutra y cinematográfica, idónea para el narrador y la crónica ambiental.',
    defaultPitch: 1.00,
    defaultRate: 1.00,
    sampleText: 'El sol cae sobre las colinas y el camino comienza a estrecharse.',
  },
];

export function getVarietyLangCode(variety: SpanishVariety): string {
  switch (variety) {
    case 'mexico':
      return 'es-MX';
    case 'argentina':
      return 'es-AR';
    case 'colombia':
      return 'es-CO';
    case 'chile':
      return 'es-CL';
    case 'peru':
      return 'es-PE';
    case 'spain':
    default:
      return 'es-ES';
  }
}

// Global active audio state
let globalAudioCtx: AudioContext | null = null;
let globalSharedAudio: HTMLAudioElement | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeAudioElement: HTMLAudioElement | null = null;
let speechWatchdogTimer: any = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let isAudioPipelinePrimed = false;

// 1-sample silent WAV (RIFF standard header + 2 bytes PCM zero)
const SILENT_WAV_BASE64 =
  'UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
const SILENT_WAV_DATA_URL = `data:audio/wav;base64,${SILENT_WAV_BASE64}`;

/**
 * Returns or initializes the shared Web Audio API context
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      globalAudioCtx = new AudioContextClass();
    }
  }
  return globalAudioCtx;
}

/**
 * Returns or initializes the single shared HTML5 Audio element for mobile compatibility
 */
export function getSharedAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!globalSharedAudio) {
    globalSharedAudio = new Audio();
    globalSharedAudio.setAttribute('playsinline', 'true');
    globalSharedAudio.setAttribute('webkit-playsinline', 'true');
    globalSharedAudio.preload = 'auto';
  }
  return globalSharedAudio;
}

/**
 * CRITICAL FOR MOBILE:
 * Synchronously primes and unlocks audio on iOS Safari and Android Chrome during a user gesture.
 * When called inside touchstart, click, or pointerdown, it permanently activates the audio session.
 */
export function unlockMobileAudio() {
  if (typeof window === 'undefined') return;

  // 1. Unlock Web Audio API context
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (ctx.state === 'running' && !isAudioPipelinePrimed) {
        // Play an inaudible pulse to warm up the mobile hardware audio mixer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.00001; // inaudible
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        osc.stop(ctx.currentTime + 0.005);
        isAudioPipelinePrimed = true;
      }
    }
  } catch (e) {
    // Ignore
  }

  // 2. Unlock HTML5 Audio element
  try {
    const audio = getSharedAudioElement();
    if (audio && audio.paused && !audio.src) {
      audio.src = SILENT_WAV_DATA_URL;
      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          audio.pause();
        }).catch(() => {});
      }
    }
  } catch (e) {
    // Ignore
  }

  // 3. Unlock SpeechSynthesis for mobile WebKit
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  } catch (e) {
    // Ignore
  }
}

// Auto-register touch/click unlockers on window
if (typeof window !== 'undefined') {
  const onMobileUserInteraction = () => {
    unlockMobileAudio();
  };
  window.addEventListener('touchstart', onMobileUserInteraction, { passive: true });
  window.addEventListener('touchend', onMobileUserInteraction, { passive: true });
  window.addEventListener('click', onMobileUserInteraction, { passive: true });
  window.addEventListener('pointerdown', onMobileUserInteraction, { passive: true });
}

// Preload browser speech voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
    } catch {
      // Ignore in restricted environments
    }
  };
  updateVoices();
  window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
}

/**
 * Finds the best voice for a character available in the client operating system/browser,
 * matching character gender and distributing different characters across available Spanish voices.
 */
export function findBestCharacterVoice(
  variety: SpanishVariety,
  options?: PlayAudioOptions
): SpeechSynthesisVoice | null {
  if (!cachedVoices || cachedVoices.length === 0) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      cachedVoices = window.speechSynthesis.getVoices();
    }
  }
  if (!cachedVoices || cachedVoices.length === 0) return null;

  const targetLang = getVarietyLangCode(variety).toLowerCase();
  const langPrefix = targetLang.substring(0, 2); // "es"

  // 1. Collect all Spanish voices installed in device
  const spanishVoices = cachedVoices.filter((v) => {
    const l = v.lang.toLowerCase();
    const n = v.name.toLowerCase();
    return (
      l.startsWith(`${langPrefix}-`) ||
      l.startsWith(`${langPrefix}_`) ||
      l === langPrefix ||
      n.includes('spanish') ||
      n.includes('español') ||
      n.includes('castellano')
    );
  });

  if (spanishVoices.length === 0) {
    return cachedVoices.find((v) => v.default) || null;
  }

  if (spanishVoices.length === 1) {
    return spanishVoices[0];
  }

  const combined = `${options?.speakerId || ''} ${options?.speakerName || ''}`.toLowerCase();
  const isFemale =
    options?.gender === 'female' ||
    options?.character?.gender === 'female' ||
    options?.voiceId === 'Kore' ||
    options?.voiceId === 'Aoede' ||
    combined.includes('lucia') ||
    combined.includes('lucía') ||
    combined.includes('rosa') ||
    combined.includes('mujer') ||
    combined.includes('chica') ||
    combined.includes('madre') ||
    combined.includes('dona') ||
    combined.includes('doña') ||
    combined.includes('senora') ||
    combined.includes('señora') ||
    combined.includes('camarera') ||
    combined.includes('elena') ||
    combined.includes('carmen') ||
    combined.includes('sofia') ||
    combined.includes('sofía') ||
    combined.includes('camila') ||
    combined.includes('valeria');

  // Female and Male voice identifier keywords common across OS/browsers
  const femaleVoiceKeywords = [
    'monica',
    'mónica',
    'paulina',
    'helena',
    'laura',
    'francisca',
    'soledad',
    'lucia',
    'lucía',
    'rosa',
    'elena',
    'female',
    'sabina',
    'paloma',
    'carmen',
    'inés'
  ];
  const maleVoiceKeywords = [
    'jorge',
    'juan',
    'diego',
    'carlos',
    'pablo',
    'manuel',
    'male',
    'miguel',
    'raul',
    'raúl',
    'enrique',
    'alvaro',
    'álvaro'
  ];

  const femaleVoices = spanishVoices.filter((v) =>
    femaleVoiceKeywords.some((k) => v.name.toLowerCase().includes(k))
  );
  const maleVoices = spanishVoices.filter((v) =>
    maleVoiceKeywords.some((k) => v.name.toLowerCase().includes(k))
  );

  let candidatePool = spanishVoices;
  if (isFemale && femaleVoices.length > 0) {
    candidatePool = femaleVoices;
  } else if (!isFemale && maleVoices.length > 0) {
    candidatePool = maleVoices;
  }

  // Deterministically distribute distinct voices based on character identity
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) >>> 0;
  }

  return candidatePool[hash % candidatePool.length];
}

/**
 * Backward compatibility alias for finding best Spanish voice
 */
export function findBestSpanishVoice(variety: SpanishVariety): SpeechSynthesisVoice | null {
  return findBestCharacterVoice(variety);
}

/**
 * Play pleasant acoustic chime via Web Audio API to confirm sound is active
 */
export function playTestTone() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch (e) {
    console.warn('Test tone error:', e);
  }
}

/**
 * Helper to convert base64 string or data URL to ArrayBuffer safely
 */
function base64ToArrayBuffer(base64OrDataUrl: string): ArrayBuffer {
  const cleanBase64 = base64OrDataUrl.replace(/^data:[^;]+;base64,/, '');
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Robust audio decoding supporting modern Promise API and older WebKit callbacks
 */
function decodeAudioDataSafe(ctx: AudioContext, buffer: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const res = ctx.decodeAudioData(
      buffer,
      (decoded) => resolve(decoded),
      (err) => reject(err)
    );
    if (res && typeof (res as any).then === 'function') {
      (res as any).then(resolve).catch(reject);
    }
  });
}

/**
 * Stop all ongoing audio immediately (Web Audio API, HTML5 audio, and browser speech synthesis)
 */
export function stopAllAudio() {
  if (speechWatchdogTimer) {
    clearInterval(speechWatchdogTimer);
    speechWatchdogTimer = null;
  }

  // 1. Stop active Web Audio API source node
  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch {
      // Ignore
    }
    activeSourceNode = null;
  }

  // 2. Stop HTMLAudioElement
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement.src = '';
    } catch {
      // Ignore
    }
    activeAudioElement = null;
  }

  if (globalSharedAudio) {
    try {
      globalSharedAudio.pause();
      globalSharedAudio.currentTime = 0;
    } catch {
      // Ignore
    }
  }

  // 3. Cancel SpeechSynthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

export interface PlayAudioOptions {
  speakerId?: string;
  speakerName?: string;
  variety?: SpanishVariety;
  emotion?: string;
  voiceId?: VoiceId | string;
  gender?: 'male' | 'female' | 'neutral';
  pitch?: number;
  rate?: number;
  character?: Character;
  characters?: Character[];
  provider?: VoiceProvider;
  elevenlabsVoiceId?: string;
  elevenlabsSettings?: {
    stability?: number;
    similarity?: number;
    style?: number;
    speed?: number;
  };
  onStart?: () => void;
  onEnd?: () => void;
  onInterrupted?: () => void;
  onError?: (err: any) => void;
}

/**
 * Returns true if audio is currently playing across Web Audio, HTML5 Audio, or SpeechSynthesis
 */
export function isAudioPlaying(): boolean {
  if (activeSourceNode !== null) return true;
  if (activeAudioElement !== null && !activeAudioElement.paused) return true;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

/**
 * Interrupts any ongoing audio playback immediately (e.g., when the user begins speaking)
 */
export function stopActiveAudio(): void {
  stopAllAudio();
}

/**
 * Robust fallback using the browser's native SpeechSynthesis API
 * Solves Chrome's cancellation race condition and 14-second pause bug
 * Modulates acoustic pitch, speed, and voice allocation per character
 */
export function speakWithBrowserSpeech(
  text: string,
  variety: SpanishVariety = 'spain',
  options?: PlayAudioOptions
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options?.onError?.(new Error('Speech synthesis not supported in this browser'));
    return;
  }

  stopAllAudio();

  const resolved = getVoiceForCharacter(
    options?.speakerId || options?.character?.id || '',
    options?.characters,
    options
  );

  // Chrome/Safari fix: Brief timeout after cancel before initiating speak
  setTimeout(() => {
    try {
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = getVarietyLangCode(variety);
      utterance.lang = langCode;

      // Determine acoustic pitch and rate strictly from character identity
      const resolvedPitch = options?.pitch ?? resolved.pitch ?? 1.0;
      const resolvedRate = options?.rate ?? resolved.rate ?? 1.0;

      utterance.pitch = Math.max(0.75, Math.min(1.35, resolvedPitch));
      utterance.rate = Math.max(0.85, Math.min(1.15, resolvedRate));

      // Assign distinctive Spanish voice matching character
      const voice = findBestCharacterVoice(variety, {
        ...options,
        gender: resolved.gender,
        voiceId: resolved.voiceId as VoiceId,
        speakerId: resolved.characterId,
        speakerName: resolved.characterName,
      });
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        notifyVoiceDebug({
          timestamp: Date.now(),
          characterId: resolved.characterId,
          characterName: resolved.characterName,
          provider: 'browser',
          voiceId: voice?.name || resolved.voiceId,
          gender: resolved.gender,
          pitch: utterance.pitch,
          rate: utterance.rate,
          text,
          status: 'playing',
          source: 'browser_speech',
        });
        options?.onStart?.();

        // Chrome 14-second freeze watchdog
        if (speechWatchdogTimer) clearInterval(speechWatchdogTimer);
        speechWatchdogTimer = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.resume();
          } else {
            clearInterval(speechWatchdogTimer);
            speechWatchdogTimer = null;
          }
        }, 4000);
      };

      utterance.onend = () => {
        if (speechWatchdogTimer) {
          clearInterval(speechWatchdogTimer);
          speechWatchdogTimer = null;
        }
        notifyVoiceDebug({
          timestamp: Date.now(),
          characterId: resolved.characterId,
          characterName: resolved.characterName,
          provider: 'browser',
          voiceId: voice?.name || resolved.voiceId,
          gender: resolved.gender,
          pitch: utterance.pitch,
          rate: utterance.rate,
          text,
          status: 'ended',
          source: 'browser_speech',
        });
        options?.onEnd?.();
      };

      utterance.onerror = (e) => {
        if (speechWatchdogTimer) {
          clearInterval(speechWatchdogTimer);
          speechWatchdogTimer = null;
        }
        if (e.error === 'canceled' || e.error === 'interrupted') {
          notifyVoiceDebug({
            timestamp: Date.now(),
            characterId: resolved.characterId,
            characterName: resolved.characterName,
            provider: 'browser',
            voiceId: voice?.name || resolved.voiceId,
            gender: resolved.gender,
            pitch: utterance.pitch,
            rate: utterance.rate,
            text,
            status: 'ended',
            source: 'browser_interrupted',
          });
          options?.onInterrupted?.();
          return;
        }
        notifyVoiceDebug({
          timestamp: Date.now(),
          characterId: resolved.characterId,
          characterName: resolved.characterName,
          provider: 'browser',
          voiceId: voice?.name || resolved.voiceId,
          gender: resolved.gender,
          pitch: utterance.pitch,
          rate: utterance.rate,
          text,
          status: 'error',
          source: 'browser_error',
        });
        options?.onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Failed to speak with browser synthesis:', err);
      options?.onError?.(err);
      options?.onEnd?.();
    }
  }, 60);
}

/**
 * Mobile-Optimized Audio Engine:
 * 1. Resolves explicit character identity (CHARACTER A -> VOICE A)
 * 2. Caches audio with composite key: characterId + voiceId + text
 * 3. Plays via Web Audio API (AudioBufferSourceNode)
 * 4. Dispatches real-time events to Voice Debug bus
 */
export async function playDialogueAudio(text: string, options?: PlayAudioOptions): Promise<() => void> {
  // Clear any existing playback
  stopAllAudio();

  // Prime audio immediately inside the user gesture
  unlockMobileAudio();

  const variety = options?.variety || 'spain';
  const speakerKey = options?.speakerId || options?.character?.id || 'alejandro';

  // 1. Explicit character voice resolution:
  const resolved = getVoiceForCharacter(speakerKey, options?.characters, options);

  console.log(
    `[VOICE] characterId = ${resolved.characterId} | voiceId = ${resolved.voiceId} | provider = ${resolved.provider} | text = "${text.substring(0, 35)}"`
  );

  let isCancelled = false;
  let localBlobUrl: string | null = null;

  const cancelPlayback = () => {
    isCancelled = true;
    stopAllAudio();
    if (localBlobUrl) {
      try {
        URL.revokeObjectURL(localBlobUrl);
      } catch {}
      localBlobUrl = null;
    }
    notifyVoiceDebug({
      timestamp: Date.now(),
      characterId: resolved.characterId,
      characterName: resolved.characterName,
      provider: resolved.provider,
      voiceId: resolved.voiceId,
      gender: resolved.gender,
      pitch: resolved.pitch,
      rate: resolved.rate,
      text,
      status: 'ended',
      source: 'cancelled',
    });
    options?.onInterrupted?.();
  };

  // 2. Audio caching with composite key: characterId + voiceId + pitch + rate + text
  const clientCacheKey = `${resolved.provider}:${resolved.characterId}:${resolved.voiceId}:${resolved.pitch.toFixed(2)}:${resolved.rate.toFixed(2)}:${text.trim()}`;

  const playDecodedBuffer = async (arrayBuffer: ArrayBuffer, sourceName: string) => {
    const ctx = getAudioContext();
    if (ctx) {
      try {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const audioBuffer = await decodeAudioDataSafe(ctx, arrayBuffer.slice(0));
        if (isCancelled) return cancelPlayback;

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        activeSourceNode = source;

        notifyVoiceDebug({
          timestamp: Date.now(),
          characterId: resolved.characterId,
          characterName: resolved.characterName,
          provider: resolved.provider,
          voiceId: resolved.voiceId,
          gender: resolved.gender,
          pitch: resolved.pitch,
          rate: resolved.rate,
          text,
          status: 'playing',
          source: sourceName,
        });

        source.onended = () => {
          if (activeSourceNode === source) {
            activeSourceNode = null;
          }
          notifyVoiceDebug({
            timestamp: Date.now(),
            characterId: resolved.characterId,
            characterName: resolved.characterName,
            provider: resolved.provider,
            voiceId: resolved.voiceId,
            gender: resolved.gender,
            pitch: resolved.pitch,
            rate: resolved.rate,
            text,
            status: 'ended',
            source: sourceName,
          });
          options?.onEnd?.();
        };

        source.start(0);
        options?.onStart?.();
        return cancelPlayback;
      } catch (webAudioErr) {
        console.warn('Web Audio API playback failed, trying HTML5 Audio fallback:', webAudioErr);
      }
    }

    // HTMLAudioElement Fallback
    if (isCancelled) return cancelPlayback;
    try {
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      localBlobUrl = URL.createObjectURL(blob);

      const audio = getSharedAudioElement() || new Audio();
      activeAudioElement = audio;
      audio.src = localBlobUrl;

      notifyVoiceDebug({
        timestamp: Date.now(),
        characterId: resolved.characterId,
        characterName: resolved.characterName,
        provider: resolved.provider,
        voiceId: resolved.voiceId,
        gender: resolved.gender,
        pitch: resolved.pitch,
        rate: resolved.rate,
        text,
        status: 'playing',
        source: 'html5_audio',
      });

      audio.onplaying = () => {
        if (!isCancelled) options?.onStart?.();
      };

      audio.onended = () => {
        if (activeAudioElement === audio) {
          activeAudioElement = null;
        }
        if (localBlobUrl) {
          URL.revokeObjectURL(localBlobUrl);
          localBlobUrl = null;
        }
        notifyVoiceDebug({
          timestamp: Date.now(),
          characterId: resolved.characterId,
          characterName: resolved.characterName,
          provider: resolved.provider,
          voiceId: resolved.voiceId,
          gender: resolved.gender,
          pitch: resolved.pitch,
          rate: resolved.rate,
          text,
          status: 'ended',
          source: 'html5_audio',
        });
        options?.onEnd?.();
      };

      audio.onerror = (e) => {
        console.warn('HTML5 Audio error, falling back to speech synthesis:', e);
        if (localBlobUrl) {
          URL.revokeObjectURL(localBlobUrl);
          localBlobUrl = null;
        }
        if (activeAudioElement === audio) activeAudioElement = null;
        speakWithBrowserSpeech(text, variety, options);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      return cancelPlayback;
    } catch (audioElErr) {
      console.warn('HTMLAudioElement play() rejected:', audioElErr);
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
        localBlobUrl = null;
      }
      speakWithBrowserSpeech(text, variety, options);
      return cancelPlayback;
    }
  };

  // Check client memory cache first
  if (clientAudioMemoryCache.has(clientCacheKey)) {
    const cachedBuffer = clientAudioMemoryCache.get(clientCacheKey)!;
    return playDecodedBuffer(cachedBuffer, 'client_cache');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const res = await fetch('/api/simulation/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        speakerId: resolved.characterId,
        speakerName: resolved.characterName,
        variety,
        emotion: options?.emotion || options?.character?.currentEmotion,
        voiceId: resolved.voiceId,
        gender: resolved.gender,
        pitch: resolved.pitch,
        rate: resolved.rate,
        provider: resolved.provider,
        elevenlabsVoiceId: resolved.provider === 'elevenlabs' ? resolved.voiceId : options?.elevenlabsVoiceId,
        elevenlabsSettings: {
          stability: resolved.stability,
          similarity: resolved.similarity,
          style: resolved.style,
          speed: resolved.rate,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (isCancelled) return cancelPlayback;

    if (res.ok) {
      const data = await res.json();
      if (data.audioUrl && !data.fallbackToBrowser) {
        const arrayBuffer = base64ToArrayBuffer(data.audioUrl);
        // Save in client memory cache
        if (clientAudioMemoryCache.size > 80) {
          const firstKey = clientAudioMemoryCache.keys().next().value;
          if (firstKey) clientAudioMemoryCache.delete(firstKey);
        }
        clientAudioMemoryCache.set(clientCacheKey, arrayBuffer.slice(0));

        return playDecodedBuffer(arrayBuffer, data.source || 'server_tts');
      }
    }
  } catch (e: any) {
    if (isCancelled) return cancelPlayback;
  }

  // Fallback to browser SpeechSynthesis with distinct character pitch & voice
  speakWithBrowserSpeech(text, variety, {
    ...options,
    speakerId: resolved.characterId,
    speakerName: resolved.characterName,
    voiceId: resolved.voiceId as VoiceId,
    pitch: resolved.pitch,
    rate: resolved.rate,
    gender: resolved.gender,
  });
  return cancelPlayback;
}

/**
 * Plays a multi-character dialogue sequentially.
 * Each speaker is spoken with their own independent voice.
 * Never merges different characters into a single generic audio stream.
 */
export async function playMultiCharacterDialogue(
  segments: Array<{
    text: string;
    characterId: string;
    characterName?: string;
    emotion?: string;
    voiceId?: string;
  }>,
  characters?: Character[],
  options?: Partial<PlayAudioOptions>
): Promise<() => void> {
  let isCancelled = false;
  let currentCancel: (() => void) | null = null;

  const cancelAll = () => {
    isCancelled = true;
    if (currentCancel) {
      currentCancel();
      currentCancel = null;
    }
    stopAllAudio();
    options?.onInterrupted?.();
  };

  (async () => {
    for (const segment of segments) {
      if (isCancelled) break;
      if (!segment.text || !segment.text.trim()) continue;

      await new Promise<void>((resolve) => {
        playDialogueAudio(segment.text, {
          ...options,
          speakerId: segment.characterId,
          speakerName: segment.characterName,
          emotion: segment.emotion,
          voiceId: segment.voiceId as VoiceId,
          characters,
          onStart: () => {
            options?.onStart?.();
          },
          onEnd: () => {
            resolve();
          },
          onError: (err) => {
            options?.onError?.(err);
            resolve();
          },
          onInterrupted: () => {
            resolve();
          },
        }).then((canceller) => {
          currentCancel = canceller;
        });
      });

      // Brief conversational breath between distinct speakers
      if (!isCancelled) {
        await new Promise((r) => setTimeout(r, 220));
      }
    }

    if (!isCancelled) {
      options?.onEnd?.();
    }
  })();

  return cancelAll;
}

/**
 * Backward-compatible helper for existing code
 */
export function speakSpanishText(
  text: string,
  variety: SpanishVariety = 'spain',
  _pitch: number = 1,
  _rate: number = 1.0,
  speakerId: string = 'alejandro'
) {
  playDialogueAudio(text, { variety, speakerId });
}

/**
 * Cleans spoken transcripts from accidental runaway loops,
 * consecutive phrase echoes, or repeated interim speech recognition segments.
 */
export function deduplicateSpokenText(text: string): string {
  if (!text) return '';
  let clean = text.trim();

  // 1. Collapse multiple repeated identical sentences or long phrase sequences:
  // e.g. "hola qué tal hola qué tal" -> "hola qué tal"
  const words = clean.split(/\s+/);
  if (words.length >= 4) {
    for (let patternLen = Math.floor(words.length / 2); patternLen >= 2; patternLen--) {
      let hasRepetition = true;
      let matched = false;
      let iterations = 0;
      while (hasRepetition && iterations < 50) {
        iterations++;
        hasRepetition = false;
        for (let i = 0; i <= words.length - 2 * patternLen; i++) {
          const sliceA = words.slice(i, i + patternLen).join(' ').toLowerCase();
          const sliceB = words.slice(i + patternLen, i + 2 * patternLen).join(' ').toLowerCase();
          if (sliceA === sliceB) {
            words.splice(i + patternLen, patternLen);
            hasRepetition = true;
            matched = true;
            break;
          }
        }
      }
      if (matched) {
        clean = words.join(' ');
      }
    }
  }

  // 2. Collapse immediate duplicate words (supports accented Spanish characters): "hola hola" -> "hola", "estás estás" -> "estás"
  clean = clean.replace(/(?:^|\s)([\p{L}\p{N}]+)\s+\1(?=$|\s)/giu, ' $1');

  return clean.trim();
}

/**
 * Speech Recognition helper with browser fallback
 */
export interface SpeechRecognitionResultHandler {
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export function createSpeechRecognizer(variety: SpanishVariety = 'spain') {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognizer = new SpeechRecognition();
  recognizer.continuous = false;
  recognizer.interimResults = true;
  recognizer.lang = getVarietyLangCode(variety);

  return recognizer;
}

/**
 * Interactive preview of a specific character voice
 */
export function previewVoice(
  voiceId: VoiceId,
  variety: SpanishVariety = 'spain',
  customSample?: string
): Promise<() => void> {
  const profile = VOICE_PROFILES.find((p) => p.id === voiceId) || VOICE_PROFILES[0];
  const sample = customSample || profile.sampleText;

  return playDialogueAudio(sample, {
    variety,
    voiceId: profile.id,
    gender: profile.gender,
    pitch: profile.defaultPitch,
    rate: profile.defaultRate,
    speakerName: profile.name,
    speakerId: profile.id.toLowerCase(),
  });
}
