import React from 'react';
import { Mission } from '../types';
import { X, Target, Award, CheckCircle2, Circle } from 'lucide-react';

interface MissionsDrawerProps {
  mainMission: Mission;
  secondaryMissions: Mission[];
  onClose: () => void;
}

export const MissionsDrawer: React.FC<MissionsDrawerProps> = ({
  mainMission,
  secondaryMissions,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal bg-[#161424]/90 backdrop-blur-2xl border border-white/20 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-400/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Objetivos del Viaje</h2>
              <p className="text-xs text-white/60">
                Logros prácticos y dinámicos a resolver mediante la comunicación.
              </p>
            </div>
          </div>
          <button
            id="close-missions-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Main Mission */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#FF6B35]/20 to-white/[0.04] border border-[#FF6B35]/40 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold tracking-wider bg-[#FF6B35] text-white shadow-sm">
                Misión Principal
              </span>
              <span className="text-xs font-bold text-[#FF6B35]">
                {mainMission.completed ? '¡Completada!' : `${mainMission.progressPercent}% completado`}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {mainMission.title}
            </h3>
            <p className="text-xs text-white/80 leading-relaxed">
              {mainMission.description}
            </p>
            {/* Progress bar */}
            <div className="mt-3.5 w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-[#FF6B35] h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${mainMission.progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Secondary Missions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-white/60" />
              <h4 className="stat-label text-white/70">
                Misiones Secundarias (Opcionales)
              </h4>
            </div>

            <div className="space-y-3">
              {secondaryMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm flex items-start gap-3 hover:border-white/20 transition-all"
                >
                  <div className="mt-0.5">
                    {mission.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/30 shrink-0" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-xs font-bold text-white">
                        {mission.title}
                      </h5>
                      <span className="text-[10px] text-white/60 font-medium">
                        {mission.completed ? 'Completado' : `${mission.progressPercent}%`}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 mt-1 leading-relaxed">
                      {mission.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/12 bg-black/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition-all hover:border-[#FF6B35]/50"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
