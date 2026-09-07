import React from 'react';
import { WorldVariables, Location } from '../types';
import {
  Wallet,
  Clock,
  Flame,
  ShieldAlert,
  HeartHandshake,
  MapPin,
  Target,
  FileText
} from 'lucide-react';

interface WorldStatusBarProps {
  worldState: WorldVariables;
  currentLocation?: Location;
  onOpenMap: () => void;
  onOpenMissions: () => void;
  onOpenDebrief: () => void;
  turnCount: number;
}

export const WorldStatusBar: React.FC<WorldStatusBarProps> = ({
  worldState,
  currentLocation,
  onOpenMap,
  onOpenMissions,
  onOpenDebrief,
  turnCount,
}) => {
  // Stress color indicator
  const stressColor =
    worldState.stress > 65
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
      : worldState.stress > 35
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  // Budget color indicator
  const budgetColor =
    worldState.budget < 50
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30 font-bold'
      : worldState.budget < 120
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border-b border-white/15 px-4 py-2.5 text-xs shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Dynamic World State Indicators */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Budget */}
          <div
            id="hud-budget"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/18 text-white transition-all shadow-sm"
            title="Presupuesto grupal disponible"
          >
            <Wallet className="w-3.5 h-3.5 text-[#FF6B35]" />
            <div className="flex flex-col">
              <span className="stat-label text-[9px]">Presupuesto</span>
              <span className="text-xs font-bold text-[#FF6B35] leading-none">{worldState.budget} €</span>
            </div>
            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden ml-1 hidden sm:block">
              <div
                className="h-full bg-[#FF6B35] rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, (worldState.budget / 300) * 100))}%` }}
              />
            </div>
          </div>

          {/* Time & Day */}
          <div
            id="hud-time"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/18 text-white shadow-sm"
            title="Momento del fin de semana"
          >
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <div className="flex flex-col">
              <span className="stat-label text-[9px]">Momento</span>
              <span className="text-xs font-bold text-white/90 leading-none">
                {worldState.day} · {worldState.timeHour}:00
              </span>
            </div>
          </div>

          {/* Stress Level */}
          <div
            id="hud-stress"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/18 text-white shadow-sm transition-all"
            title="Nivel de tensión o estrés en el grupo"
          >
            <Flame className={`w-3.5 h-3.5 ${worldState.stress > 65 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
            <div className="flex flex-col">
              <span className="stat-label text-[9px]">Estrés</span>
              <span className={`text-xs font-bold leading-none ${worldState.stress > 65 ? 'text-rose-400' : 'text-amber-300'}`}>
                {worldState.stress}%
              </span>
            </div>
            <div className="w-10 h-1.5 bg-white/10 rounded-full overflow-hidden ml-1 hidden sm:block">
              <div
                className={`h-full rounded-full transition-all ${worldState.stress > 65 ? 'bg-rose-500' : 'bg-amber-400'}`}
                style={{ width: `${worldState.stress}%` }}
              />
            </div>
          </div>

          {/* Trust / Relationship */}
          <div
            id="hud-trust"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/18 text-white shadow-sm"
            title="Confianza del grupo"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-indigo-300" />
            <div className="flex flex-col">
              <span className="stat-label text-[9px]">Confianza</span>
              <span className="text-xs font-bold text-indigo-300 leading-none">
                {worldState.trust}%
              </span>
            </div>
          </div>

          {/* Location Badge */}
          <button
            id="hud-location-btn"
            onClick={onOpenMap}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-md border border-white/18 hover:border-[#FF6B35]/50 text-white transition-all group shadow-sm"
            title="Ver en el mapa del mundo"
          >
            <MapPin className="w-3.5 h-3.5 text-[#FF6B35] group-hover:scale-110 transition-transform" />
            <div className="flex flex-col text-left">
              <span className="stat-label text-[9px] text-[#FF6B35]">Ubicación</span>
              <span className="truncate max-w-[130px] sm:max-w-none text-xs font-semibold text-white/95 leading-none">
                {currentLocation ? currentLocation.name : 'En ruta'}
              </span>
            </div>
          </button>
        </div>

        {/* Action Controls: Missions, Map & Finish/Debrief */}
        <div className="flex items-center gap-2">
          {/* Mission Tracker Trigger */}
          <button
            id="hud-missions-btn"
            onClick={onOpenMissions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-md border border-white/18 hover:border-sky-400/50 text-white transition-all shadow-sm"
            title="Ver objetivos y misiones"
          >
            <Target className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline font-semibold">Misiones</span>
            <span className="px-1.5 py-0.2 rounded-full bg-sky-400/20 text-sky-300 text-[10px] font-bold border border-sky-400/30">
              {worldState.goal_progress}%
            </span>
          </button>

          {/* Map Trigger */}
          <button
            id="hud-map-btn"
            onClick={onOpenMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-md border border-white/18 hover:border-[#FF6B35]/50 text-white transition-all shadow-sm"
            title="Abrir mapa"
          >
            <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span className="hidden sm:inline font-semibold">Mapa</span>
          </button>

          {/* End & Debrief Button */}
          <button
            id="hud-debrief-btn"
            onClick={onOpenDebrief}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-rose-500 hover:from-[#ff7e4f] hover:to-rose-400 text-white font-bold border border-white/20 shadow-lg shadow-[#FF6B35]/25 hover:shadow-[#FF6B35]/40 transition-all"
            title="Finalizar simulación y generar informe lingüístico (Debrief)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Informe (Debrief)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
