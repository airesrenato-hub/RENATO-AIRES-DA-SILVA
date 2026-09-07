import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Lightbulb, ChevronDown, ChevronUp, Sparkles, VolumeX } from 'lucide-react';
import {
  createSpeechRecognizer,
  unlockMobileAudio,
  stopActiveAudio,
  isAudioPlaying,
  deduplicateSpokenText,
} from '../utils/audio';
import { SpanishVariety } from '../types';

interface ActionInputBarProps {
  onSendMessage: (text: string) => void;
  disabled: boolean;
  variety: SpanishVariety;
  onToggleImmersive?: () => void;
  isImmersive?: boolean;
}

const COMMUNICATIVE_IDEAS = [
  '«Podríamos buscar otro hotel más barato.»',
  '«¿Y si vamos en autobús y dejamos el coche?»',
  '«No estoy dispuesto a pagar más de lo acordado.»',
  '«Creo que deberíamos hablar primero con el propietario.»',
  '«Entiendo vuestro problema, pero tranquilos, busquemos una solución juntos.»',
  '«¿Cuánto dinero nos queda exactamente en el fondo común?»',
];

export const ActionInputBar: React.FC<ActionInputBarProps> = ({
  onSendMessage,
  disabled,
  variety,
  onToggleImmersive,
  isImmersive = false,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const recognizerRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const inputRef = useRef<string>('');
  const isListeningRef = useRef<boolean>(false);
  const initialTextRef = useRef<string>('');

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

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

  // Stop microphone if input bar becomes disabled while listening
  useEffect(() => {
    if (disabled && isListeningRef.current) {
      stopListeningClean();
    }
  }, [disabled]);

  useEffect(() => {
    return () => {
      stopListeningClean();
    };
  }, []);

  const toggleSpeechRecognition = () => {
    unlockMobileAudio();

    // Interrupt any ongoing character audio immediately!
    if (isAudioPlaying()) {
      stopActiveAudio();
    }

    if (isListeningRef.current) {
      stopListeningClean();
      return;
    }

    const recognizer = createSpeechRecognizer(variety);
    if (!recognizer) {
      setNoticeMessage(
        'El reconocimiento de voz por micrófono no está disponible en este navegador o entorno iframe. Puedes escribir tu respuesta directamente en el campo de texto.'
      );
      return;
    }

    setNoticeMessage(null);
    recognizerRef.current = recognizer;
    isListeningRef.current = true;
    setIsListening(true);
    clearSilenceTimers();
    initialTextRef.current = input.trim();

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

      const prefix = initialTextRef.current ? initialTextRef.current + ' ' : '';
      const fullText = (prefix + spokenPhrase).trim();

      setInput(fullText);
      inputRef.current = fullText;

      // Voice Activity Detection: Reset silence auto-send timer (2.0s of silence)
      clearSilenceTimers();
      let remaining = 2.0;
      setSilenceCountdown(remaining);

      countdownIntervalRef.current = setInterval(() => {
        remaining = Math.max(0, +(remaining - 0.2).toFixed(1));
        setSilenceCountdown(remaining);
      }, 200);

      silenceTimerRef.current = setTimeout(() => {
        clearSilenceTimers();
        const pending = deduplicateSpokenText(inputRef.current.trim());
        if (pending && isListeningRef.current) {
          stopListeningClean();
          setInput('');
          inputRef.current = '';
          initialTextRef.current = '';
          onSendMessage(pending);
        }
      }, 2000);
    };

    recognizer.onerror = (err: any) => {
      console.warn('Speech recognition notice:', err?.error || err);
      stopListeningClean();
      if (err?.error === 'not-allowed' || err?.error === 'permission-denied') {
        setNoticeMessage('Permiso de micrófono no concedido. Puedes habilitarlo en el navegador o escribir directamente.');
      } else if (err?.error === 'network') {
        setNoticeMessage('Error de red en el reconocimiento de voz. Puedes escribir tu respuesta en el campo de texto.');
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
      console.warn('Speech recognition start error:', e);
      stopListeningClean();
      setNoticeMessage('No se pudo iniciar el micrófono. Puedes escribir directamente en el campo de texto.');
    }
  };

  const handleSend = () => {
    unlockMobileAudio();
    clearSilenceTimers();
    if (disabled) return;
    const cleanText = deduplicateSpokenText(input.trim());
    if (!cleanText) return;
    stopListeningClean();
    setInput('');
    inputRef.current = '';
    initialTextRef.current = '';
    onSendMessage(cleanText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-black/40 border-t border-white/15 p-3 sm:p-4 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Communicative Scaffolding Helpers */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowIdeas(!showIdeas)}
              className="text-[11px] font-semibold text-white/70 hover:text-[#FF6B35] flex items-center gap-1.5 transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span>Ideas comunicativas opcionales</span>
              {showIdeas ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {onToggleImmersive && (
              <button
                type="button"
                onClick={onToggleImmersive}
                className="text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 transition-all shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-[#FF6B35]" />
                <span>Modo Inmersivo (Solo Voz)</span>
              </button>
            )}
          </div>

          {isListening && (
            <span className="text-xs font-semibold text-[#FF6B35] flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#FF6B35]"></span>
              <span>Escuchando...</span>
              {silenceCountdown !== null && (
                <span className="text-[10px] bg-black/40 text-white px-1.5 py-0.5 rounded font-mono">
                  Auto-envío en {silenceCountdown}s
                </span>
              )}
            </span>
          )}
        </div>

        {showIdeas && (
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/12 backdrop-blur-md flex flex-wrap gap-2 animate-in fade-in duration-150">
            {COMMUNICATIVE_IDEAS.map((idea, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInput(idea.replace(/«|»/g, ''))}
                className="text-xs text-left px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#FF6B35]/15 text-white/85 hover:text-white border border-white/12 transition-all hover:border-[#FF6B35]/60 shadow-sm"
              >
                {idea}
              </button>
            ))}
          </div>
        )}

        {/* Notice Message Banner */}
        {noticeMessage && (
          <div className="px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between animate-in fade-in duration-150">
            <span>{noticeMessage}</span>
            <button
              type="button"
              onClick={() => setNoticeMessage(null)}
              className="ml-2 px-2 py-0.5 rounded text-[11px] hover:bg-white/10 text-white/80"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Free Input Form */}
        <div className="relative flex items-end gap-2 bg-black/45 backdrop-blur-xl rounded-2xl p-2 border border-white/18 focus-within:border-[#FF6B35] focus-within:ring-1 focus-within:ring-[#FF6B35]/50 transition-all shadow-inner">
          <textarea
            id="student-action-input"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="¿Qué dices o haces? Pulsa HABLAR para conversar oralmente o escribe..."
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/40 resize-none px-2 py-1 focus:outline-none leading-relaxed"
          />

          <div className="flex items-center gap-1.5 shrink-0 pb-1 pr-1">
            {/* HABLAR (Speech-to-text with auto-silence and interrupt) */}
            <button
              id="voice-record-btn"
              type="button"
              onClick={toggleSpeechRecognition}
              disabled={disabled}
              className={`p-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all backdrop-blur-md ${
                isListening
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
                  : 'bg-white/10 hover:bg-white/15 text-white/90 border border-white/20 hover:text-white hover:border-[#FF6B35]/50'
              }`}
              title="Hablar en español mediante micrófono (Interrumpe a los personajes si están hablando)"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#FF6B35]" />}
              <span className="hidden sm:inline font-bold">
                {isListening ? 'Detener' : 'HABLAR'}
              </span>
            </button>

            {/* SEND button */}
            <button
              id="send-action-btn"
              type="button"
              onClick={handleSend}
              disabled={disabled || !input.trim()}
              className="p-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#ff7e4f] disabled:opacity-40 disabled:hover:bg-[#FF6B35] text-white font-bold transition-all shadow-lg shadow-[#FF6B35]/30 hover:scale-105 active:scale-95"
              title="Enviar acción (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
