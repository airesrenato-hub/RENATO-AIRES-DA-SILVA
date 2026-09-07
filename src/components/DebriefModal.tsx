import React, { useState } from 'react';
import { DebriefReport, ConversationTurn, WorldVariables } from '../types';
import {
  X,
  Award,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  RotateCcw,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Send
} from 'lucide-react';

interface DebriefModalProps {
  report: DebriefReport | null;
  isLoading: boolean;
  onClose: () => void;
  onRestart: () => void;
  conversationHistory: ConversationTurn[];
  worldState: WorldVariables;
}

export const DebriefModal: React.FC<DebriefModalProps> = ({
  report,
  isLoading,
  onClose,
  onRestart,
  conversationHistory,
  worldState,
}) => {
  // "What If" simulation state
  const [whatIfInput, setWhatIfInput] = useState('');
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfResult, setWhatIfResult] = useState<any | null>(null);

  const handleWhatIfSubmit = async () => {
    if (!whatIfInput.trim() || whatIfLoading) return;
    setWhatIfLoading(true);
    try {
      const res = await fetch('/api/simulation/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalInput: conversationHistory.filter((t) => t.speaker === 'student').pop()?.text || '',
          alternativeInput: whatIfInput.trim(),
          currentContext: worldState,
        }),
      });
      const data = await res.json();
      setWhatIfResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setWhatIfLoading(false);
    }
  };

  const getEndingBadge = (type: string) => {
    switch (type) {
      case 'perfect':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'acceptable':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'chaotic':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'disastrous':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'unexpected':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal bg-[#161424]/95 backdrop-blur-2xl border border-white/20 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-white/[0.04] border-b border-white/12 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30 text-[10px] font-extrabold uppercase tracking-widest">
                Reflexión Pedagógica
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                TU INFORME DE COMUNICACIÓN
              </h2>
            </div>
            <p className="text-xs text-white/60">
              «No enseñar primero y simular después. Simular primero y convertir la experiencia en aprendizaje después.»
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <Sparkles className="w-8 h-8 text-[#FF6B35] animate-spin" />
              <h4 className="text-sm font-bold text-white">
                El Asesor Lingüístico está analizando tu actuación comunicativa...
              </h4>
              <p className="text-xs text-white/60 max-w-md">
                Evaluando fluidez, estrategias pragmáticas, resolución de conflictos y recursos léxicos utilizados en la simulación.
              </p>
            </div>
          ) : report ? (
            <>
              {/* Ending Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-white/[0.07] to-white/[0.03] border border-white/15 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getEndingBadge(
                        report.ending?.type || 'acceptable'
                      )}`}
                    >
                      {report.ending?.title}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed max-w-2xl">
                    {report.ending?.finalSummary || report.ending?.description}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={onRestart}
                    className="px-4 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#ff7e4f] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-[#FF6B35]/25"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Jugar de nuevo</span>
                  </button>
                </div>
              </div>

              {/* Perfil Comunicativo Oral (Voice Experience 2.0 Metrics) */}
              {report.communicativeProfile && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FF6B35]/15 via-black/40 to-black/60 border border-[#FF6B35]/30 backdrop-blur-xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎙️</span>
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        PERFIL DE COMUNICACIÓN ORAL (VOICE 2.0)
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-[#FF6B35] bg-[#FF6B35]/20 px-2.5 py-0.5 rounded-full border border-[#FF6B35]/30">
                      Evaluación Oral Formativa
                    </span>
                  </div>

                  {report.communicativeProfile.overallAssessment && (
                    <p className="text-xs text-white/90 leading-relaxed italic bg-white/5 p-3 rounded-xl border border-white/10">
                      «{report.communicativeProfile.overallAssessment}»
                    </p>
                  )}

                  {/* 5 Dimensional Acoustic & Pragmatic Bar Scales */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    {[
                      { label: 'Fluidez Oral', score: report.communicativeProfile.fluencyScore, color: 'bg-[#FF6B35]' },
                      { label: 'Interacción', score: report.communicativeProfile.interactionScore, color: 'bg-emerald-400' },
                      { label: 'Eficacia', score: report.communicativeProfile.efficacyScore, color: 'bg-amber-400' },
                      { label: 'Precisión', score: report.communicativeProfile.linguisticScore, color: 'bg-sky-400' },
                      { label: 'Vocabulario', score: report.communicativeProfile.vocabularyScore, color: 'bg-purple-400' },
                    ].map((m, idx) => (
                      <div key={idx} className="bg-black/40 p-2.5 rounded-xl border border-white/10 text-center space-y-1">
                        <span className="text-[10px] uppercase font-bold text-white/60 block truncate">{m.label}</span>
                        <div className="text-base font-black text-white">{m.score ?? 80}%</div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${m.color} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(100, Math.max(10, m.score ?? 80))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Momentos de Éxito Comunicativo */}
              {report.highlightMoments && report.highlightMoments.length > 0 && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 text-lg">✨</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Momentos de Éxito Comunicativo (Tus Mejores Respuestas)
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {report.highlightMoments.map((moment, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 space-y-2">
                        <div className="text-emerald-200 font-semibold text-xs italic">
                          «{moment.quote}»
                        </div>
                        <p className="text-[11px] text-white/70">
                          <strong className="text-white/90">Contexto:</strong> {moment.context}
                        </p>
                        <p className="text-[11px] text-white/70">
                          <strong className="text-emerald-300">Por qué funcionó:</strong> {moment.whyItWorked}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 🗣️ FLUIDEZ */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-2.5">
                  <div className="flex items-center gap-2 text-[#FF6B35] font-bold text-xs uppercase tracking-wider">
                    <span>🗣️</span>
                    <span>Fluidez y Desenvoltura</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {report.fluency.summary}
                  </p>
                  <ul className="space-y-1 pt-1 border-t border-white/10 text-xs text-white/60">
                    {report.fluency.positivePoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 🧠 RECURSOS LINGÜÍSTICOS */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-2.5">
                  <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider">
                    <span>🧠</span>
                    <span>Recursos Lingüísticos Usados</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                      Vocabulario clave activado:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.linguisticResources.vocabularyUsed.map((w, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[11px] text-white/90"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                      Estructuras gramaticales puestas en práctica:
                    </span>
                    <ul className="space-y-1 text-xs text-white/80">
                      {report.linguisticResources.grammaticalStructures.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-sky-400 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 🎯 EFICACIA COMUNICATIVA */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <span>🎯</span>
                    <span>Eficacia Comunicativa</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {report.communicativeEfficacy.outcomeDescription}
                  </p>
                  <div className="pt-1 border-t border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                      Negociaciones y acuerdos alcanzados:
                    </span>
                    <ul className="space-y-1 text-xs text-white/80">
                      {report.communicativeEfficacy.successfulNegotiations.map((neg, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">✓</span>
                          <span>{neg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 🤝 INTERACCIÓN */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-2.5">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                    <span>🤝</span>
                    <span>Interacción con Personajes</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {report.interactionQuality.adaptationToCharacters}
                  </p>
                  <p className="text-xs text-white/60 pt-1 border-t border-white/10 leading-relaxed">
                    <strong>Gestión de la presión:</strong> {report.interactionQuality.reactionToPressure}
                  </p>
                </div>
              </div>

              {/* Earned Badges */}
              {report.earnedBadges && report.earnedBadges.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-[#FF6B35]" />
                    <h4 className="stat-label text-white/70">
                      Insignias Comunicativas Conseguidas
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {report.earnedBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className="p-3 rounded-xl bg-[#FF6B35]/10 border border-[#FF6B35]/30 backdrop-blur-sm flex items-start gap-2.5"
                      >
                        <div className="text-xl">🏆</div>
                        <div>
                          <div className="text-xs font-bold text-white">
                            {badge.title}
                          </div>
                          <p className="text-[11px] text-white/70 leading-tight mt-0.5">
                            {badge.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ⚠️ PUNTOS A MEJORAR (Max 5 with ❌ vs ✅ and contextual explanation) */}
              <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/12 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6B35] flex items-center gap-2">
                    <span>⚠️ Puntos a Mejorar (Relevantes Pedagógicamente)</span>
                  </h4>
                  <span className="text-[10px] text-white/50">Máximo 5 observaciones clave</span>
                </div>

                {/* Oral Reformulations (Recasting) */}
                {report.improvementMoments && report.improvementMoments.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-amber-300 block">
                      Reformulaciones Nativas (Recasting Oral):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {report.improvementMoments.map((imp, i) => (
                        <div key={i} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1 text-xs">
                          <div className="text-rose-200">❌ Tu frase: «{imp.studentPhrase}»</div>
                          <div className="text-emerald-300 font-semibold">✅ Alternativa nativa: «{imp.nativeAlternative}»</div>
                          <p className="text-[11px] text-white/70 pt-1 leading-snug">{imp.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {report.pointsToImprove.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-[#FF6B35] uppercase tracking-wider border border-white/15">
                          {item.type}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="text-rose-200 font-mono bg-rose-500/15 p-2 rounded-xl border border-rose-500/30">
                          ❌ «{item.studentPhrase}»
                        </div>
                        <div className="text-emerald-200 font-mono bg-emerald-500/15 p-2 rounded-xl border border-emerald-500/30">
                          ✅ «{item.improvedPhrase}»
                        </div>
                      </div>

                      <p className="text-xs text-white/80 pt-1 leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ¿QUÉ HABRÍA PASADO SI...? (Interactive branching test) */}
              <div className="p-5 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/30 backdrop-blur-md space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#FF6B35]" />
                  <h4 className="stat-label text-[#FF6B35]">
                    ¿Qué habría pasado si...? (Simulación Alternativa)
                  </h4>
                </div>
                <p className="text-xs text-white/70">
                  Prueba una frase o estrategia distinta para ver cómo habrían reaccionado los personajes y cómo habría cambiado el mundo.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={whatIfInput}
                    onChange={(e) => setWhatIfInput(e.target.value)}
                    placeholder="Ej: «Si Marcos no tiene dinero, yo invito la gasolina y me lo devuelve luego»"
                    className="flex-1 bg-white/[0.05] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B35] backdrop-blur-md"
                  />
                  <button
                    onClick={handleWhatIfSubmit}
                    disabled={!whatIfInput.trim() || whatIfLoading}
                    className="px-4 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#ff7e4f] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#FF6B35]/25"
                  >
                    {whatIfLoading ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Explorar</span>
                  </button>
                </div>

                {whatIfResult && (
                  <div className="p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/15 text-xs space-y-2 animate-in fade-in duration-200">
                    <div>
                      <strong className="text-[#FF6B35]">Reacción alternativa:</strong>
                      <p className="text-white/90 italic mt-0.5">«{whatIfResult.alternativeReaction}»</p>
                    </div>
                    <div>
                      <strong className="text-amber-300">Consecuencia divergente:</strong>
                      <p className="text-white/80 mt-0.5">{whatIfResult.divergentConsequence}</p>
                    </div>
                    <div className="pt-2 border-t border-white/10 text-white/60">
                      <strong>Reflexión lingüística:</strong> {whatIfResult.pedagogicalInsight}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-white/60">
              No se ha podido cargar el informe de comunicación.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/12 bg-black/20 flex items-center justify-between">
          <button
            onClick={onRestart}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-all hover:border-[#FF6B35]/50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Volver a Jugar</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#ff7e4f] text-white font-bold text-xs transition-all shadow-md shadow-[#FF6B35]/30 hover:scale-105 active:scale-95"
          >
            Cerrar Informe
          </button>
        </div>
      </div>
    </div>
  );
};
