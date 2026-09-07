import React, { useState } from 'react';
import { Experience, CEFRLevel, SpanishVariety, TeacherAnalytics, VoiceId } from '../types';
import {
  VOICE_PROFILES,
  previewVoice,
  playDialogueAudio,
  stopAllAudio,
  unlockMobileAudio,
} from '../utils/audio';
import {
  Sparkles,
  BookOpen,
  Users,
  Clock,
  Target,
  FileText,
  Play,
  Save,
  CheckCircle,
  BarChart3,
  AlertCircle,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';

interface TeacherCreatorViewProps {
  onPublishExperience: (experience: Experience) => void;
  analytics?: TeacherAnalytics;
  currentExperience: Experience;
}

export const TeacherCreatorView: React.FC<TeacherCreatorViewProps> = ({
  onPublishExperience,
  analytics,
  currentExperience,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'analytics'>('create');

  // Form states
  const [worldPrompt, setWorldPrompt] = useState(
    'Quiero una experiencia en la que el estudiante tenga que organizar una cena sorpresa de cumpleaños con amigos en un piso compartido en Barcelona, gestionar el dinero común y solucionar problemas imprevistos como que se queme el plato principal o que el anfitrión llegue antes de tiempo.'
  );
  const [name, setName] = useState('La cena sorpresa que se complica');
  const [level, setLevel] = useState<CEFRLevel>('B1');
  const [variety, setVariety] = useState<SpanishVariety>('spain');
  const [duration, setDuration] = useState('45 min');
  const [theme, setTheme] = useState('Convivencia, compras, improvisación y cocina');
  const [communicativeObjective, setCommunicativeObjective] = useState(
    'Pedir ayuda a los amigos, repartir tareas bajo presión de tiempo y buscar soluciones de emergencia.'
  );
  const [linguisticObjective, setLinguisticObjective] = useState(
    'Uso de imperativo afirmativo y negativo para instrucciones («Compra tú el pan», «No abras la puerta»), marcadores temporales («antes de que», «mientras tanto») y vocabulario culinario.'
  );
  const [characterCount, setCharacterCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<Experience | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const handlePreviewVoice = (vId: VoiceId) => {
    unlockMobileAudio();
    if (playingVoiceId === vId) {
      stopAllAudio();
      setPlayingVoiceId(null);
      return;
    }
    stopAllAudio();
    setPlayingVoiceId(vId);
    previewVoice(vId, variety)
      .then(() => {})
      .catch(() => {
        setPlayingVoiceId(null);
      });
  };

  const handleCharacterVoiceChange = (charId: string, newVoiceId: VoiceId) => {
    const profile = VOICE_PROFILES.find((p) => p.id === newVoiceId);
    setGeneratedPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        characters: prev.characters.map((c) => {
          if (c.id !== charId) return c;
          return {
            ...c,
            voiceId: newVoiceId,
            gender: profile?.gender || c.gender,
            voicePitch: profile?.defaultPitch ?? c.voicePitch,
            voiceRate: profile?.defaultRate ?? c.voiceRate,
          };
        }),
      };
    });
  };

  const handleTestCharacterVoice = (char: any) => {
    unlockMobileAudio();
    const playbackKey = `char-${char.id}`;
    if (playingVoiceId === playbackKey) {
      stopAllAudio();
      setPlayingVoiceId(null);
      return;
    }

    stopAllAudio();
    setPlayingVoiceId(playbackKey);

    const sample = `Hola, soy ${char.name}. ${char.personality || '¿Listo para empezar la simulación?'}`;

    playDialogueAudio(sample, {
      variety,
      voiceId: char.voiceId,
      gender: char.gender,
      pitch: char.voicePitch,
      rate: char.voiceRate,
      speakerName: char.name,
      speakerId: char.id,
      onEnd: () => setPlayingVoiceId(null),
      onError: () => setPlayingVoiceId(null),
    });
  };

  const handleGenerate = async () => {
    if (!worldPrompt.trim()) return;
    setIsGenerating(true);
    setGenError(null);

    try {
      const res = await fetch('/api/simulation/generate-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: worldPrompt,
          name,
          level,
          variety,
          duration,
          theme,
          communicativeObjective,
          linguisticObjective,
          characterCount,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al generar la experiencia con IA');
      }

      setGeneratedPreview(data);
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || 'No se pudo conectar con el generador de Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = () => {
    if (generatedPreview) {
      onPublishExperience(generatedPreview);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* View Switcher */}
      <div className="flex items-center justify-between border-b border-white/12 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>👨‍🏫 Consola Pedagógica del Profesor</span>
          </h2>
          <p className="text-xs text-white/60 mt-0.5">
            Crea simulaciones comunicativas a medida con IA o revisa las analíticas de aula.
          </p>
        </div>

        <div className="flex bg-black/30 p-1 rounded-xl border border-white/12 backdrop-blur-md text-xs">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/25'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Creador de Mundos</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/25'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analítica Pedagógica</span>
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Main Prompt Box */}
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/15 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF6B35]" />
              <label className="stat-label text-[#FF6B35]">
                Describe el mundo que quieres crear
              </label>
            </div>
            <textarea
              rows={3}
              value={worldPrompt}
              onChange={(e) => setWorldPrompt(e.target.value)}
              placeholder="Ej: Quiero una experiencia en la que el estudiante tenga que..."
              className="w-full bg-white/[0.05] border border-white/15 rounded-xl p-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B35] leading-relaxed backdrop-blur-md"
            />
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Level */}
            <div>
              <label className="block stat-label text-white/70 mb-1.5">
                Nivel MCER
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CEFRLevel)}
                className="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#FF6B35] backdrop-blur-md"
              >
                <option value="A1">A1 - Necesidades básicas e inmediatez</option>
                <option value="A2">A2 - Pasado, planes y recomendaciones</option>
                <option value="B1">B1 - Narración, justificación y problemas</option>
                <option value="B2">B2 - Argumentación, matices y cortesía</option>
                <option value="C1">C1 - Pragmática, persuasión y registros</option>
                <option value="C2">C2 - Doble sentido, ironía y cultura</option>
              </select>
            </div>

            {/* Variety */}
            <div>
              <label className="block stat-label text-white/70 mb-1.5">
                Variedad del Español
              </label>
              <select
                value={variety}
                onChange={(e) => setVariety(e.target.value as SpanishVariety)}
                className="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#FF6B35] backdrop-blur-md"
              >
                <option value="spain">🇪🇸 España (vosotros, vale, tío)</option>
                <option value="mexico">🇲🇽 México (ustedes, órale, güey)</option>
                <option value="argentina">🇦🇷 Argentina (voseo, che, guita)</option>
                <option value="colombia">🇨🇴 Colombia (parce, bacano)</option>
                <option value="chile">🇨🇱 Chile (chileno coloquial)</option>
                <option value="peru">🇵🇪 Perú (peruano neutro/coloquial)</option>
                <option value="international">🌎 Internacional (estándar hispano)</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block stat-label text-white/70 mb-1.5">
                Duración Estimada
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/15 rounded-xl p-2.5 text-xs text-white backdrop-blur-md focus:outline-none focus:border-[#FF6B35]"
              />
            </div>

            {/* Communicative Objective */}
            <div className="sm:col-span-2">
              <label className="block stat-label text-white/70 mb-1.5">
                Objetivo Comunicativo (Lo que hace el estudiante)
              </label>
              <input
                type="text"
                value={communicativeObjective}
                onChange={(e) => setCommunicativeObjective(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/15 rounded-xl p-2.5 text-xs text-white backdrop-blur-md focus:outline-none focus:border-[#FF6B35]"
              />
            </div>

            {/* Hidden Linguistic Objective */}
            <div className="sm:col-span-3">
              <label className="block stat-label text-white/70 mb-1.5">
                Objetivo Lingüístico Oculto (El contenido que emergerá de la situación)
              </label>
              <input
                type="text"
                value={linguisticObjective}
                onChange={(e) => setLinguisticObjective(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/15 rounded-xl p-2.5 text-xs text-white backdrop-blur-md focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
          </div>

          {/* Neural Voices Palette for Characters */}
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-xs font-bold text-white">
                  Catálogo de Voces Disponibles para Personajes
                </span>
              </div>
              <span className="text-[10px] text-white/50">
                Cada personaje recibe una voz única automáticamente
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {VOICE_PROFILES.map((vp) => {
                const isPlayingThis = playingVoiceId === vp.id;
                return (
                  <div
                    key={vp.id}
                    className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isPlayingThis
                        ? 'bg-[#FF6B35]/15 border-[#FF6B35]/60 shadow-sm shadow-[#FF6B35]/20'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{vp.name}</span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                            vp.gender === 'female'
                              ? 'bg-pink-500/20 text-pink-200 border border-pink-500/30'
                              : 'bg-sky-500/20 text-sky-200 border border-sky-500/30'
                          }`}
                        >
                          {vp.gender === 'female' ? 'F' : 'M'}
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-200/80 font-medium mt-0.5">
                        {vp.tag}
                      </div>
                      <div className="text-[9px] text-white/50 line-clamp-2 mt-1 leading-tight">
                        {vp.description}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePreviewVoice(vp.id)}
                      className={`mt-2.5 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isPlayingThis
                          ? 'bg-[#FF6B35] text-white shadow-sm ring-1 ring-white/30 animate-pulse'
                          : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/10'
                      }`}
                      title={`Escuchar muestra de voz de ${vp.name}`}
                    >
                      {isPlayingThis ? (
                        <>
                          <VolumeX className="w-3 h-3" />
                          <span>Pausar</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-[#FF6B35]" />
                          <span>Oír voz</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-2">
            {genError && (
              <span className="text-xs text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                {genError}
              </span>
            )}
            <div className="ml-auto">
              <button
                id="generate-experience-btn"
                onClick={handleGenerate}
                disabled={isGenerating || !worldPrompt.trim()}
                className="px-6 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#ff7e4f] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#FF6B35]/25 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generando mundo con Gemini...' : '✨ GENERAR EXPERIENCIA'}</span>
              </button>
            </div>
          </div>

          {/* Generated Preview & Publish */}
          {generatedPreview && (
            <div className="p-5 rounded-2xl glass-modal bg-[#161424]/90 border border-white/20 backdrop-blur-2xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-white/12 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30">
                    Vista previa de experiencia generada
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {generatedPreview.title}
                  </h3>
                </div>
                <button
                  id="publish-experience-btn"
                  onClick={handlePublish}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PUBLICAR Y JUGAR AHORA</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="font-semibold text-white/60">Contexto inicial del mundo:</div>
                  <p className="text-white/90 bg-white/[0.04] p-3 rounded-xl border border-white/10 leading-relaxed backdrop-blur-sm">
                    {generatedPreview.setting}
                  </p>
                  <div className="font-semibold text-white/60">Misión principal:</div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white backdrop-blur-sm">
                    <strong>{generatedPreview.mainMission.title}</strong>
                    <p className="text-white/60 text-[11px] mt-0.5">{generatedPreview.mainMission.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white/60">
                      Personajes y Configuración de Voces ({generatedPreview.characters.length}):
                    </span>
                    <span className="text-[10px] text-amber-300/80">
                      Voz individual por personaje
                    </span>
                  </div>

                  <div className="space-y-2">
                    {generatedPreview.characters.map((c) => {
                      const playbackKey = `char-${c.id}`;
                      const isPlayingThisChar = playingVoiceId === playbackKey;
                      const activeProfile = VOICE_PROFILES.find((p) => p.id === c.voiceId);

                      return (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col gap-2 backdrop-blur-sm hover:border-white/20 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 text-[#FF6B35] font-bold flex items-center justify-center text-xs border border-[#FF6B35]/30 shrink-0">
                                {c.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{c.name}</span>
                                  <span className="text-white/50 text-[11px] font-normal">({c.role})</span>
                                </div>
                                <div className="text-[10px] text-white/60 line-clamp-1">{c.personality}</div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleTestCharacterVoice(c)}
                              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                                isPlayingThisChar
                                  ? 'bg-[#FF6B35] text-white shadow-sm ring-1 ring-white/40 animate-pulse'
                                  : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/10'
                              }`}
                              title={`Escuchar a ${c.name} hablar con su voz`}
                            >
                              {isPlayingThisChar ? (
                                <>
                                  <VolumeX className="w-3 h-3" />
                                  <span>Detener</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3 text-[#FF6B35]" />
                                  <span>Probar voz</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Voice Selector for this Character */}
                          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/10 text-[11px]">
                            <label className="text-white/60 shrink-0 font-medium">
                              Voz asignada:
                            </label>
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <select
                                value={c.voiceId || 'Zephyr'}
                                onChange={(e) =>
                                  handleCharacterVoiceChange(c.id, e.target.value as VoiceId)
                                }
                                className="bg-black/40 border border-white/20 text-white rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-[#FF6B35] focus:outline-none max-w-[190px]"
                              >
                                {VOICE_PROFILES.map((vp) => (
                                  <option key={vp.id} value={vp.id} className="bg-[#181622] text-white">
                                    {vp.name} ({vp.tag})
                                  </option>
                                ))}
                              </select>
                              {activeProfile && (
                                <span className="text-[10px] text-white/40 hidden sm:inline">
                                  {(c.voicePitch ?? activeProfile.defaultPitch).toFixed(2)}x
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-center">
              <span className="stat-label text-white/60">Intervenciones</span>
              <div className="text-2xl font-black text-[#FF6B35] mt-1">
                {analytics?.turnsCount || 12}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-center">
              <span className="stat-label text-white/60">Palabras / Turno</span>
              <div className="text-2xl font-black text-sky-400 mt-1">
                {analytics?.studentWordCountAvg || 14.5}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-center">
              <span className="stat-label text-white/60">Riqueza Léxica</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                84%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-center">
              <span className="stat-label text-white/60">Éxito Negociador</span>
              <div className="text-2xl font-black text-purple-300 mt-1">
                Alta
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-3">
            <h4 className="stat-label text-white/70">
              Estrategias Comunicativas Observadas en la Sesión
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-emerald-300">
                ✓ Propuesta colaborativa de alternativas
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-sky-300">
                ✓ Solicitud de aclaración y mediación
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[#FF6B35]">
                ✓ Negociación de precios y condiciones
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-indigo-300">
                ✓ Atenuación de desacuerdos mediante condicional
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-xs text-white/90 backdrop-blur-md">
            <strong>Orientación docente:</strong> Estos indicadores no constituyen una certificación formal del MCER, sino una brújula pedagógica para el profesor sobre cómo interactúa el estudiante cuando el idioma es el único motor de la acción.
          </div>
        </div>
      )}
    </div>
  );
};
