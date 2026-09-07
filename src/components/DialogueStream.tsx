import React, { useEffect, useRef, useState } from 'react';
import { ConversationTurn, Character, SpanishVariety } from '../types';
import { Volume2, VolumeX, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { playDialogueAudio, stopAllAudio, unlockMobileAudio } from '../utils/audio';

interface DialogueStreamProps {
  turns: ConversationTurn[];
  characters: Character[];
  variety: SpanishVariety;
  isProcessing: boolean;
  onExploreAlternative?: (turnIndex: number, originalText: string) => void;
}

export const DialogueStream: React.FC<DialogueStreamProps> = ({
  turns,
  characters,
  variety,
  isProcessing,
  onExploreAlternative,
}) => {
  const streamBottomRef = useRef<HTMLDivElement>(null);
  const [playingTurnId, setPlayingTurnId] = useState<string | null>(null);
  const [loadingTurnId, setLoadingTurnId] = useState<string | null>(null);

  // Auto-scroll to latest turn
  useEffect(() => {
    streamBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, isProcessing]);

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const getCharacter = (speakerId: string): Character | undefined => {
    return characters.find((c) => c.id === speakerId);
  };

  const handleTogglePlay = (
    turnKey: string,
    text: string,
    speakerId?: string,
    emotion?: string,
    speakerName?: string
  ) => {
    // Synchronously prime and unlock audio inside the touch gesture for iOS Safari & Android
    unlockMobileAudio();

    if (playingTurnId === turnKey) {
      stopAllAudio();
      setPlayingTurnId(null);
      setLoadingTurnId(null);
      return;
    }

    stopAllAudio();
    setLoadingTurnId(turnKey);
    setPlayingTurnId(null);

    const character = speakerId ? getCharacter(speakerId) : undefined;

    playDialogueAudio(text, {
      speakerId,
      speakerName: speakerName || character?.name,
      variety,
      emotion,
      character,
      characters,
      voiceId: character?.voice?.voiceId || character?.voiceId,
      gender: character?.gender,
      pitch: character?.voice?.pitch ?? character?.voicePitch,
      rate: character?.voice?.speed ?? character?.voiceRate,
      provider: character?.voice?.provider,
      onStart: () => {
        setLoadingTurnId(null);
        setPlayingTurnId(turnKey);
      },
      onEnd: () => {
        setPlayingTurnId(null);
        setLoadingTurnId(null);
      },
      onError: (err) => {
        console.warn('Playback error in dialogue stream:', err);
        setPlayingTurnId(null);
        setLoadingTurnId(null);
      },
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full relative">
      {/* Active Audio Sticky Banner with Mobile Guidance */}
      {playingTurnId && (
        <div className="sticky top-2 z-30 mx-auto max-w-lg bg-black/80 border border-[#FF6B35]/40 backdrop-blur-xl rounded-full px-3.5 py-1.5 shadow-xl shadow-[#FF6B35]/20 flex items-center justify-between text-xs text-white animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B35] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6B35]"></span>
            </span>
            <span className="font-semibold text-white/90 truncate">
              Reproduciendo audio...
            </span>
            <span className="text-[10px] text-white/60 hidden md:inline shrink-0">
              (En móvil: desactiva el modo silencio y sube el volumen)
            </span>
          </div>
          <button
            onClick={() => {
              stopAllAudio();
              setPlayingTurnId(null);
              setLoadingTurnId(null);
            }}
            className="ml-2 text-[11px] font-bold text-[#FF6B35] hover:text-white px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-[#FF6B35]/40 transition-all shrink-0"
          >
            Pausar
          </button>
        </div>
      )}

      {turns.map((turn, index) => {
        const turnKey = turn.id || `turn-${index}`;
        const isStudent = turn.speaker === 'student';
        const isNarrator = turn.speaker === 'narrator' || turn.speaker === 'system';
        const character = !isStudent && !isNarrator ? getCharacter(turn.speaker) : undefined;
        const isPlayingThis = playingTurnId === turnKey;
        const isLoadingThis = loadingTurnId === turnKey;

        // Narrator / World Transition
        if (isNarrator) {
          return (
            <div
              key={turnKey}
              className="my-3 p-4 rounded-2xl rounded-bl-sm bg-black/35 backdrop-blur-xl border border-white/15 text-xs text-white/90 flex items-start gap-3 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="p-2 rounded-xl bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30 shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="stat-label text-[#FF6B35]">
                    {turn.speakerName || 'El Mundo'}
                  </div>
                  {/* Speak Narrator Audio */}
                  <button
                    onClick={() => handleTogglePlay(turnKey, turn.text, 'narrator')}
                    className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                      isPlayingThis
                        ? 'bg-[#FF6B35]/25 border-[#FF6B35]/60 text-[#FF6B35] shadow-sm ring-1 ring-[#FF6B35]/40'
                        : isLoadingThis
                        ? 'bg-white/15 border-white/25 text-[#FF6B35]'
                        : 'text-white/60 hover:text-white hover:bg-white/15 border-transparent hover:border-white/20'
                    }`}
                    title={
                      isPlayingThis
                        ? 'Detener narración'
                        : isLoadingThis
                        ? 'Cargando voz...'
                        : 'Escuchar narración del mundo'
                    }
                  >
                    {isLoadingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6B35]" />
                    ) : isPlayingThis ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-[#FF6B35]" />
                        <span className="text-[9px] font-bold text-[#FF6B35] animate-pulse hidden sm:inline">Hablando...</span>
                      </>
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="italic leading-relaxed text-white/90">
                  {turn.text}
                </p>
                {turn.worldChanges?.description && (
                  <div className="mt-2.5 text-[11px] font-semibold text-white bg-[#FF6B35]/20 border border-[#FF6B35]/40 px-3 py-1 rounded-xl inline-block backdrop-blur-sm">
                    ⚡ {turn.worldChanges.description}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Student's Action / Speech
        if (isStudent) {
          return (
            <div
              key={turnKey}
              className="flex justify-end my-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-sm p-4 bg-gradient-to-r from-[#FF6B35] to-[#ff7e4f] text-white shadow-xl shadow-[#FF6B35]/25 border border-white/20">
                <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-white/20 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">
                      Tú (Estudiante)
                    </span>
                    {turn.communicativeStrategy && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/20 text-white border border-white/20 backdrop-blur-sm">
                        🎯 {turn.communicativeStrategy}
                      </span>
                    )}
                  </div>

                  {/* Speak Student Audio helper */}
                  <button
                    onClick={() => handleTogglePlay(turnKey, turn.text, 'student')}
                    className={`p-1 rounded-md border transition-all text-white/80 hover:text-white ${
                      isPlayingThis
                        ? 'bg-black/30 border-white/40 text-white ring-1 ring-white/40'
                        : isLoadingThis
                        ? 'bg-black/20 border-white/20'
                        : 'border-transparent hover:bg-black/20 hover:border-white/20'
                    }`}
                    title={
                      isPlayingThis
                        ? 'Detener audio'
                        : isLoadingThis
                        ? 'Generando pronunciación...'
                        : 'Escuchar pronunciación nativa de tu frase'
                    }
                  >
                    {isLoadingThis ? (
                      <Loader2 className="w-3 h-3 animate-spin text-white" />
                    ) : isPlayingThis ? (
                      <VolumeX className="w-3 h-3 text-white" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="text-sm font-medium leading-relaxed selection:bg-black selection:text-white">
                  «{turn.text}»
                </p>

                {onExploreAlternative && (
                  <div className="mt-2.5 pt-1.5 border-t border-white/20 flex justify-end">
                    <button
                      onClick={() => onExploreAlternative(index, turn.text)}
                      className="text-[10px] font-bold text-white hover:text-amber-100 flex items-center gap-1 underline decoration-white/50 underline-offset-2 transition-all"
                    >
                      <span>¿Qué habría pasado si...?</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Character Speech
        return (
          <div
            key={turnKey}
            className="flex items-start gap-3 my-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {/* Character Avatar */}
            <div className="shrink-0 mt-1">
              {character?.avatar ? (
                <img
                  src={character.avatar}
                  alt={character.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold backdrop-blur-md">
                  {turn.speakerName?.charAt(0) || 'P'}
                </div>
              )}
            </div>

            {/* Character Bubble */}
            <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl rounded-bl-sm p-4 bg-white/[0.07] backdrop-blur-xl border transition-all text-white shadow-xl ${
              isPlayingThis ? 'border-[#FF6B35]/50 ring-1 ring-[#FF6B35]/30' : 'border-white/18'
            }`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {turn.speakerName || character?.name}
                  </span>
                  {character?.role && (
                    <span className="text-[10px] text-white/60 hidden sm:inline">
                      · {character.role}
                    </span>
                  )}
                  {turn.characterEmotion && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white/10 text-white/85 border border-white/15 backdrop-blur-sm uppercase font-semibold">
                      {turn.characterEmotion}
                    </span>
                  )}
                  {character?.voiceId && (
                    <span
                      title={`Voz asignada: ${character.voiceId}`}
                      className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-200 border border-amber-500/30 backdrop-blur-sm hidden sm:inline-flex items-center gap-1 font-medium"
                    >
                      <span>Voz {character.voiceId}</span>
                    </span>
                  )}
                </div>

                {/* Speak Character Audio with Interactive Feedback */}
                <button
                  onClick={() =>
                    handleTogglePlay(
                      turnKey,
                      turn.text,
                      turn.speaker,
                      turn.characterEmotion,
                      turn.speakerName || character?.name
                    )
                  }
                  className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    isPlayingThis
                      ? 'bg-[#FF6B35]/25 border-[#FF6B35]/60 text-[#FF6B35] shadow-sm shadow-[#FF6B35]/20 ring-1 ring-[#FF6B35]/40'
                      : isLoadingThis
                      ? 'bg-white/15 border-white/25 text-[#FF6B35]'
                      : 'text-white/70 hover:text-white hover:bg-white/15 border-transparent hover:border-white/20'
                  }`}
                  title={
                    isPlayingThis
                      ? 'Detener locución (reproduciendo)'
                      : isLoadingThis
                      ? 'Cargando voz...'
                      : 'Escuchar locución en español'
                  }
                >
                  {isLoadingThis ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF6B35]" />
                  ) : isPlayingThis ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-[#FF6B35]" />
                      <span className="text-[9px] font-bold text-[#FF6B35] animate-pulse hidden sm:inline">
                        Hablando...
                      </span>
                    </>
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Dialogue Text */}
              <p className="text-sm text-white/95 leading-relaxed font-normal">
                «{turn.text}»
              </p>

              {/* Multi-Character Secondary Response (e.g. Lucía reacting to Alejandro) */}
              {turn.secondaryResponse && (
                <div className="mt-3 pt-3 border-t border-white/12 space-y-1.5 bg-black/20 p-2.5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-300">
                        {turn.secondaryResponse.speakerName}
                      </span>
                      {turn.secondaryResponse.emotion && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white/10 text-white/80 border border-white/15 uppercase font-semibold">
                          {turn.secondaryResponse.emotion}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        handleTogglePlay(
                          `${turnKey}-secondary`,
                          turn.secondaryResponse!.text,
                          turn.secondaryResponse!.speakerId,
                          turn.secondaryResponse!.emotion,
                          turn.secondaryResponse!.speakerName
                        )
                      }
                      className={`p-1 rounded-lg border transition-all flex items-center gap-1 text-xs ${
                        playingTurnId === `${turnKey}-secondary`
                          ? 'bg-[#FF6B35]/25 border-[#FF6B35]/60 text-[#FF6B35]'
                          : 'text-white/60 hover:text-white border-transparent hover:bg-white/10'
                      }`}
                      title={`Escuchar a ${turn.secondaryResponse.speakerName}`}
                    >
                      {playingTurnId === `${turnKey}-secondary` ? (
                        <VolumeX className="w-3 h-3 text-[#FF6B35]" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                      <span className="text-[10px] font-medium hidden sm:inline">Voz</span>
                    </button>
                  </div>
                  <p className="text-xs text-white/90 italic leading-relaxed">
                    «{turn.secondaryResponse.text}»
                  </p>
                </div>
              )}

              {/* Consequence Notification Box */}
              {turn.worldChanges?.description && (
                <div className="mt-2.5 pt-2 border-t border-white/12 text-[11px] text-[#FF6B35] flex items-center gap-1.5 font-semibold bg-[#FF6B35]/10 px-2.5 py-1 rounded-xl border border-[#FF6B35]/25">
                  <span>⚡ Consecuencia:</span>
                  <span className="text-white/90 font-normal">{turn.worldChanges.description}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Live AI Director Thinking Indicator */}
      {isProcessing && (
        <div className="flex items-center gap-3 my-3 animate-in fade-in duration-200">
          <div className="w-9 h-9 rounded-xl bg-[#FF6B35]/15 border border-[#FF6B35]/30 flex items-center justify-center text-[#FF6B35] shadow-sm">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div className="p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/15 text-xs text-white/80 flex items-center gap-2 shadow-lg">
            <span className="inline-block w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse"></span>
            <span>El Director del Mundo interpreta tu decisión y evalúa consecuencias...</span>
          </div>
        </div>
      )}

      <div ref={streamBottomRef} />
    </div>
  );
};

