export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type SpanishVariety =
  | 'spain'
  | 'mexico'
  | 'argentina'
  | 'colombia'
  | 'chile'
  | 'peru'
  | 'international';

export type EndingType =
  | 'perfect'
  | 'acceptable'
  | 'chaotic'
  | 'disastrous'
  | 'unexpected';

export type VoiceId =
  | 'Kore'    // Femenina expresiva y dinámica
  | 'Puck'    // Masculina juvenil y enérgica
  | 'Fenrir'  // Masculina equilibrada y serena
  | 'Charon'  // Masculina grave y madura
  | 'Zephyr'  // Neutra, clara y narrativa
  | 'Aoede';  // Femenina cálida y pausada

export type VoiceProvider = 'gemini' | 'elevenlabs' | 'browser';

export type CommunicativeIntent =
  | 'request'
  | 'refusal'
  | 'agreement'
  | 'disagreement'
  | 'proposal'
  | 'negotiation'
  | 'apology'
  | 'complaint'
  | 'clarification'
  | 'persuasion'
  | 'question'
  | 'explanation'
  | 'narration'
  | 'reaction'
  | 'uncertainty'
  | 'acceptance'
  | 'rejection';

export interface CharacterVoiceConfig {
  provider: VoiceProvider;
  voiceId: string; // 'Kore' | 'Puck' | 'Fenrir' | 'Charon' | 'Zephyr' | 'Aoede' or ElevenLabs voiceId
  stability?: number;
  similarity?: number;
  speed?: number;
  pitch?: number;
  style?: number;
}

export interface ResolvedCharacterVoice {
  characterId: string;
  characterName: string;
  provider: VoiceProvider;
  voiceId: string;
  gender: 'male' | 'female' | 'neutral';
  pitch: number;
  rate: number;
  stability?: number;
  similarity?: number;
  style?: number;
  isDefaultFallback?: boolean;
}

export interface CharacterVoiceProfile {
  approxAge: number;
  energy: 'alta' | 'media' | 'pausada' | 'calma';
  speed: number; // 0.80 to 1.30
  pitch: number; // 0.75 to 1.35
  expressiveness: 'muy expresiva' | 'moderada' | 'seca' | 'cálida';
  tendencyToInterrupt: 'alta' | 'media' | 'baja' | 'nunca';
  pauses: 'frecuentes' | 'normales' | 'escasas';
  confidence: 'seguro' | 'dubitativo' | 'autoritario' | 'nervioso';
  humor: 'sarcástico' | 'afable' | 'serio' | 'bromista';
  register: 'coloquial' | 'formal' | 'neutro';
  provider?: VoiceProvider;
  elevenlabsVoiceId?: string;
  elevenlabsSettings?: {
    stability?: number;
    similarity?: number;
    style?: number;
    speed?: number;
  };
}

export interface Character {
  id: string;
  name: string;
  avatar: string;
  role: string;
  personality: string;
  goal: string;
  relationshipWithPlayer: number; // -100 to 100
  trust: number; // 0 to 100
  stress: number; // 0 to 100
  currentEmotion: string;
  speechStyle: string;
  register: 'coloquial' | 'formal' | 'neutro';
  gender?: 'male' | 'female' | 'neutral';
  voiceId?: VoiceId;
  voicePitch?: number; // Pitch multiplier (e.g. 0.80 to 1.30)
  voiceRate?: number;  // Speed multiplier (e.g. 0.85 to 1.15)
  voiceProfile?: CharacterVoiceProfile;
  voice?: CharacterVoiceConfig;
  knownInfo: string[];
  secrets: string[];
  limits: string[];
}

export interface Location {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  isCurrent: boolean;
  coordinates?: { x: number; y: number };
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  isMain: boolean;
  completed: boolean;
  progressPercent: number;
}

export interface DynamicEvent {
  id: string;
  title: string;
  description: string;
  triggerCondition: string;
  consequencesText: string;
  applied: boolean;
  impact?: {
    budgetDelta?: number;
    stressDelta?: number;
    trustDelta?: number;
    relationshipDelta?: number;
    timeDeltaHours?: number;
  };
}

