import React, { useState, useEffect } from 'react';
import {
  Experience,
  WorldVariables,
  ConversationTurn,
  CEFRLevel,
  SpanishVariety,
  DebriefReport,
  Location,
  Mission
} from './types';
import { DEFAULT_EXPERIENCES } from './data/experiences';
import { Header } from './components/Header';
import { WorldStatusBar } from './components/WorldStatusBar';
import { CharacterRoster } from './components/CharacterRoster';
import { DialogueStream } from './components/DialogueStream';
import { ActionInputBar } from './components/ActionInputBar';
import { WorldMapModal } from './components/WorldMapModal';
import { MissionsDrawer } from './components/MissionsDrawer';
import { LiveTeacherPanel } from './components/LiveTeacherPanel';
import { DebriefModal } from './components/DebriefModal';
import { TeacherCreatorView } from './components/TeacherCreatorView';
import { ImmersiveVoiceStage } from './components/ImmersiveVoiceStage';
import { VoiceDebugPanel } from './components/VoiceDebugPanel';
import { playDialogueAudio, unlockMobileAudio, playTestTone, stopActiveAudio, deduplicateSpokenText } from './utils/audio';

export default function App() {
  // Active Experience & Configuration
  const [experiences, setExperiences] = useState<Experience[]>(DEFAULT_EXPERIENCES);
  const [currentExpIndex, setCurrentExpIndex] = useState<number>(0);
  const currentExperience = experiences[currentExpIndex] || DEFAULT_EXPERIENCES[0];

  const [currentLevel, setCurrentLevel] = useState<CEFRLevel>(currentExperience.level);
  const [variety, setVariety] = useState<SpanishVariety>(currentExperience.variety);
  const [mode, setMode] = useState<'student' | 'teacher'>('student');
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [isImmersiveMode, setIsImmersiveMode] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  // Dynamic World Simulation State
  const [worldState, setWorldState] = useState<WorldVariables>(currentExperience.initialState);
  const [locations, setLocations] = useState<Location[]>(currentExperience.locations);
  const [mainMission, setMainMission] = useState<Mission>(currentExperience.mainMission);
  const [secondaryMissions, setSecondaryMissions] = useState<Mission[]>(
    currentExperience.secondaryMissions
  );

  // Conversation Stream
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | undefined>(undefined);

  // Modals & Drawers
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState<boolean>(false);
  const [isLiveTeacherOpen, setIsLiveTeacherOpen] = useState<boolean>(false);
  const [isDebriefOpen, setIsDebriefOpen] = useState<boolean>(false);

  // Simulation Control
  const [isSimulationPaused, setIsSimulationPaused] = useState<boolean>(false);
  const [debriefReport, setDebriefReport] = useState<DebriefReport | null>(null);
  const [isDebriefLoading, setIsDebriefLoading] = useState<boolean>(false);

  // Initialize turns when experience changes or resets
  const initExperienceSession = (exp: Experience) => {
    setWorldState({
      ...exp.initialState,
      language_level: currentLevel,
      variety: variety,
    });
    setLocations(exp.locations);
    setMainMission(exp.mainMission);
    setSecondaryMissions(exp.secondaryMissions);

    // Initial contextual turns based on experience
    const initialTurns: ConversationTurn[] = [
      {
        id: `turn-intro-${Date.now()}`,
        speaker: 'narrator',
        speakerName: 'El Director del Mundo',
        text: `${exp.setting} Son las ${exp.initialState.timeHour}:00 del ${exp.initialState.day}. El viaje acaba de comenzar, pero las primeras decisiones ya no pueden esperar.`,
        timestamp: Date.now(),
      },
    ];

    if (exp.id === 'fin-de-semana-que-se-complica') {
      initialTurns.push(
        {
          id: `turn-m1-${Date.now()}`,
          speaker: 'marcos',
          speakerName: 'Marcos',
          text: 'Oye... antes de meternos en la autovía tenemos que parar a repostar sí o sí. La aguja de la gasolina está rozando la reserva y mi tarjeta me da error en el cajero. ¿Podemos coger 50 pavos ya del fondo común?',
          characterEmotion: 'nervioso',
          timestamp: Date.now() + 1,
        },
        {
          id: `turn-l1-${Date.now()}`,
          speaker: 'lucia',
          speakerName: 'Lucía',
          text: '¡Ni hablar! Si empezamos gastando 50 euros de golpe en gasolina antes de salir de la ciudad, no nos va a llegar para la fianza de Don Tomás ni para cenar el sábado. ¿Por qué no echamos solo 20 y vemos luego?',
          characterEmotion: 'preocupada',
          timestamp: Date.now() + 2,
        }
      );
    } else if (exp.characters.length > 0) {
      const firstChar = exp.characters[0];
      initialTurns.push({
        id: `turn-first-${Date.now()}`,
        speaker: firstChar.id,
        speakerName: firstChar.name,
        text: `Hola, ¡menos mal que estás aquí! Tenemos que organizarnos rápido porque se nos echa el tiempo encima. ¿Cómo lo ves tú?`,
        characterEmotion: firstChar.currentEmotion,
        timestamp: Date.now() + 1,
      });
    }

    setTurns(initialTurns);
    setDebriefReport(null);
  };

  useEffect(() => {
    initExperienceSession(currentExperience);
  }, [currentExpIndex]);

  // Handle student action
  const handleSendMessage = async (rawText: string) => {
    if (isSimulationPaused || isProcessing) return;

    const text = deduplicateSpokenText(rawText);
    if (!text) return;

    // Interrupt any active character audio immediately upon student speaking/sending!
    stopActiveAudio();
    unlockMobileAudio();

    const studentTurn: ConversationTurn = {
      id: `student-${Date.now()}`,
      speaker: 'student',
      speakerName: 'Tú',
      text,
      timestamp: Date.now(),
    };

    const updatedHistory = [...turns, studentTurn];
    setTurns(updatedHistory);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/simulation/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentInput: text,
          currentExperience,
          currentWorldState: worldState,
          conversationHistory: updatedHistory.slice(-6),
          variety,
          level: currentLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error procesando turno');
      }

      // Update student turn with recognized strategy
      if (data.communicativeStrategy) {
        studentTurn.communicativeStrategy = data.communicativeStrategy;
      }

      // Apply dynamic consequences to the world state
      const nextTurns = [...updatedHistory];

      if (data.worldChanges) {
        const delta = data.worldChanges;
        setWorldState((prev) => {
          const next = { ...prev };
          if (delta.budgetDelta !== undefined) next.budget = Math.max(0, next.budget + delta.budgetDelta);
          if (delta.stressDelta !== undefined)
            next.stress = Math.min(100, Math.max(0, next.stress + delta.stressDelta));
          if (delta.trustDelta !== undefined)
            next.trust = Math.min(100, Math.max(0, next.trust + delta.trustDelta));
          if (delta.relationshipDelta !== undefined)
            next.relationships = Math.min(100, Math.max(-50, next.relationships + delta.relationshipDelta));
          if (delta.goalProgressDelta !== undefined)
            next.goal_progress = Math.min(100, Math.max(0, next.goal_progress + delta.goalProgressDelta));
          if (delta.timeHourDelta !== undefined) next.timeHour = (next.timeHour + delta.timeHourDelta) % 24;
          if (delta.newLocationId) next.location = delta.newLocationId;
          return next;
        });

        // Update missions progress
        if (delta.goalProgressDelta) {
          setMainMission((prev) => ({
            ...prev,
            progressPercent: Math.min(100, prev.progressPercent + delta.goalProgressDelta),
            completed: prev.progressPercent + delta.goalProgressDelta >= 100,
          }));
        }

        // Unlock locations if needed
        if (delta.newLocationId) {
          setLocations((prev) =>
            prev.map((loc) =>
              loc.id === delta.newLocationId ? { ...loc, unlocked: true, isCurrent: true } : { ...loc, isCurrent: false }
            )
          );
        }
      }

      // If an unexpected narrative event took place, append narrator card
      if (data.narrativeEvent) {
        nextTurns.push({
          id: `event-${Date.now()}`,
          speaker: 'narrator',
          speakerName: 'Acontecimiento',
          text: data.narrativeEvent,
          worldChanges: data.worldChanges,
          timestamp: Date.now() + 1,
        });
      }

      // Append character reply with optional secondary response
      if (data.characterResponse) {
        const charResp = data.characterResponse;
        setActiveSpeakerId(charResp.speakerId);

        nextTurns.push({
          id: `char-${Date.now()}`,
          speaker: charResp.speakerId,
          speakerName: charResp.speakerName,
          text: charResp.text,
          characterEmotion: charResp.emotion,
          secondaryResponse: data.secondaryResponse || undefined,
          worldChanges: !data.narrativeEvent ? data.worldChanges : undefined,
          timestamp: Date.now() + 2,
        });

        // Natural continuous audio sequencing for characters with independent voices
        if (autoSpeak && charResp.text) {
          const char = currentExperience?.characters?.find(
            (c) => c.id === charResp.speakerId
          );
          playDialogueAudio(charResp.text, {
            speakerId: charResp.speakerId,
            speakerName: charResp.speakerName || char?.name,
            variety,
            emotion: charResp.emotion,
            character: char,
            characters: currentExperience?.characters,
            voiceId: charResp.voiceId || char?.voice?.voiceId || char?.voiceId,
            gender: char?.gender,
            pitch: char?.voice?.pitch ?? char?.voicePitch,
            rate: (char?.voice?.speed ?? char?.voiceRate ?? 1.0) * speechRate,
            provider: char?.voice?.provider,
            onEnd: () => {
              // If there is a secondary response from another character, play it sequentially with independent voice
              if (data.secondaryResponse && data.secondaryResponse.text) {
                setTimeout(() => {
                  const secChar = currentExperience?.characters?.find(
                    (c) => c.id === data.secondaryResponse.speakerId
                  );
                  setActiveSpeakerId(data.secondaryResponse.speakerId);
                  playDialogueAudio(data.secondaryResponse.text, {
                    speakerId: data.secondaryResponse.speakerId,
                    speakerName: data.secondaryResponse.speakerName || secChar?.name,
                    variety,
                    emotion: data.secondaryResponse.emotion,
                    character: secChar,
                    characters: currentExperience?.characters,
                    voiceId: data.secondaryResponse.voiceId || secChar?.voice?.voiceId || secChar?.voiceId,
                    gender: secChar?.gender,
                    pitch: secChar?.voice?.pitch ?? secChar?.voicePitch,
                    rate: (secChar?.voice?.speed ?? secChar?.voiceRate ?? 1.0) * speechRate,
                    provider: secChar?.voice?.provider,
                  });
                }, 350);
              }
            },
          });
        }
      }

      setTurns(nextTurns);

      // Check if simulation reached its climax or completion
      if (data.isMissionComplete) {
        handleTriggerDebrief();
      }
    } catch (err) {
      console.error('Error in simulation turn:', err);
      // Fallback in case of server error
      const fallbackTurn: ConversationTurn = {
        id: `fb-${Date.now()}`,
        speaker: 'alejandro',
        speakerName: 'Alejandro',
        text: 'Bueno, entiendo lo que dices. Déjame pensar cómo lo organizamos para que nadie salga perdiendo.',
        characterEmotion: 'pensativo',
        timestamp: Date.now(),
      };
      setTurns([...updatedHistory, fallbackTurn]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger Debrief Report
  const handleTriggerDebrief = async () => {
    setIsDebriefOpen(true);
    setIsDebriefLoading(true);

    try {
      const res = await fetch('/api/simulation/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: turns,
          finalWorldState: worldState,
          experience: currentExperience,
          level: currentLevel,
          variety,
        }),
      });

      const report = await res.json();
      setDebriefReport(report);
    } catch (err) {
      console.error('Debrief error:', err);
    } finally {
      setIsDebriefLoading(false);
    }
  };

  // Live Teacher Handlers
  const handleTeacherInjectEvent = (eventText: string) => {
    const eventTurn: ConversationTurn = {
      id: `teacher-ev-${Date.now()}`,
      speaker: 'narrator',
      speakerName: 'Intervención Docente',
      text: `⚡ ${eventText}`,
      timestamp: Date.now(),
    };
    setTurns((prev) => [...prev, eventTurn]);
    setWorldState((prev) => ({ ...prev, stress: Math.min(100, prev.stress + 10) }));
  };

  const handleTeacherForceTwist = (twist: string) => {
    const twistTurn: ConversationTurn = {
      id: `teacher-twist-${Date.now()}`,
      speaker: 'narrator',
      speakerName: 'Giro Narrativo en Directo',
      text: `⚠️ ¡GIRO INESPERADO! ${twist}`,
      timestamp: Date.now(),
    };
    setTurns((prev) => [...prev, twistTurn]);
    setWorldState((prev) => ({ ...prev, stress: Math.min(100, prev.stress + 15) }));
  };

  // Publish newly generated experience from Teacher Creator
  const handlePublishExperience = (newExp: Experience) => {
    setExperiences((prev) => [newExp, ...prev]);
    setCurrentExpIndex(0);
    setMode('student');
    initExperienceSession(newExp);
  };

  const currentLocation = locations.find((l) => l.id === worldState.location);

  return (
    <div className="min-h-screen text-white flex flex-col font-sans selection:bg-[#FF6B35] selection:text-white relative">
      {/* Top Main Navigation Header */}
      <Header
        currentLevel={currentLevel}
        onLevelChange={(lvl) => {
          setCurrentLevel(lvl);
          setWorldState((prev) => ({ ...prev, language_level: lvl }));
        }}
        variety={variety}
        onVarietyChange={(v) => {
          setVariety(v);
          setWorldState((prev) => ({ ...prev, variety: v }));
        }}
        mode={mode}
        onModeChange={setMode}
        liveTeacherOpen={isLiveTeacherOpen}
        onToggleLiveTeacher={() => setIsLiveTeacherOpen(!isLiveTeacherOpen)}
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => {
          const nextState = !autoSpeak;
          setAutoSpeak(nextState);
          unlockMobileAudio();
          if (nextState) {
            playTestTone();
          }
        }}
        onResetExperience={() => initExperienceSession(currentExperience)}
        experienceTitle={currentExperience.title}
        isImmersiveMode={isImmersiveMode}
        onToggleImmersiveMode={() => setIsImmersiveMode(!isImmersiveMode)}
      />

      {/* Mode Selection Views */}
      {mode === 'teacher' ? (
        <main className="flex-1 overflow-y-auto">
          <TeacherCreatorView
            onPublishExperience={handlePublishExperience}
            currentExperience={currentExperience}
            analytics={{
              turnsCount: turns.length,
              studentWordCountAvg: Math.round(
                turns
                  .filter((t) => t.speaker === 'student')
                  .reduce((acc, t) => acc + t.text.split(' ').length, 0) /
                  Math.max(1, turns.filter((t) => t.speaker === 'student').length)
              ),
              frictionPoints: [
                'Tensión inicial sobre el uso del fondo común en la gasolinera.',
                'Dificultad para coordinar la hora de llegada con Don Tomás.',
              ],
              positiveStrategies: [
                'Propuso dividir el gasto de gasolina a partes iguales.',
                'Empleó fórmulas de cortesía y justificación («Si te parece bien...»).',
              ],
            }}
          />
        </main>
      ) : isImmersiveMode ? (
        /* Immersive Voice 2.0 Acoustic Stage */
        <ImmersiveVoiceStage
          characters={currentExperience.characters}
          turns={turns}
          worldState={worldState}
          variety={variety}
          isProcessing={isProcessing}
          activeSpeakerId={activeSpeakerId}
          onSendMessage={handleSendMessage}
          onExitImmersive={() => setIsImmersiveMode(false)}
          speechRate={speechRate}
          onSpeechRateChange={setSpeechRate}
        />
      ) : (
        <>
          {/* World Dynamic State HUD Bar */}
          <WorldStatusBar
            worldState={worldState}
            currentLocation={currentLocation}
            onOpenMap={() => setIsMapOpen(true)}
            onOpenMissions={() => setIsMissionsOpen(true)}
            onOpenDebrief={handleTriggerDebrief}
            turnCount={turns.length}
          />

          {/* Character Roster */}
          <CharacterRoster
            characters={currentExperience.characters}
            activeSpeakerId={activeSpeakerId}
          />

          {/* Main Simulation Narrative Flow */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            <DialogueStream
              turns={turns}
              characters={currentExperience.characters}
              variety={variety}
              isProcessing={isProcessing}
            />

            {/* Action Input Bar */}
            <ActionInputBar
              onSendMessage={handleSendMessage}
              disabled={isProcessing || isSimulationPaused}
              variety={variety}
              onToggleImmersive={() => setIsImmersiveMode(true)}
              isImmersive={isImmersiveMode}
            />
          </main>
        </>
      )}

      {/* Floating Live Teacher Dock */}
      <LiveTeacherPanel
        isOpen={isLiveTeacherOpen}
        onClose={() => setIsLiveTeacherOpen(false)}
        worldState={worldState}
        experience={currentExperience}
        isPaused={isSimulationPaused}
        onTogglePause={() => setIsSimulationPaused(!isSimulationPaused)}
        onInjectEvent={handleTeacherInjectEvent}
        onChangeDifficulty={(lvl) => {
          setCurrentLevel(lvl);
          setWorldState((prev) => ({ ...prev, language_level: lvl }));
        }}
        onForceTwist={handleTeacherForceTwist}
      />

      {/* World Map Modal */}
      {isMapOpen && (
        <WorldMapModal
          locations={locations}
          currentLocationId={worldState.location}
          onClose={() => setIsMapOpen(false)}
          onSelectLocation={(locId) => {
            setWorldState((prev) => ({ ...prev, location: locId }));
            setIsMapOpen(false);
          }}
        />
      )}

      {/* Missions & Objectives Drawer */}
      {isMissionsOpen && (
        <MissionsDrawer
          mainMission={mainMission}
          secondaryMissions={secondaryMissions}
          onClose={() => setIsMissionsOpen(false)}
        />
      )}

      {/* Pedagogical Debrief Report Modal */}
      {isDebriefOpen && (
        <DebriefModal
          report={debriefReport}
          isLoading={isDebriefLoading}
          onClose={() => setIsDebriefOpen(false)}
          onRestart={() => {
            setIsDebriefOpen(false);
            initExperienceSession(currentExperience);
          }}
          conversationHistory={turns}
          worldState={worldState}
        />
      )}

      {/* Real-time Voice Debug Panel — Demonstrates Independent Voice Identity */}
      <VoiceDebugPanel defaultOpen={false} />
    </div>
  );
}
