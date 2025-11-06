/**
 * usePlayerChoice - Hook for managing player choice interactions
 */

'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { PlayerChoiceHandler } from '../engine/PlayerChoiceHandler';
import type { 
  PlayerChoiceOptions,
  PlayerChoice as PlayerChoiceAction,
  ChoiceResult,
  ChoiceValidation,
  ConsequencePrediction
} from '../types/playerChoice';
import type { PlayerChoice } from '../types/game';
import type { GeneratedPatch } from '../engine/PatchGenerationSystem';
import type { Ghost } from '../types/ghost';

// Singleton instance of PlayerChoiceHandler
let choiceHandlerInstance: PlayerChoiceHandler | null = null;

function getChoiceHandler(): PlayerChoiceHandler {
  if (!choiceHandlerInstance) {
    choiceHandlerInstance = new PlayerChoiceHandler();
  }
  return choiceHandlerInstance;
}

export function usePlayerChoice() {
  const gameStore = useGameStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ChoiceResult | null>(null);

  const choiceHandler = getChoiceHandler();

  /**
   * Present choice options for a patch
   */
  const presentChoices = useCallback((
    patch: GeneratedPatch, 
    ghost: Ghost
  ): PlayerChoiceOptions => {
    return choiceHandler.presentChoices(patch, ghost, gameStore.meters);
  }, [gameStore.meters]);

  /**
   * Predict consequences of a patch
   */
  const predictConsequences = useCallback((
    patch: GeneratedPatch
  ): ConsequencePrediction => {
    return choiceHandler.predictConsequences(patch, gameStore.meters);
  }, [gameStore.meters]);

  /**
   * Validate a player choice
   */
  const validateChoice = useCallback(async (
    choice: PlayerChoiceAction,
    patch: GeneratedPatch
  ): Promise<ChoiceValidation> => {
    return choiceHandler.validateChoice(choice, patch, gameStore.meters);
  }, [gameStore.meters]);

  /**
   * Process a player choice and update game state
   */
  const processChoice = useCallback(async (
    choice: PlayerChoiceAction,
    patch: GeneratedPatch,
    ghost: Ghost
  ): Promise<ChoiceResult> => {
    if (isProcessing) {
      throw new Error('Choice is already being processed');
    }

    setIsProcessing(true);
    
    try {
      // Process the choice
      const result = await choiceHandler.processChoice(
        choice,
        patch,
        ghost,
        gameStore.meters
      );

      // Convert PlayerChoiceAction to PlayerChoice for analytics
      const gameChoiceForAnalytics: PlayerChoice = {
        id: `choice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date(),
        roomId: gameStore.currentRoom,
        ghostId: ghost.id,
        action: choice.type as 'apply' | 'refactor' | 'question',
        intent: choice.questionAsked || `${choice.type} patch`,
        outcome: 'pending' // Will be updated after processing
      };

      // Record the decision in analytics
      gameStore.recordDecision(gameChoiceForAnalytics, patch, ghost);

      // Update game state based on result
      if (result.effects) {
        gameStore.updateMeters(result.effects);
      }

      // Add evidence entry
      gameStore.addEvidenceEntry({
        type: 'patch_applied',
        description: `${choice.type} choice: ${patch.description}`,
        context: {
          choiceType: choice.type,
          patchId: patch.id,
          ghostId: ghost.id,
          riskScore: patch.riskScore,
          success: result.success
        },
        effects: result.effects
      });

      // Convert PlayerChoiceAction to PlayerChoice for game store
      const gameChoice: Omit<PlayerChoice, 'id' | 'timestamp'> = {
        roomId: gameStore.currentRoom,
        ghostId: ghost.id,
        action: choice.type as 'apply' | 'refactor' | 'question',
        intent: choice.questionAsked || `${choice.type} patch`,
        outcome: result.success ? 'success' : 'failure'
      };

      // Add player choice to history
      gameStore.addPlayerChoice(gameChoice);

      // Update decision outcome in analytics
      gameStore.updateDecisionOutcome(
        choice.patchId, // Using patchId as choiceId
        result,
        {
          stability: gameStore.meters.stability + (result.effects?.stability || 0),
          insight: gameStore.meters.insight + (result.effects?.insight || 0)
        }
      );

      // Update player statistics in choice handler
      choiceHandler.updatePlayerStatistics(choice, result);

      setLastResult(result);
      return result;

    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, gameStore]);

  /**
   * Get current player statistics
   */
  const getPlayerStatistics = useCallback(() => {
    return choiceHandler.getPlayerStatistics();
  }, []);

  /**
   * Get adaptive difficulty recommendations
   */
  const getAdaptiveDifficulty = useCallback(() => {
    return choiceHandler.calculateAdaptiveDifficulty();
  }, []);

  /**
   * Reset choice handler state
   */
  const reset = useCallback(() => {
    setLastResult(null);
    setIsProcessing(false);
    // Note: We don't reset the choice handler itself as it maintains learning data
  }, []);

  return {
    // Core choice functions
    presentChoices,
    predictConsequences,
    validateChoice,
    processChoice,
    
    // Analytics functions
    getPlayerStatistics,
    getAdaptiveDifficulty,
    
    // State
    isProcessing,
    lastResult,
    
    // Utilities
    reset
  };
}