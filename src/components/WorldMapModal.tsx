import React from 'react';
import { Location } from '../types';
import { X, MapPin, CheckCircle2, Lock, Navigation } from 'lucide-react';

interface WorldMapModalProps {
  locations: Location[];
  currentLocationId: string;
  onClose: () => void;
  onSelectLocation?: (locId: string) => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  locations,
  currentLocationId,
  onClose,
  onSelectLocation,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal bg-[#161424]/90 backdrop-blur-2xl border border-white/20 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30 shadow-sm">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Mapa del Mundo
              </h2>
              <p className="text-xs text-white/60">
                Ubicaciones del viaje. Los lugares se desbloquean según tus decisiones y el avance de la historia.
              </p>
            </div>
          </div>
          <button
            id="close-map-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Map Canvas / Path */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Schematic Route Overview */}
          <div className="relative p-6 rounded-2xl bg-white/[0.04] border border-white/12 backdrop-blur-md">
            <div className="stat-label text-white/70 mb-4 flex items-center gap-2">
              <span>Ruta del Fin de Semana</span>
              <span className="h-px flex-1 bg-white/10"></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {locations.map((loc, idx) => {
                const isCurrent = loc.id === currentLocationId;
                const isUnlocked = loc.unlocked;

                return (
                  <div
                    key={loc.id}
                    id={`map-node-${loc.id}`}
                    className={`relative p-4 rounded-xl border transition-all backdrop-blur-md ${
                      isCurrent
                        ? 'bg-[#FF6B35]/15 border-[#FF6B35] shadow-lg shadow-[#FF6B35]/20 ring-1 ring-[#FF6B35]/50'
                        : isUnlocked
                        ? 'bg-white/[0.05] border-white/12 hover:border-white/25 hover:bg-white/[0.08]'
                        : 'bg-white/[0.02] border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-white/10 text-white/70">
                          0{idx + 1}
                        </span>
                        <h4 className="font-semibold text-sm text-white">
                          {loc.name}
                        </h4>
                      </div>
                      {isCurrent ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#FF6B35] px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                          <MapPin className="w-3 h-3" /> Aquí
                        </span>
                      ) : isUnlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-white/40" />
                      )}
                    </div>

                    <p className="text-xs text-white/70 leading-relaxed">
                      {loc.description}
                    </p>

                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                      <span className={isUnlocked ? 'text-emerald-300 font-medium' : 'text-white/40'}>
                        {isUnlocked ? 'Desbloqueado' : 'Por explorar'}
                      </span>
                      {isUnlocked && !isCurrent && onSelectLocation && (
                        <button
                          onClick={() => onSelectLocation(loc.id)}
                          className="text-[#FF6B35] hover:text-[#ff8f5e] font-semibold transition-colors"
                        >
                          Ir aquí
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/30 backdrop-blur-md text-xs text-white/90 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#FF6B35] shrink-0" />
            <span>
              <strong>Nota de inmersión:</strong> Para desplazarte a un lugar durante la simulación, menciónalo de forma natural en tu intervención (ejemplo: <em>«Propongo que paremos en el pueblo de San Millán a revisar el coche»</em>). El Director del Mundo actualizará tu posición en el mapa.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/12 bg-black/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition-all hover:border-[#FF6B35]/50"
          >
            Cerrar mapa
          </button>
        </div>
      </div>
    </div>
  );
};
