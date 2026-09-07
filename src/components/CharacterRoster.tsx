import React, { useState } from 'react';
import { Character } from '../types';
import { User, Shield, Smile, Frown, AlertCircle, Info, ChevronRight, X } from 'lucide-react';

interface CharacterRosterProps {
  characters: Character[];
  activeSpeakerId?: string;
}

export const CharacterRoster: React.FC<CharacterRosterProps> = ({
  characters,
  activeSpeakerId,
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Helper for emotion color
  const getEmotionBadge = (emotion: string) => {
    switch (emotion) {
      case 'animada':
      case 'entusiasmado':
      case 'aliviado':
        return 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30';
      case 'preocupado':
      case 'nervioso':
        return 'text-amber-300 bg-amber-500/15 border-amber-400/30';
      case 'enfadado':
      case 'estresado':
        return 'text-rose-300 bg-rose-500/15 border-rose-400/30';
      default:
        return 'text-white/70 bg-white/10 border-white/15';
    }
  };

  return (
    <>
      <div className="bg-white/[0.03] backdrop-blur-md border-b border-white/12 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="stat-label flex items-center gap-1.5 text-white/75">
              <User className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span>Personajes en Escena</span>
            </h3>
            <span className="text-[11px] text-white/50">
              Toca un personaje para ver su perfil comunicativo
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {characters.map((char) => {
              const isSpeaking = activeSpeakerId === char.id;

              return (
                <div
                  key={char.id}
                  id={`char-card-${char.id}`}
                  onClick={() => setSelectedCharacter(char)}
                  className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 backdrop-blur-md ${
                    isSpeaking
                      ? 'bg-[#FF6B35]/15 border-[#FF6B35] shadow-lg shadow-[#FF6B35]/20 ring-1 ring-[#FF6B35]/50'
                      : 'bg-white/[0.05] border-white/12 hover:border-white/25 hover:bg-white/[0.09]'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={char.avatar}
                      alt={char.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-sm"
                    />
                    {isSpeaking && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B35] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6B35]"></span>
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FF6B35] transition-colors">
                        {char.name}
                      </h4>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded border font-medium uppercase tracking-tight backdrop-blur-sm ${getEmotionBadge(
                          char.currentEmotion
                        )}`}
                      >
                        {char.currentEmotion}
                      </span>
                    </div>

                    <p className="text-[10px] text-white/60 truncate mt-0.5">
                      {char.role}
                    </p>

                    {/* Trust indicator mini bar */}
                    <div className="mt-1 flex items-center gap-1.5 text-[9px] text-white/50">
                      <span>Confianza</span>
                      <div className="flex-1 bg-white/10 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-[#FF6B35] h-full rounded-full transition-all"
                          style={{ width: `${char.trust}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Character Profile Modal */}
      {selectedCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-modal bg-[#161424]/90 backdrop-blur-2xl border border-white/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 border-b border-white/12 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCharacter.avatar}
                  alt={selectedCharacter.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-[#FF6B35]/60 shadow-md"
                />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedCharacter.name}
                  </h3>
                  <p className="text-xs text-[#FF6B35] font-semibold">
                    {selectedCharacter.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCharacter(null)}
                className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div>
                <h5 className="stat-label text-white/60 mb-1">
                  Personalidad
                </h5>
                <p className="text-white/90 leading-relaxed bg-white/[0.04] p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                  {selectedCharacter.personality}
                </p>
              </div>

              <div>
                <h5 className="stat-label text-white/60 mb-1">
                  Objetivo personal en el viaje
                </h5>
                <p className="text-white/90 leading-relaxed bg-white/[0.04] p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                  {selectedCharacter.goal}
                </p>
              </div>

              <div>
                <h5 className="stat-label text-white/60 mb-1">
                  Forma de hablar & registro
                </h5>
                <p className="text-white/80 italic bg-white/[0.04] p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                  {selectedCharacter.speechStyle} (Registro {selectedCharacter.register})
                </p>
              </div>

              <div>
                <h5 className="stat-label text-white/60 mb-1">
                  Información conocida
                </h5>
                <ul className="space-y-1.5 text-white/80">
                  {selectedCharacter.knownInfo.map((info, i) => (
                    <li key={i} className="flex items-start gap-2 bg-white/[0.03] p-2 rounded-lg border border-white/5">
                      <span className="text-[#FF6B35] font-bold">•</span>
                      <span>{info}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-white/12 flex items-center justify-between text-white/70">
                <span>Nivel de confianza actual:</span>
                <span className="font-bold text-[#FF6B35] text-sm">{selectedCharacter.trust}%</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-white/12 bg-black/20 flex justify-end">
              <button
                onClick={() => setSelectedCharacter(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition-all hover:border-[#FF6B35]/50"
              >
                Volver a la simulación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
