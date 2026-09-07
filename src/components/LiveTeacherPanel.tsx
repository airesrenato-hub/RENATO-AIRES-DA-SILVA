import React, { useState } from 'react';
import { WorldVariables, Experience, CEFRLevel } from '../types';
import {
  Radio,
  Pause,
  Play,
  Zap,
  Sliders,
  Eye,
  History,
  AlertTriangle,
  X,
  Send,
  Sparkles
} from 'lucide-react';

interface LiveTeacherPanelProps {
  isOpen: boolean;
  onClose: () => void;
  worldState: WorldVariables;
  experience: Experience;
  isPaused: boolean;
  onTogglePause: () => void;
  onInjectEvent: (customEventText: string) => void;
  onChangeDifficulty: (newLevel: CEFRLevel) => void;
  onForceTwist: (twistDescription: string) => void;
}

const PRESET_TWISTS = [
  'Avería repentina: el radiador del coche empieza a hervir en plena curva.',
  'Don Tomás llama exigiendo 80 € de fianza adicional en metálico antes de entregar la llave.',
  'Se va la señal de telefonía móvil y GPS en el cruce de montaña.',
  'Lucía se enfada y amenaza con coger el primer autobús de vuelta a la ciudad.',
  'Un vecino del pueblo ofrece su cochera y una barbacoa si le ayudan con unas cajas de manzana.',
];

export const LiveTeacherPanel: React.FC<LiveTeacherPanelProps> = ({
  isOpen,
  onClose,
  worldState,
  experience,
  isPaused,
  onTogglePause,
  onInjectEvent,
  onChangeDifficulty,
  onForceTwist,
}) => {
  const [customEvent, setCustomEvent] = useState('');
  const [activeTab, setActiveTab] = useState<'control' | 'state' | 'memories'>('control');

  if (!isOpen) return null;

  const handleSendCustomEvent = () => {
    if (!customEvent.trim()) return;
    onInjectEvent(customEvent.trim());
    setCustomEvent('');
  };

  return (
    <div className="fixed top-16 right-4 z-40 w-full max-w-md glass-panel bg-[#161424]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="px-5 py-3.5 bg-white/[0.05] border-b border-white/12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30 shadow-sm">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Consola del Profesor en Directo
            </h3>
            <p className="text-[10px] text-white/60">
              Dirección de aula interactiva (sin interrumpir la inmersión)
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-black/20 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('control')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'control'
              ? 'text-[#FF6B35] border-b-2 border-[#FF6B35] bg-[#FF6B35]/10 font-bold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Intervenciones</span>
        </button>
        <button
          onClick={() => setActiveTab('state')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'state'
              ? 'text-[#FF6B35] border-b-2 border-[#FF6B35] bg-[#FF6B35]/10 font-bold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Variables Ocultas</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
        {activeTab === 'control' && (
          <div className="space-y-4">
            {/* Pause / Resume */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div>
                <span className="font-bold text-white">
                  {isPaused ? 'Simulación Pausada' : 'Simulación Activa'}
                </span>
                <p className="text-[11px] text-white/60">
                  {isPaused
                    ? 'El alumno no puede enviar acciones mientras explicas algo en clase.'
                    : 'La conversación avanza en tiempo real.'}
                </p>
              </div>
              <button
                id="toggle-pause-btn"
                onClick={onTogglePause}
                className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md ${
                  isPaused
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'bg-[#FF6B35] hover:bg-[#ff7e4f] text-white shadow-[#FF6B35]/25'
                }`}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
              </button>
            </div>

            {/* Quick Presets for Dynamic Twists */}
            <div>
              <label className="block stat-label text-white/70 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#FF6B35]" />
                <span>Forzar Giro Narrativo Rápido</span>
              </label>
              <div className="space-y-1.5">
                {PRESET_TWISTS.map((twist, idx) => (
                  <button
                    key={idx}
                    onClick={() => onForceTwist(twist)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-[#FF6B35]/15 border border-white/10 hover:border-[#FF6B35]/40 text-[11px] text-white/80 hover:text-white transition-all shadow-sm"
                  >
                    ⚡ {twist}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Dynamic Event */}
            <div>
              <label className="block stat-label text-white/70 mb-1.5">
                Inyectar Acontecimiento Personalizado
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customEvent}
                  onChange={(e) => setCustomEvent(e.target.value)}
                  placeholder="Ej: Empieza a granizar con fuerza..."
                  className="flex-1 bg-white/[0.05] border border-white/15 rounded-xl px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B35] text-xs backdrop-blur-md"
                />
                <button
                  onClick={handleSendCustomEvent}
                  disabled={!customEvent.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#ff7e4f] disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-[#FF6B35]/25"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Difficulty shift */}
            <div>
              <label className="block stat-label text-white/70 mb-1.5">
                Ajustar Nivel MCER de la sesión
              </label>
              <div className="grid grid-cols-6 gap-1 bg-black/30 p-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CEFRLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => onChangeDifficulty(lvl)}
                    className={`py-1 text-center font-bold rounded-lg transition-all ${
                      worldState.language_level === lvl
                        ? 'bg-[#FF6B35] text-white shadow-md'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'state' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-white/60">Presupuesto exacto:</span>
                <span className="text-emerald-400 font-bold">{worldState.budget} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Nivel de estrés grupal:</span>
                <span className="text-rose-400 font-bold">{worldState.stress}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Confianza interpersonal:</span>
                <span className="text-indigo-300 font-bold">{worldState.trust}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Progreso de meta principal:</span>
                <span className="text-sky-300 font-bold">{worldState.goal_progress}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Ubicación id:</span>
                <span className="text-[#FF6B35] font-bold">{worldState.location}</span>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-white mb-2">
                Secretos y límites de los personajes (Solo visible para el profesor):
              </h5>
              <div className="space-y-2">
                {experience.characters.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm text-[11px]">
                    <div className="font-bold text-[#FF6B35]">{c.name}:</div>
                    <div className="text-white/70 italic mt-0.5">
                      Secreto: {c.secrets?.join('; ') || 'Ninguno'}
                    </div>
                    <div className="text-rose-300 mt-0.5">
                      Límite: {c.limits?.join('; ') || 'Ninguno'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
