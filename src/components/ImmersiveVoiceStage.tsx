import React, { useState, useEffect, useRef } from 'react';
import { Character, SpanishVariety, ConversationTurn, WorldVariables } from '../types';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Minimize2,
  Subtitles,
  FastForward,
  Hand,
  Clock,
  Euro,
  Heart,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import {
  createSpeechRecognizer,
  stopActiveAudio,
  isAudioPlaying,
  unlockMobileAudio,
  deduplicateSpokenText,
} from '../utils/audio';

interface ImmersiveVoiceStageProps {
  characters: Character[];
  turns: ConversationTurn[];
  worldState: WorldVariables;
  variety: SpanishVariety;
  isProcessing: boolean;
  activeSpeakerId?: string;
  onSendMessage: (text: string) => void;
  onExitImmersive: () => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
}

export const ImmersiveVoiceStage: React.FC<ImmersiveVoiceStageProps> = ({
  characters,
  turns,
  worldState,
  variety,
  isProcessing,
  activeSpeakerId,
  onSendMessage,
  onExitImmersive,
  speechRate,
  onSpeechRateChange,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const recognizerRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const isListeningRef = useRef<boolean>(false);

  // Keep transcriptRef synchronized with transcript state
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const clearSilenceTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSilenceCountdown(null);
  };

  const stopListeningClean = () => {
    clearSilenceTimers();
    isListeningRef.current = false;
    setIsListening(false);
    if (recognizerRef.current) {
      try {
        recognizerRef.current.onresult = null;
        recognizerRef.current.onerror = null;
        recognizerRef.current.onend = null;
        recognizerRef.current.abort();
      } catch {}
      recognizerRef.current = null;
    }
  };

  // Automatically disarm microphone while AI is processing to avoid echo loops
  useEffect(() => {
    if (isProcessing && isListeningRef.current) {
      stopListeningClean();
    }
  }, [isProcessing]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListeningClean();
    };
  }, []);

  const handleInterruptCharacter = () => {
    stopActiveAudio();
    setIsInterrupting(true);
    setTimeout(() => setIsInterrupting(false), 1200);
    // Automatically start listening to the student's interruption
    if (!isListeningRef.current) {
      startListening();
    }
  };

  const startListening = () => {
    unlockMobileAudio();

    // If a character is speaking, stop their audio immediately upon student action
    if (isAudioPlaying()) {
      stopActiveAudio();
      setIsInterrupting(true);
      setTimeout(() => setIsInterrupting(false), 1000);
    }

    const recognizer = createSpeechRecognizer(variety);
    if (!recognizer) {
      setVoiceNotice('El reconocimiento de voz por micrófono no está disponible en este navegador o entorno. Puedes salir al modo estándar para responder por texto.');
      return;
    }

    setVoiceNotice(null);
    recognizerRef.current = recognizer;
    isListeningRef.current = true;
    setIsListening(true);
    clearSilenceTimers();

    recognizer.onresult = (event: any) => {
      if (!isListeningRef.current) return;

      let accumulatedFinal = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          accumulatedFinal += res[0].transcript + ' ';
        } else {
          interimTranscript += res[0].transcript;
        }
      }

      const spokenPhrase = (accumulatedFinal + interimTranscript).trim();
      if (!spokenPhrase) return;

      setTranscript(spokenPhrase);
      transcriptRef.current = spokenPhrase;

      // Reset Voice Activity Detection (VAD) silence detection: 2.0s of silence auto-sends
      clearSilenceTimers();
      let remaining = 2.0;
      setSilenceCountdown(remaining);

      countdownIntervalRef.current = setInterval(() => {
        remaining = Math.max(0, +(remaining - 0.2).toFixed(1));
        setSilenceCountdown(remaining);
      }, 200);

      silenceTimerRef.current = setTimeout(() => {
        clearSilenceTimers();
        const finalPrompt = deduplicateSpokenText(transcriptRef.current.trim());
        if (finalPrompt && isListeningRef.current) {
          stopListeningClean();
          setTranscript('');
          transcriptRef.current = '';
          onSendMessage(finalPrompt);
        }
      }, 2000);
    };

    recognizer.onerror = (err: any) => {
      console.warn('Speech recognition notice:', err?.error || err);
      stopListeningClean();
      if (err?.error === 'not-allowed' || err?.error === 'permission-denied') {
        setVoiceNotice('Permiso de micrófono denegado. Puedes conceder permiso en el navegador o usar el modo estándar con teclado.');
      } else if (err?.error === 'network') {
        setVoiceNotice('Error de conexión de voz. Inténtalo de nuevo o usa el modo estándar.');
      }
    };

    recognizer.onend = () => {
      if (isListeningRef.current) {
        setIsListening(false);
        isListeningRef.current = false;
        clearSilenceTimers();
      }
    };

    try {
      recognizer.start();
    } catch (e) {
      console.warn('Speech start error:', e);
      stopListeningClean();
      setVoiceNotice('No se pudo iniciar el micrófono. Puedes usar el modo estándar para interactuar.');
    }
  };

  const stopListening = () => {
    const pendingText = deduplicateSpokenText(transcript.trim());
    stopListeningClean();
    if (pendingText) {
      setTranscript('');
      transcriptRef.current = '';
      onSendMessage(pendingText);
    }
  };

  const toggleListening = () => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Find latest character turn
  const latestTurn = turns[turns.length - 1];
  const activeChar = characters.find((c) => c.id === activeSpeakerId) || characters[0];

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-radial from-[#1e1b2e] via-[#0e0d16] to-[#07060a] select-none">
      {/* Background Animated Acoustic Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[140px] transition-all duration-700 ${
            isListening
              ? 'bg-[#FF6B35]/25 scale-110'
              : isProcessing
              ? 'bg-purple-600/20 scale-95'
              : 'bg-amber-600/15 scale-100'
          }`}
        />
      </div>

      {/* Top Floating Control Bar */}
      <div className="relative z-10 px-4 py-3 flex items-center justify-between border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/40 text-xs font-black uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MODO INMERSIVO · VOZ 2.0</span>
          </span>

          {/* Quick World Vital Badges */}
          <div className="hidden md:flex items-center gap-3 text-xs text-white/80">
            <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
              <Euro className="w-3 h-3 text-emerald-400" />
              <span>{worldState.budget} €</span>
            </span>
            <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
              <Heart className="w-3 h-3 text-rose-400" />
              <span>{worldState.trust}% Confianza</span>
            </span>
            <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>{worldState.stress}% Estrés</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Oral Speed Multiplier */}
          <div className="flex items-center bg-black/40 border border-white/15 rounded-xl p-0.5">
            {[0.85, 1.0, 1.15].map((rate) => (
              <button
                key={rate}
                onClick={() => onSpeechRateChange(rate)}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  speechRate === rate
                    ? 'bg-[#FF6B35] text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
                title={`Velocidad de locución: ${rate}x`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Subtitles Toggle */}
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showSubtitles
                ? 'bg-white/15 border-white/25 text-white'
                : 'bg-black/30 border-white/10 text-white/50 hover:text-white'
            }`}
            title={showSubtitles ? 'Ocultar subtítulos (modo solo audio)' : 'Mostrar subtítulos'}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showSubtitles ? 'Subtítulos' : 'Sin texto'}</span>
          </button>

          {/* Exit Immersive View */}
          <button
            onClick={onExitImmersive}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all"
            title="Volver a la vista detallada"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Acoustic Stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full relative z-10">
        {/* Character Stage Roster */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-6 sm:mb-10 w-full">
          {characters.map((char) => {
            const isActive = activeSpeakerId === char.id;
            return (
              <div
                key={char.id}
                className={`flex flex-col items-center transition-all duration-300 ${
                  isActive ? 'scale-110 sm:scale-115' : 'opacity-65 hover:opacity-90'
                }`}
              >
                <div className="relative">
                  {/* Glowing speaking rings */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-[#FF6B35]/40 animate-ping pointer-events-none" />
                  )}

                  <img
                    src={char.avatar}
                    alt={char.name}
                    referrerPolicy="no-referrer"
                    className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover shadow-2xl border-2 transition-all ${
                      isActive
                        ? 'border-[#FF6B35] ring-4 ring-[#FF6B35]/30'
                        : 'border-white/20'
                    }`}
                  />

                  {char.currentEmotion && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/80 border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md shadow-lg whitespace-nowrap">
                      {char.currentEmotion}
                    </span>
                  )}
                </div>

                <div className="mt-3 text-center">
                  <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                    {char.name}
                  </h3>
                  <p className="text-[11px] text-white/60 font-medium">{char.role}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Status Indicator */}
        <div className="mb-4 flex flex-col items-center gap-2">
          {voiceNotice && (
            <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-medium flex items-center gap-3 animate-in fade-in duration-150 max-w-lg text-center">
              <span>{voiceNotice}</span>
              <button
                onClick={() => {
                  setVoiceNotice(null);
                  onExitImmersive();
                }}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] whitespace-nowrap"
              >
                Modo texto
              </button>
            </div>
          )}

          {isInterrupting ? (
            <div className="px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <Hand className="w-3.5 h-3.5" />
              <span>¡Interrupción registrada! Los personajes te escuchan.</span>
            </div>
          ) : isListening ? (
            <div className="px-4 py-1.5 rounded-full bg-[#FF6B35]/20 border border-[#FF6B35]/50 text-[#FF6B35] text-xs font-extrabold flex items-center gap-2 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]" />
              <span>TE ESTÁN ESCUCHANDO EN ESPAÑOL</span>
              {silenceCountdown !== null && (
                <span className="text-[11px] font-mono text-white/80 bg-black/40 px-2 py-0.5 rounded-md ml-1">
                  Pausa: {silenceCountdown}s
                </span>
              )}
            </div>
          ) : isProcessing ? (
            <div className="px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>El grupo asimila tu intervención y reacciona...</span>
            </div>
          ) : (
            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-white/70 text-xs font-medium flex items-center gap-2">
              <span>Pulsa HABLAR o habla en cualquier momento para intervenir</span>
            </div>
          )}
        </div>

        {/* Subtitles & Latest Dialogue Projection */}
        {showSubtitles && latestTurn && (
          <div className="w-full max-w-2xl bg-black/50 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl my-2 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF6B35] mb-2 flex items-center justify-center gap-1.5">
              <span>{latestTurn.speakerName || 'Interlocutor'}</span>
              {latestTurn.characterEmotion && (
                <span className="text-white/60 font-normal">({latestTurn.characterEmotion})</span>
              )}
            </div>
            <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
              «{latestTurn.text}»
            </p>

            {/* Secondary reaction if present */}
            {latestTurn.secondaryResponse && (
              <div className="mt-3 pt-3 border-t border-white/10 text-xs text-amber-200/90 font-medium">
                <span className="font-bold text-[#FF6B35]">{latestTurn.secondaryResponse.speakerName}: </span>
                «{latestTurn.secondaryResponse.text}»
              </div>
            )}
          </div>
        )}

        {/* Live Student Transcription Preview */}
        {transcript && (
          <div className="w-full max-w-xl bg-[#FF6B35]/15 border border-[#FF6B35]/40 rounded-2xl p-3 my-2 text-center backdrop-blur-md animate-in fade-in duration-150">
            <span className="text-[10px] uppercase font-bold text-[#FF6B35] block mb-1">
              Tu voz (Transcribiendo en directo):
            </span>
            <p className="text-sm font-semibold text-white">«{transcript}»</p>
          </div>
        )}
      </div>

      {/* Bottom Voice Control Console */}
      <div className="relative z-20 pb-8 pt-4 px-4 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          {/* Interruption Button */}
          <button
            onClick={handleInterruptCharacter}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-rose-500/20 border border-white/15 hover:border-rose-500/40 text-white/80 hover:text-rose-300 font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
            title="Interrumpir al personaje que está hablando"
          >
            <Hand className="w-4 h-4 text-rose-400" />
            <span>INTERRUMPIR</span>
          </button>

          {/* Big Primary HABLAR Microphone Button */}
          <button
            id="immersive-speak-btn"
            onClick={toggleListening}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-300 shadow-2xl active:scale-95 ${
              isListening
                ? 'bg-rose-500 text-white ring-8 ring-rose-500/30 scale-105 shadow-rose-500/50 animate-pulse'
                : 'bg-gradient-to-tr from-[#FF6B35] to-[#ff8c59] text-white hover:scale-105 shadow-[#FF6B35]/40 ring-4 ring-[#FF6B35]/20'
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 sm:w-9 sm:h-9" />
            ) : (
              <Mic className="w-8 h-8 sm:w-9 sm:h-9" />
            )}
            <span className="text-[10px] font-black uppercase tracking-wider">
              {isListening ? 'ENVIAR' : 'HABLAR'}
            </span>
          </button>

          {/* Speech Rate Quick Step */}
          <button
            onClick={() => {
              const rates = [0.85, 1.0, 1.15];
              const nextRate = rates[(rates.indexOf(speechRate) + 1) % rates.length];
              onSpeechRateChange(nextRate);
            }}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
            title="Modificar ritmo oral del español"
          >
            <FastForward className="w-4 h-4 text-amber-400" />
            <span>{speechRate}x</span>
          </button>
        </div>

        <p className="text-[11px] text-white/50 text-center">
          Pausa tu voz durante 1.8 segundos para enviar automáticamente, o pulsa ENVIAR.
        </p>
      </div>
    </div>
  );
};
