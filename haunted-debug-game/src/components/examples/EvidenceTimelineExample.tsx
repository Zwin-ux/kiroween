/**
 * EvidenceTimelineExample - Example integration of evidence timeline system
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { EvidenceBoard } from '../ui/EvidenceBoard';
import { ProgressDashboard } from '../ui/ProgressDashboard';
import { useEvidenceTimeline } from '@/hooks/useEvidenceTimeline';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { useGameStore } from '@/store/gameStore';

export function EvidenceTimelineExample() {
  const [activeView, setActiveView] = useState<'timeline' | 'progress' | null>(null);
  const gameStore = useGameStore();
  
  const {
    entries,
    statistics,
    recordEncounter,
    recordDecision,
    exportReport,
    isLoading,
    error
  } = useEvidenceTimeline();
  
  const {
    analytics,
    currentRoomProgress,
    nextRecommendedRoom
  } = useProgressTracking();

  // Example function to simulate recording an encounter
  const simulateEncounter = () => {
    const mockEncounter = {
      id: `encounter_${Date.now()}`,
      ghostId: 'circular-dependency',
      roomId: gameStore.currentRoom,
      startTime: new Date(),
      currentPhase: 'dialogue' as const,
      generatedPatches: [],
      appliedPatches: [],
      consequences: [],
      isComplete: false
    };
    
    recordEncounter(mockEncounter);
    
    // Also record in game store for compatibility
    gameStore.recordTimelineEntry({
      category: 'encounter',
      description: `Encountered ${mockEncounter.ghostId} in ${mockEncounter.roomId}`,
      context: {
        encounterId: mockEncounter.id,
        ghostId: mockEncounter.ghostId,
        roomId: mockEncounter.roomId
      },
      outcome: 'success',
      learningPoints: ['Identified circular dependency pattern'],
      conceptsInvolved: ['circular_dependency', 'software_smells'],
      skillsApplied: ['problem_identification', 'pattern_recognition']
    });
  };

  // Example function to simulate recording a decision
  const simulateDecision = () => {
    const mockChoice = {
      id: `choice_${Date.now()}`,
      timestamp: new Date(),
      roomId: gameStore.currentRoom,
      ghostId: 'circular-dependency',
      action: 'apply' as const,
      intent: 'Break circular dependency by introducing interface',
      outcome: 'Patch applied successfully'
    };
    
    const mockOutcome = {
      success: true,
      effects: { stability: -5, insight: 10, description: 'Applied dependency fix' },
      consequences: [],
      newDialogue: 'Good choice! The circular dependency has been resolved.'
    };
    
    recordDecision(mockChoice, mockOutcome, {
      ghostId: 'circular-dependency',
      roomId: gameStore.currentRoom
    });
    
    // Update meters
    gameStore.updateMeters(mockOutcome.effects);
  };

  if (activeView === 'timeline') {
    return (
      <EvidenceBoard
        entries={gameStore.evidenceBoard}
        onClose={() => setActiveView(null)}
      />
    );
  }

  if (activeView === 'progress') {
    return (
      <ProgressDashboard
        onClose={() => setActiveView(null)}
        onNavigateToRoom={(roomId) => {
          gameStore.setCurrentRoom(roomId);
          setActiveView(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-red-300 mb-6">
          Evidence Timeline System Demo
        </h1>
        
        {/* Status Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Timeline Status</h3>
            <div className="space-y-1 text-sm">
              <div>Total Entries: <span className="text-green-400">{entries.length}</span></div>
              <div>Success Rate: <span className="text-blue-400">{(statistics.successRate * 100).toFixed(1)}%</span></div>
              <div>Concepts Learned: <span className="text-purple-400">{statistics.conceptsLearned}</span></div>
            </div>
            {isLoading && <div className="text-yellow-400 text-xs mt-2">Loading...</div>}
            {error && <div className="text-red-400 text-xs mt-2">Error: {error}</div>}
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Progress Status</h3>
            <div className="space-y-1 text-sm">
              <div>Overall Progress: <span className="text-green-400">{(analytics.overallProgress * 100).toFixed(1)}%</span></div>
              <div>Current Streak: <span className="text-yellow-400">{analytics.currentStreak}</span></div>
              <div>Efficiency: <span className="text-blue-400">{(analytics.efficiencyScore * 100).toFixed(1)}%</span></div>
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Current Room</h3>
            <div className="space-y-1 text-sm">
              <div>Room: <span className="text-cyan-400">{gameStore.currentRoom}</span></div>
              <div>Completion: <span className="text-green-400">
                {currentRoomProgress ? (currentRoomProgress.completionPercentage * 100).toFixed(1) : 0}%
              </span></div>
              {nextRecommendedRoom && (
                <div>Next: <span className="text-orange-400">{nextRecommendedRoom}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={simulateEncounter}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Simulate Encounter
          </Button>
          
          <Button
            onClick={simulateDecision}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Simulate Decision
          </Button>
          
          <Button
            onClick={() => setActiveView('timeline')}
            className="bg-red-600 hover:bg-red-700"
          >
            View Timeline
          </Button>
          
          <Button
            onClick={() => setActiveView('progress')}
            className="bg-green-600 hover:bg-green-700"
          >
            View Progress
          </Button>
        </div>

        {/* Export Options */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4">Export Options</h3>
          <div className="flex space-x-4">
            <Button
              onClick={() => exportReport('json')}
              variant="outline"
              size="sm"
            >
              Export JSON Report
            </Button>
            
            <Button
              onClick={() => exportReport('csv')}
              variant="outline"
              size="sm"
            >
              Export CSV Report
            </Button>
            
            <Button
              onClick={() => exportReport('pdf')}
              variant="outline"
              size="sm"
            >
              Export PDF Report
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        {statistics.recentActivity.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
            <div className="space-y-2">
              {statistics.recentActivity.slice(0, 5).map((entry) => (
                <div key={entry.id} className="bg-gray-800/50 p-3 rounded border border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{entry.description}</span>
                    <span className="text-xs text-gray-500">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      entry.outcome === 'success' ? 'bg-green-900/50 text-green-300' :
                      entry.outcome === 'failure' ? 'bg-red-900/50 text-red-300' :
                      'bg-gray-900/50 text-gray-300'
                    }`}>
                      {entry.outcome}
                    </span>
                    <span className="text-xs text-gray-400">
                      Risk: {entry.riskLevel}
                    </span>
                    <span className="text-xs text-gray-400">
                      Confidence: {(entry.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}