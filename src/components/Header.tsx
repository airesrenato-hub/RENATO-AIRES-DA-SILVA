import React from 'react';
import { CEFRLevel, SpanishVariety } from '../types';
import { Sparkles, Radio, Volume2, VolumeX, RotateCcw, GraduationCap, Compass, Headphones } from 'lucide-react';

interface HeaderProps {
  currentLevel: CEFRLevel;
  onLevelChange: (level: CEFRLevel) => void;
  variety: SpanishVariety;
  onVarietyChange: (v: SpanishVariety) => void;
  mode: 'student' | 'teacher';
  onModeChange: (m: 'student' | 'teacher') => void;
  liveTeacherOpen: boolean;
  onToggleLiveTeacher: () => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onResetExperience: () => void;
  experienceTitle: string;
  isImmersiveMode?: boolean;
  onToggleImmersiveMode?: () => void;
}

const VARIETIES: { id: SpanishVariety; label: string; flag: string }[] = [
  { id: 'spain', label: 'España', flag: '🇪🇸' },
  { id: 'mexico', label: 'México', flag: '🇲🇽' },
  { id: 'argentina', label: 'Argentina', flag: '🇦🇷' },
  { id: 'colombia', label: 'Colombia', flag: '🇨🇴' },
  { id: 'chile', label: 'Chile', flag: '🇨🇱' },
  { id: 'peru', label: 'Perú', flag: '🇵🇪' },
  { id: 'international', label: 'Internacional', flag: '🌎' },
];

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const Header: React.FC<HeaderProps> = ({
  currentLevel,
  onLevelChange,
  variety,
  onVarietyChange,
  mode,
  onModeChange,
  liveTeacherOpen,
  onToggleLiveTeacher,
  autoSpeak,
  onToggleAutoSpeak,
  onResetExperience,
  experienceTitle,
  isImmersiveMode = false,
  onToggleImmersiveMode,
}) => {
  return (
    <header className="bg-white/[0.05] backdrop-blur-xl border-b border-white/15 sticky top-0 z-40 px-4 py-2.5 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Concept */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#ff8f5e] flex items-center justify-center text-white font-black tracking-wider shadow-lg shadow-[#FF6B35]/25 border border-white/25">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold tracking-wider text-white text-base md:text-lg flex items-center gap-1.5">
                <span className="text-[#FF6B35]">SPANISH</span> AS A SYSTEM
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-[#FF6B35] border border-white/20 backdrop-blur-md">
                Simulación Viva
              </span>
            </div>
            <p className="text-xs text-white/70 hidden sm:block truncate max-w-md">
              «Habla español para hacer que algo suceda» · <span className="text-white/90 font-medium">{experienceTitle}</span>
            </p>
          </div>
        </div>

        {/* Global Controls & Selectors */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Level Selector */}
          <div className="flex items-center bg-black/35 backdrop-blur-md rounded-xl p-0.5 border border-white/15">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                id={`level-select-${lvl}`}
                onClick={() => onLevelChange(lvl)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  currentLevel === lvl
                    ? 'bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title={`Nivel MCER ${lvl}`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Spanish Variety Dropdown */}
          <div className="relative">
            <select
              id="variety-selector"
              value={variety}
              onChange={(e) => onVarietyChange(e.target.value as SpanishVariety)}
              className="bg-black/35 backdrop-blur-md text-xs font-medium text-white border border-white/15 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#FF6B35] cursor-pointer hover:bg-white/5 transition-all"
            >
              {VARIETIES.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#1a1c2c] text-white">
                  {v.flag} {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* TTS Audio Toggle */}
          <button
            id="audio-tts-toggle"
            onClick={onToggleAutoSpeak}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all backdrop-blur-md ${
              autoSpeak
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-sm'
                : 'bg-white/5 border-white/15 text-white/50 hover:text-white/80 hover:bg-white/10'
            }`}
            title={autoSpeak ? 'Voz de personajes activada (TTS)' : 'Voz desactivada'}
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline font-medium">Voz</span>
          </button>

          {/* Immersive Voice 2.0 Mode Toggle */}
          {onToggleImmersiveMode && (
            <button
              id="immersive-mode-toggle"
              onClick={onToggleImmersiveMode}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all backdrop-blur-md ${
                isImmersiveMode
                  ? 'bg-[#FF6B35]/25 border-[#FF6B35]/50 text-[#FF6B35] ring-1 ring-[#FF6B35]/40 shadow-md shadow-[#FF6B35]/20'
                  : 'bg-white/5 border-white/15 text-white/75 hover:text-white hover:bg-white/10'
              }`}
              title="Activar Modo Inmersivo (Conversación Oral 2.0)"
            >
              <Headphones className={`w-3.5 h-3.5 ${isImmersiveMode ? 'text-[#FF6B35] animate-pulse' : ''}`} />
              <span className="hidden sm:inline">Voz 2.0</span>
            </button>
          )}

          {/* Live Teacher Intervention Mode Button */}
          <button
            id="live-teacher-toggle-btn"
            onClick={onToggleLiveTeacher}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all backdrop-blur-md ${
              liveTeacherOpen
                ? 'bg-purple-600/30 border-purple-400/50 text-purple-200 ring-1 ring-purple-400/40 shadow-md shadow-purple-500/20'
                : 'bg-white/5 border-white/15 text-white/75 hover:text-white hover:bg-white/10'
            }`}
            title="Abrir consola de Profesor en Directo (Girar trama, inyectar eventos)"
          >
            <Radio className={`w-3.5 h-3.5 ${liveTeacherOpen ? 'text-purple-300 animate-pulse' : ''}`} />
            <span className="hidden sm:inline">En Directo</span>
          </button>

          {/* Mode Switcher: Student vs Teacher */}
          <div className="flex items-center bg-black/35 backdrop-blur-md rounded-xl p-0.5 border border-white/15">
            <button
              id="mode-student-btn"
              onClick={() => onModeChange('student')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                mode === 'student'
                  ? 'bg-white/15 text-white font-bold border border-white/20 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#FF6B35]" />
              <span>Alumno</span>
            </button>
            <button
              id="mode-teacher-btn"
              onClick={() => onModeChange('teacher')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                mode === 'teacher'
                  ? 'bg-white/15 text-purple-200 font-bold border border-white/20 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span>Profesor</span>
            </button>
          </div>

          {/* Reset Experience Button */}
          <button
            id="reset-experience-btn"
            onClick={onResetExperience}
            className="p-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/15 text-white/70 hover:text-rose-400 hover:border-rose-400/40 hover:bg-rose-500/10 transition-all"
            title="Reiniciar mundo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