export interface WorldVariables {
  budget: number; // in Euros or local currency
  timeHour: number; // e.g. 18 for 18:00
  day: string; // 'Viernes', 'Sábado', 'Domingo'
  relationships: number; // -100 to 100
  trust: number; // 0 to 100
  stress: number; // 0 to 100
  reputation: number; // 0 to 100
  location: string;
  goal_progress: number; // 0 to 100
  resources: {
    carFuel?: number; // 0 to 100
    carWorking?: boolean;
    hotelBooked?: boolean;
    luggageSafe?: boolean;
    foodSupplies?: boolean;
    [key: string]: any;
  };
  language_level: CEFRLevel;
  variety: SpanishVariety;
}

export interface MemoryEntry {
  turn: number;
  keyFact: string;
  characterInvolved?: string;
  promiseOrDecision: string;
}

export interface ConversationTurn {
  id: string;
  timestamp: number;
  speaker: 'student' | 'system' | 'narrator' | string; // character id
  speakerName: string;
  text: string;
  detectedIntent?: string;
  communicativeIntent?: CommunicativeIntent;
  communicativeStrategy?: string;
  wasInterruption?: boolean;
  isRepair?: boolean;
  worldChanges?: {
    budgetDelta?: number;
    trustDelta?: number;
    stressDelta?: number;
    relationshipDelta?: number;
    locationChangedTo?: string;
    description?: string;
  };
  characterEmotion?: string;
  audioVoice?: string;
  voiceId?: string;
  voiceProvider?: VoiceProvider;
  secondaryResponse?: {
    speakerId: string;
    speakerName: string;
    text: string;
    emotion: string;
    voiceId?: string;
    voiceProvider?: VoiceProvider;
  };
}

export interface LinguisticImprovement {
  type: 'GRAMATICAL' | 'NATURALIDAD' | 'REGISTRO' | 'PRAGMATICA' | 'VOCABULARIO';
  studentPhrase: string;
  improvedPhrase: string;
  explanation: string;
}

export interface HighlightMoment {
  quote: string;
  context: string;
  outcome: string;
  whyItWorked: string;
}

export interface ImprovementMoment {
  studentPhrase: string;
  nativeAlternative: string;
  explanation: string;
  communicativeContext: string;
}

export interface GamificationBadge {
  id: string;
  title: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

export interface DebriefReport {
  communicativeProfile?: {
    fluencyScore: number; // 0-100
    interactionScore: number; // 0-100
    efficacyScore: number; // 0-100
    linguisticScore: number; // 0-100
    vocabularyScore: number; // 0-100
    overallAssessment: string;
  };
  highlightMoments?: HighlightMoment[];
  improvementMoments?: ImprovementMoment[];
  fluency: {
    summary: string;
    positivePoints: string[];
  };
  linguisticResources: {
    vocabularyUsed: string[];
    grammaticalStructures: string[];
  };
  communicativeEfficacy: {
    goalAchieved: boolean;
    outcomeDescription: string;
    successfulNegotiations: string[];
  };
  interactionQuality: {
    adaptationToCharacters: string;
    reactionToPressure: string;
  };
  pointsToImprove: LinguisticImprovement[];
  earnedBadges: GamificationBadge[];
  ending: {
    type: EndingType;
    title: string;
    description: string;
    finalSummary: string;
  };
}

export interface Experience {
  id: string;
  title: string;
  level: CEFRLevel;
  duration: string;
  theme: string;
  communicativeObjective: string;
  linguisticObjective: string; // The hidden linguistic objective for pedagogy
  vocabularyTopics: string[];
  variety: SpanishVariety;
  setting: string;
  mainMission: Mission;
  secondaryMissions: Mission[];
  characters: Character[];
  locations: Location[];
  initialState: WorldVariables;
  possibleEvents: DynamicEvent[];
  possibleEndings: Array<{
    type: EndingType;
    title: string;
    description: string;
    triggerCondition: string;
  }>;
}

export interface TeacherAnalytics {
  totalDurationMs: number;
  turnsCount: number;
  studentWordCountAvg: number;
  totalStudentWords: number;
  vocabularyRichnessScore: number;
  keyStumblingBlocks: string[];
  communicativeStrategies: string[];
  pedagogicalIndicators: {
    fluencyScore: number;
    interactionScore: number;
    pragmaticCompetence: number;
    negotiationSuccess: number;
  };
}
