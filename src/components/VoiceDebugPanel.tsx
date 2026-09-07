import React, { useState, useEffect } from 'react';
import {
  subscribeVoiceDebug,
  getActiveVoiceResolution,
  getVoiceDebugHistory,
  VoiceDebugInfo,
  playMultiCharacterDialogue,
  stopActiveAudio,
  isAudioPlaying,
} from '../utils/audio';
import { Volume2, CheckCircle2, Play, Square, Activity, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

interface VoiceDebugPanelProps {
  defaultOpen?: boolean;
}

export const VoiceDebugPanel: React.FC<VoiceDebugPanelProps> = ({ defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeInfo, setActiveInfo] = useState<VoiceDebugInfo | null>(getActiveVoiceResolution());
  const [history, setHistory] = useState<VoiceDebugInfo[]>(getVoiceDebugHistory());
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [testActiveIndex, setTestActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeVoiceDebug((info) => {
      setActiveInfo(info);
      setHistory(getVoiceDebugHistory());
    });
    return () => unsubscribe();
  }, []);

  const runThreeCharacterTest = async () => {
    if (isPlayingTest) {
      stopActiveAudio();
      setIsPlayingTest(false);
      setTestActiveIndex(null);
      return;
    }

    setIsPlayingTest(true);
    const testSegments = [
      {
        characterId: 'marta',
        characterName: 'Marta',
        voiceId: 'Kore',
        emotion: 'alegre',
        text: '¡Hola! Soy Marta. Mi voz es Kore, melódica y enérgica. ¿Listos para partir?',
      },
      {
        characterId: 'carlos',
        characterName: 'Carlos',
        voiceId: 'Puck',
        emotion: 'pensativo',
        text: 'Yo soy Carlos. Mi voz es Puck, pausada y juvenil. Ya revisé el mapa de la ruta.',
      },
      {
        characterId: 'narrator',
        characterName: 'Director del Mundo',
        voiceId: 'Zephyr',
        emotion: 'neutro',
        text: 'Prueba de tres voces completada. Cada personaje habla con su propia identidad vocal.',
      },
    ];

    try {
      await playMultiCharacterDialogue(
        testSegments,
        undefined,
        {
          onStart: () => {
            // Update active test index from activeInfo
          },
          onEnd: () => {
            setIsPlayingTest(false);
            setTestActiveIndex(null);
          },
          onInterrupted: () => {
            setIsPlayingTest(false);
            setTestActiveIndex(null);
          },
        }
      );
    } catch (e) {
      console.error('Error running voice test:', e);
      setIsPlayingTest(false);
      setTestActiveIndex(null);
    }
  };

  const isPlaying = activeInfo?.status === 'playing' || isAudioPlaying();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-auto">
      {/* Minimized Pill Button */}
      {!isOpen && (
        <button
          id="btn-open-voice-debug"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full shadow-lg border transition-all text-xs font-semibold ${
            isPlaying
              ? 'bg-amber-600 text-white border-amber-400 shadow-amber-900/30 animate-pulse'
              : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:bg-slate-800'
          }`}
          title="Abrir Voice Debug — Monitor de Voces Independientes"
        >
          <Activity className={`w-3.5 h-3.5 ${isPlaying ? 'text-amber-200 animate-spin' : 'text-emerald-400'}`} />
          <span>Voice Debug</span>
          {activeInfo && (
            <span className="px-1.5 py-0.5 rounded bg-black/30 font-mono text-[11px] text-amber-200">
              {activeInfo.characterName}: {activeInfo.voiceId}
            </span>
          )}
          <ChevronUp className="w-3.5 h-3.5 opacity-70" />
        </button>
      )}

      {/* Expanded Debug Overlay Panel */}
      {isOpen && (
        <div
          id="voice-debug-panel"
          className="w-96 max-w-[calc(100vw-2rem)] bg-slate-950/95 text-slate-100 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Voice Debug (Identidades Vocales)
              </h3>
            </div>
            <button
              id="btn-close-voice-debug"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Active Speaker Card */}
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/40">
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
              Voz Activa en Tiempo Real
            </div>

            {activeInfo ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-amber-400">
                      {activeInfo.characterName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                      ID: {activeInfo.characterId}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      activeInfo.status === 'playing'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {activeInfo.status === 'playing' ? 'Reproduciendo' : 'En reposo'}
                  </span>
                </div>

                {/* Voice specs grid */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono bg-black/40 p-2 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500">voiceId: </span>
                    <span className="text-emerald-300 font-bold">{activeInfo.voiceId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">provider: </span>
                    <span className="text-cyan-300 font-bold">{activeInfo.provider}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">pitch: </span>
                    <span className="text-amber-200">{activeInfo.pitch?.toFixed(2) ?? '1.00'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">rate: </span>
                    <span className="text-amber-200">{activeInfo.rate?.toFixed(2) ?? '1.00'}</span>
                  </div>
                </div>

                {activeInfo.text && (
                  <div className="text-[11px] text-slate-300 italic line-clamp-2 bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                    «{activeInfo.text}»
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-2 text-center">
                Esperando intervención de personajes...
              </div>
            )}
          </div>

          {/* Test Action */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800">
            <button
              id="btn-run-voice-test"
              onClick={runThreeCharacterTest}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                isPlayingTest
                  ? 'bg-rose-700 hover:bg-rose-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold'
              }`}
            >
              {isPlayingTest ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Detener Prueba de Voces</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Probar 3 Personajes (Marta, Carlos, Narrador)</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              Demuestra en vivo: Marta → Kore | Carlos → Puck | Narrador → Zephyr
            </p>
          </div>

          {/* History of Voice Invocations */}
          <div className="p-3.5 max-h-48 overflow-y-auto space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 flex items-center justify-between">
              <span>Registro de Invocaciones</span>
              <span className="text-[9px] text-slate-500 font-normal">{history.length} eventos</span>
            </div>

            {history.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic py-2 text-center">
                Sin eventos de voz registrados.
              </div>
            ) : (
              history.slice(0, 10).map((item, idx) => (
                <div
                  key={`${item.timestamp}-${idx}`}
                  className="p-1.5 rounded bg-slate-900/70 border border-slate-800/80 text-[11px] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-slate-200 truncate">{item.characterName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">→</span>
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60">
                      {item.voiceId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-slate-400 font-mono">
                    <span>{item.provider}</span>
                    <span className="text-slate-600">|</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
