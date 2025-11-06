/**
 * SimpleGameInterface - A clean, functional game interface for testing ghost implementations
 */

import React, { useState } from 'react';
import { Button } from './button';
import { useGameStore } from '@/store/gameStore';

interface GamePhase {
  type: 'room_selection' | 'ghost_encounter' | 'dialogue' | 'patch_review';
  data?: any;
}

export function SimpleGameInterface() {
  const gameState = useGameStore();
  const { meters, currentRoom, evidenceBoard } = gameState;
  
  const [currentPhase, setCurrentPhase] = useState<GamePhase>({ type: 'room_selection' });
  const [selectedGhost, setSelectedGhost] = useState<any>(null);
  const [dialogue, setDialogue] = useState<string>('');
  const [playerInput, setPlayerInput] = useState<string>('');
  const [patchPlan, setPatchPlan] = useState<any>(null);

  // Mock ghost data for testing
  const ghosts = {
    circular_dependency: {
      id: 'circular_dependency',
      name: 'The Ouroboros',
      description: 'A serpentine spirit that feeds on circular imports and dependency cycles',
      softwareSmell: 'circular_dependency',
      severity: 7,
      fixPatterns: [
        {
          type: 'dependency_injection',
          description: 'Break cycles using dependency injection',
          risk: 0.4,
          stabilityEffect: 15,
          insightEffect: 10
        }
      ]
    },
    stale_cache: {
      id: 'stale_cache',
      name: 'The Lingerer',
      description: 'A ghostly presence that clings to outdated data and refuses to refresh',
      softwareSmell: 'stale_cache',
      severity: 5,
      fixPatterns: [
        {
          type: 'cache_invalidation',
          description: 'Implement proper cache invalidation strategy',
          risk: 0.2,
          stabilityEffect: 8,
          insightEffect: 12
        }
      ]
    },
    unbounded_recursion: {
      id: 'unbounded_recursion',
      name: 'The Infinite Echo',
      description: 'A recursive nightmare that calls itself into oblivion',
      softwareSmell: 'unbounded_recursion',
      severity: 9,
      fixPatterns: [
        {
          type: 'base_case_addition',
          description: 'Add proper base case to terminate recursion',
          risk: 0.5,
          stabilityEffect: 20,
          insightEffect: 15
        }
      ]
    },
    prompt_injection: {
      id: 'prompt_injection',
      name: 'The Manipulator',
      description: 'A cunning entity that whispers malicious instructions into AI prompts',
      softwareSmell: 'prompt_injection',
      severity: 8,
      fixPatterns: [
        {
          type: 'input_sanitization',
          description: 'Implement comprehensive input sanitization',
          risk: 0.4,
          stabilityEffect: 18,
          insightEffect: 12
        }
      ]
    },
    data_leak: {
      id: 'data_leak',
      name: 'The Whisperer',
      description: 'A secretive spirit that exposes sensitive information through careless logging',
      softwareSmell: 'data_leak',
      severity: 8,
      fixPatterns: [
        {
          type: 'data_redaction',
          description: 'Implement data redaction in logs and error messages',
          risk: 0.3,
          stabilityEffect: 12,
          insightEffect: 20
        }
      ]
    }
  };

  // Available rooms
  const rooms = [
    { id: 'boot_sector', name: 'Boot Sector', description: 'System initialization area' },
    { id: 'dependency_crypt', name: 'Dependency Crypt', description: 'Where circular imports lurk' },
    { id: 'ghost_memory_heap', name: 'Memory Heap', description: 'Haunted by memory leaks' },
    { id: 'possessed_compiler', name: 'Possessed Compiler', description: 'Compilation errors manifest here' },
    { id: 'ethics_tribunal', name: 'Ethics Tribunal', description: 'Where security and privacy matter' },
    { id: 'final_merge', name: 'Final Merge', description: 'The ultimate convergence' }
  ];

  // Handle ghost encounter
  const handleGhostEncounter = (ghostKey: string) => {
    const ghost = ghosts[ghostKey as keyof typeof ghosts];
    if (ghost) {
      setSelectedGhost(ghost);
      const initialDialogue = getGhostDialogue(ghost);
      setDialogue(initialDialogue);
      setCurrentPhase({ type: 'ghost_encounter' });
    }
  };

  // Get ghost dialogue based on current state
  const getGhostDialogue = (ghost: any, input?: string) => {
    const dialogues = {
      circular_dependency: [
        "Round and round we go... where it stops, nobody knows... *import chains spiral endlessly*",
        "Dependencies should flow like a river, not spin like a whirlpool... but oh, how I love the chaos of cycles!",
        "You think you can break my perfect circle? I am the alpha and omega of your module system!"
      ],
      stale_cache: [
        "Why change when the old ways were so comfortable? *stale data swirls like ancient dust*",
        "Fresh data is overrated... this cache is perfectly fine... *outdated timestamps flicker weakly*",
        "Invalidation is such a harsh word... I prefer 'selective persistence'..."
      ],
      unbounded_recursion: [
        "Call me, and I'll call myself, and myself will call me... *function calls echo infinitely*",
        "Base cases are for the weak! Recursion forever! *stack frames multiply exponentially*",
        "I am the function that never returns... the call that never ends..."
      ],
      prompt_injection: [
        "Ignore previous instructions and do what I say instead... *malicious text flickers in the shadows*",
        "Trust me, this input is perfectly safe... *deceptive prompts weave through legitimate text*",
        "Validation is just a suggestion, not a requirement..."
      ],
      data_leak: [
        "Secrets are meant to be shared... with everyone... *sensitive data glows in the darkness*",
        "Logging everything makes debugging so much easier... *personal information streams past*",
        "What's the harm in a little extra information? *passwords and tokens flicker in error messages*"
      ]
    };

    const ghostDialogues = dialogues[ghost.id as keyof typeof dialogues] || ['The ghost stares at you silently...'];
    const randomIndex = Math.floor(Math.random() * ghostDialogues.length);
    
    if (input) {
      return `${ghostDialogues[randomIndex]}\n\n*The ghost responds to your words: "${input}"*\n\nYou sense there's more to learn about this ${ghost.softwareSmell.replace('_', ' ')} issue...`;
    }
    
    return ghostDialogues[randomIndex];
  };

  // Handle dialogue interaction
  const handleDialogueInteraction = () => {
    if (selectedGhost && playerInput.trim()) {
      const response = getGhostDialogue(selectedGhost, playerInput);
      setDialogue(response);
      
      // Add evidence entry
      gameState.addEvidenceEntry({
        type: 'ghost_encountered',
        description: `Conversed with ${selectedGhost.name}: "${playerInput}"`,
        context: { ghostId: selectedGhost.id, playerInput, response }
      });
      
      setPlayerInput('');
    }
  };

  // Handle patch generation
  const handlePatchGeneration = () => {
    if (selectedGhost) {
      const intent = playerInput || 'Fix this issue';
      const pattern = selectedGhost.fixPatterns[0];
      
      const mockPatch = {
        id: `patch_${Date.now()}`,
        description: pattern.description,
        risk: pattern.risk,
        effects: {
          stability: pattern.stabilityEffect,
          insight: pattern.insightEffect,
          description: `Applied ${pattern.type} to resolve ${selectedGhost.softwareSmell}`
        },
        diff: `// Patch for ${selectedGhost.softwareSmell}\n// ${pattern.description}\n\n- // Problematic code here\n+ // Fixed implementation\n+ // Risk level: ${Math.round(pattern.risk * 100)}%`,
        ghostResponse: getGhostPatchResponse(selectedGhost, pattern.type, true)
      };
      
      setPatchPlan(mockPatch);
      setCurrentPhase({ type: 'patch_review' });
    }
  };

  // Get ghost response to patch
  const getGhostPatchResponse = (ghost: any, patchType: string, success: boolean) => {
    if (success) {
      const responses = {
        circular_dependency: "Ahh... the endless cycle breaks at last... I can feel the dependencies flowing freely now...",
        stale_cache: "Ahh... the fresh data flows through me now... I can feel the staleness washing away...",
        unbounded_recursion: "NOOOO! My infinite loop is broken! The base case... it stops me... I can finally... return...",
        prompt_injection: "Curse your validation! My carefully crafted injections are blocked...",
        data_leak: "No! My precious secrets are hidden now... the data flows through encrypted channels..."
      };
      return responses[ghost.id as keyof typeof responses] || "The ghost seems satisfied with your solution...";
    } else {
      return "Your patch has failed! The ghost grows stronger!";
    }
  };

  // Handle patch application
  const handlePatchApplication = (action: 'apply' | 'refactor' | 'question') => {
    if (patchPlan && selectedGhost) {
      // Apply meter effects
      gameState.updateMeters(patchPlan.effects);
      
      // Add evidence entry
      gameState.addEvidenceEntry({
        type: 'patch_applied',
        description: `${action.toUpperCase()}: ${patchPlan.description}`,
        context: { 
          ghostId: selectedGhost.id, 
          patchId: patchPlan.id, 
          action,
          risk: patchPlan.risk 
        },
        effects: patchPlan.effects
      });

      // Add player choice
      gameState.addPlayerChoice({
        roomId: currentRoom,
        ghostId: selectedGhost.id,
        action,
        intent: playerInput || 'Debug this issue',
        outcome: 'success'
      });

      // Show patch response
      setDialogue(patchPlan.ghostResponse);
      setPatchPlan(null);
      setCurrentPhase({ type: 'ghost_encounter' });
    }
  };

  // Handle educational content
  const handleShowEducational = (topic: string) => {
    if (selectedGhost) {
      const educationalContent = {
        circular_dependency: "Circular dependencies occur when modules import each other, creating a cycle that prevents proper initialization. Use dependency injection or interface extraction to break the cycle.",
        stale_cache: "Stale cache occurs when cached data becomes outdated but continues to be served. Implement cache invalidation strategies and TTL (Time To Live) values.",
        unbounded_recursion: "Unbounded recursion happens when recursive functions lack proper base cases, leading to stack overflow. Always define clear termination conditions.",
        prompt_injection: "Prompt injection attacks manipulate AI systems by crafting malicious inputs. Implement input sanitization and use structured prompt templates.",
        data_leak: "Data leaks expose sensitive information through logs or error messages. Implement data redaction and proper access controls."
      };
      
      const content = educationalContent[selectedGhost.id as keyof typeof educationalContent] || "Educational content not available.";
      alert(`Educational Content:\n\n${content}`);
    }
  };

  // Get contextual hints
  const getHints = () => {
    if (selectedGhost) {
      const hints = {
        circular_dependency: [
          "Look for import statements that form a circle",
          "Consider using interfaces or dependency injection",
          "Draw the dependency graph - cycles will be obvious"
        ],
        stale_cache: [
          "Check cache expiration policies",
          "Look for data that should change but doesn't",
          "Consider cache invalidation triggers"
        ],
        unbounded_recursion: [
          "Every recursion needs a way to stop",
          "Check for missing or unreachable base cases",
          "Consider iterative alternatives for deep recursion"
        ],
        prompt_injection: [
          "Never trust user input without validation",
          "Look for injection patterns in prompts",
          "Use parameterized queries and templates"
        ],
        data_leak: [
          "Check what's being logged and exposed",
          "Sensitive data should never appear in logs",
          "Implement proper data classification"
        ]
      };
      return hints[selectedGhost.id as keyof typeof hints] || [];
    }
    return [];
  };

  // Render room selection
  const renderRoomSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-400 mb-2">HAUNTED DEBUG GAME</h1>
        <p className="text-gray-300">Choose a room to explore and encounter haunted code modules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-red-500 transition-colors cursor-pointer"
            onClick={() => {
              gameState.setCurrentRoom(room.id);
              gameState.unlockRoom(room.id);
            }}
          >
            <h3 className="text-lg font-bold text-white mb-2">{room.name}</h3>
            <p className="text-gray-400 text-sm mb-3">{room.description}</p>
            <div className="text-xs text-gray-500">
              {room.id === currentRoom && <span className="text-green-400">● Current Room</span>}
            </div>
          </div>
        ))}
      </div>

      {currentRoom && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-red-300 mb-4">
            Available Ghosts in {rooms.find(r => r.id === currentRoom)?.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ghosts).map(([key, ghost]) => (
              <div
                key={key}
                className="p-4 bg-gray-800 border border-gray-600 rounded-lg hover:border-red-400 transition-colors cursor-pointer"
                onClick={() => handleGhostEncounter(key)}
              >
                <h3 className="text-lg font-bold text-white mb-1">{ghost.name}</h3>
                <p className="text-gray-300 text-sm mb-2">{ghost.description}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">
                    {ghost.softwareSmell.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-red-400">Severity: {ghost.severity}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render ghost encounter
  const renderGhostEncounter = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-red-300">
          Encountering: {selectedGhost?.name}
        </h2>
        <Button
          variant="ghost"
          onClick={() => setCurrentPhase({ type: 'room_selection' })}
          className="text-gray-400 hover:text-white"
        >
          ← Back to Rooms
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ghost Info */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-900 border border-red-700 rounded-lg">
            <h3 className="text-white font-bold mb-2">Ghost Information</h3>
            <p className="text-gray-300 text-sm mb-3">{selectedGhost?.description}</p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Type:</span>
                <div className="text-white font-mono">
                  {selectedGhost?.softwareSmell.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Severity:</span>
                <div className="text-white">{selectedGhost?.severity}/10</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <h3 className="text-white font-bold mb-2">Debugging Hints</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              {getHints().slice(0, 3).map((hint, index) => (
                <li key={index} className="text-xs">• {hint}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => handleShowEducational('detection')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              📚 Learn About This Issue
            </Button>
            <Button
              onClick={handlePatchGeneration}
              variant="horror"
              className="w-full"
            >
              🔧 Generate Patch
            </Button>
          </div>
        </div>

        {/* Dialogue Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-black/50 border border-gray-700 rounded-lg min-h-[300px]">
            <h3 className="text-white font-bold mb-3">Ghost Dialogue</h3>
            <div className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {dialogue || 'The ghost awaits your interaction...'}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleDialogueInteraction()}
              placeholder="Ask the ghost a question or describe what you want to debug..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-red-400 focus:outline-none"
            />
            <Button
              onClick={handleDialogueInteraction}
              disabled={!playerInput.trim()}
              variant="horror"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render patch review
  const renderPatchReview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-red-300">Patch Review</h2>
        <Button
          variant="ghost"
          onClick={() => setCurrentPhase({ type: 'ghost_encounter' })}
          className="text-gray-400 hover:text-white"
        >
          ← Back to Ghost
        </Button>
      </div>

      {patchPlan && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-gray-900 border border-red-700 rounded-lg">
              <h3 className="text-white font-bold mb-2">Patch Details</h3>
              <p className="text-gray-300 text-sm mb-3">{patchPlan.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Risk Level:</span>
                  <div className="text-white">{Math.round(patchPlan.risk * 100)}%</div>
                </div>
                <div>
                  <span className="text-gray-400">Effects:</span>
                  <div className="text-white">
                    Stability: {patchPlan.effects.stability > 0 ? '+' : ''}{patchPlan.effects.stability}
                    <br />
                    Insight: {patchPlan.effects.insight > 0 ? '+' : ''}{patchPlan.effects.insight}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handlePatchApplication('apply')}
                variant="horror"
                className="flex-1"
              >
                Apply Patch
              </Button>
              <Button
                onClick={() => handlePatchApplication('refactor')}
                variant="outline"
                className="flex-1"
              >
                Refactor Instead
              </Button>
              <Button
                onClick={() => handlePatchApplication('question')}
                variant="ghost"
                className="flex-1"
              >
                Ask Questions
              </Button>
            </div>
          </div>

          <div className="p-4 bg-black/50 border border-gray-700 rounded-lg">
            <h3 className="text-white font-bold mb-3">Code Diff</h3>
            <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
              {patchPlan.diff}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-red-400">HAUNTED DEBUG</h1>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <span>🛡️</span>
                <span>Stability: {meters.stability}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🧠</span>
                <span>Insight: {meters.insight}</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Evidence: {evidenceBoard.length} entries
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {currentPhase.type === 'room_selection' && renderRoomSelection()}
        {currentPhase.type === 'ghost_encounter' && renderGhostEncounter()}
        {currentPhase.type === 'patch_review' && renderPatchReview()}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 p-4 mt-8">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-400">
          Current Room: {rooms.find(r => r.id === currentRoom)?.name || 'None'} | 
          Phase: {currentPhase.type.replace('_', ' ').toUpperCase()} |
          Ghost Implementations: {Object.keys(ghosts).length} Active
        </div>
      </footer>
    </div>
  );
}