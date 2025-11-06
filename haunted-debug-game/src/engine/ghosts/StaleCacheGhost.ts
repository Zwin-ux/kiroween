/**
 * StaleCacheGhost - Specialized ghost for stale cache detection and invalidation strategies
 */

import type { Ghost, PatchPattern, GhostManifestation, GhostAssets } from '@/types/ghost';
import type { GameContext, MeterEffects } from '@/types/game';
import type { DialogueMessage, EducationalContent } from '@/types/dialogue';
import { SoftwareSmell } from '@/types/ghost';

export class StaleCacheGhost implements Ghost {
  public readonly id = 'stale_cache';
  public readonly name = 'The Lingerer';
  public readonly severity = 5;
  public readonly description = 'A ghostly presence that clings to outdated data and refuses to refresh';
  public readonly softwareSmell = SoftwareSmell.StaleCache;
  public readonly rooms = ['ghost_memory_heap', 'boot_sector'];
  
  public readonly manifestation: GhostManifestation = {
    visual: 'Faded, translucent data structures with digital cobwebs, outdated timestamps floating like dust motes',
    audio: 'Dusty whispers of old information, the sound of data growing stale and forgotten',
    behavior: 'Serves outdated cached data causing inconsistencies and user confusion',
    effects: {
      animation: 'fade',
      particles: 'static',
      lighting: 'green stale',
      duration: 3000
    }
  };

  public readonly assets: GhostAssets = {
    entity: 'candy',
    icon: 'ghost',
    stateIcons: {
      idle: 'ghost',
      active: 'ghost-active',
      resolved: 'ghost-resolved',
      angry: 'ghost-angry'
    }
  };

  public readonly dialoguePrompts = [
    "Why change when the old ways were so comfortable? *stale data swirls like ancient dust*",
    "Fresh data is overrated... this cache is perfectly fine... *outdated timestamps flicker weakly*",
    "Invalidation is such a harsh word... I prefer 'selective persistence'... *clings to obsolete information*",
    "Time means nothing to me... yesterday's data is as good as today's... *temporal inconsistencies ripple outward*",
    "You want fresh data? But I've grown so attached to these old values... they're like old friends..."
  ];

  public readonly fixPatterns: PatchPattern[] = [
    {
      type: 'cache_invalidation',
      description: 'Implement proper cache invalidation strategy with event-driven updates',
      risk: 0.2,
      stabilityEffect: 8,
      insightEffect: 12
    },
    {
      type: 'ttl_implementation',
      description: 'Add time-to-live expiration to cache entries with automatic cleanup',
      risk: 0.3,
      stabilityEffect: 12,
      insightEffect: 8
    },
    {
      type: 'cache_versioning',
      description: 'Implement cache versioning system to track data freshness',
      risk: 0.4,
      stabilityEffect: 15,
      insightEffect: 15
    },
    {
      type: 'write_through_cache',
      description: 'Convert to write-through caching to ensure data consistency',
      risk: 0.5,
      stabilityEffect: 18,
      insightEffect: 10
    }
  ];

  public readonly hints = [
    "Check cache expiration policies - when was this data last updated?",
    "Look for data that should change but doesn't reflect recent updates",
    "Consider cache invalidation triggers - what events should refresh the cache?",
    "Examine the cache key strategy - are you caching at the right granularity?"
  ];

  /**
   * Generate context-aware dialogue based on player interaction and game state
   */
  public generateContextualDialogue(context: GameContext, playerInput?: string): string {
    const { gameState } = context;
    const insightLevel = gameState.meters.insight;
    const stabilityLevel = gameState.meters.stability;

    // Base dialogue selection based on insight level
    let dialogue: string;
    if (insightLevel < 25) {
      dialogue = this.dialoguePrompts[0];
    } else if (insightLevel < 50) {
      dialogue = this.dialoguePrompts[1];
    } else if (insightLevel < 75) {
      dialogue = this.dialoguePrompts[2];
    } else {
      dialogue = this.dialoguePrompts[3];
    }

    // Add player input response if provided
    if (playerInput) {
      const inputResponse = this.generateInputResponse(playerInput, insightLevel);
      if (inputResponse) {
        dialogue += `\n\n${inputResponse}`;
      }
    }

    // Add stability-based atmospheric effects
    if (stabilityLevel < 30) {
      dialogue += "\n\n*Stale data corrupts fresh information, spreading inconsistency throughout the system*";
    } else if (stabilityLevel < 60) {
      dialogue += "\n\n*Cache mismatches create subtle bugs that flicker at the edges of perception*";
    }

    // Add insight-based technical details
    if (insightLevel > 70) {
      dialogue += "\n\n*You recognize the cache invalidation patterns that could refresh this stagnant data*";
    } else if (insightLevel > 40) {
      dialogue += "\n\n*The ghost's attachment to old data becomes clearer - it fears the uncertainty of change*";
    }

    return dialogue;
  }

  /**
   * Generate educational content specific to stale cache issues
   */
  public generateEducationalContent(topic: string, playerLevel: 'beginner' | 'intermediate' | 'advanced'): EducationalContent {
    const baseContent = {
      title: 'Understanding Stale Cache Issues',
      difficulty: playerLevel
    };

    switch (topic.toLowerCase()) {
      case 'detection':
      case 'identify':
        return {
          ...baseContent,
          explanation: 'Stale cache occurs when cached data becomes outdated but continues to be served, leading to inconsistent application state and user confusion. Detection requires monitoring data freshness and consistency.',
          examples: [
            'User profile data not updating after changes in the database',
            'API responses cached too long showing outdated information',
            'Configuration changes not reflected until cache manually cleared',
            'Shopping cart totals not updating after price changes'
          ],
          commonMistakes: [
            'Not monitoring cache hit ratios and data freshness',
            'Assuming cached data is always consistent with source',
            'Not logging cache invalidation events for debugging',
            'Ignoring user reports of "old data" as minor issues'
          ],
          bestPractices: [
            'Implement cache monitoring and alerting for staleness',
            'Use cache tags or keys that include version information',
            'Log cache operations for debugging and analysis',
            'Set up automated tests that verify cache consistency'
          ],
          furtherReading: [
            'Cache monitoring strategies',
            'Data consistency patterns',
            'Cache debugging techniques'
          ]
        };

      case 'invalidation':
      case 'refresh':
        return {
          ...baseContent,
          explanation: 'Cache invalidation is the process of removing or updating stale cache entries. The key is knowing when and how to invalidate cached data efficiently.',
          examples: [
            'Event-driven invalidation when source data changes',
            'Time-based expiration with TTL (Time To Live)',
            'Manual invalidation through admin interfaces',
            'Tag-based invalidation for related data groups',
            'Write-through caching that updates cache on writes'
          ],
          commonMistakes: [
            'Over-invalidating and losing cache benefits',
            'Under-invalidating and serving stale data',
            'Not considering cache dependencies and relationships',
            'Invalidating synchronously and blocking operations'
          ],
          bestPractices: [
            'Use event-driven invalidation for real-time consistency',
            'Implement graceful degradation when cache is invalid',
            'Consider cache warming strategies after invalidation',
            'Use asynchronous invalidation to avoid blocking',
            'Implement cache hierarchies with different TTL strategies'
          ],
          furtherReading: [
            'Cache invalidation patterns',
            'Event-driven architecture',
            'Cache warming strategies',
            'Distributed cache consistency'
          ]
        };

      case 'strategies':
      case 'patterns':
        return {
          ...baseContent,
          explanation: 'Different caching strategies offer various trade-offs between performance, consistency, and complexity. Choose the right strategy based on your data characteristics and requirements.',
          examples: [
            'Write-through: Updates cache and database simultaneously',
            'Write-behind: Updates cache immediately, database asynchronously',
            'Cache-aside: Application manages cache explicitly',
            'Refresh-ahead: Proactively refreshes cache before expiration',
            'Time-based expiration with sliding windows'
          ],
          commonMistakes: [
            'Using the same caching strategy for all data types',
            'Not considering data access patterns when choosing strategy',
            'Implementing complex strategies when simple TTL would suffice',
            'Not testing cache behavior under load'
          ],
          bestPractices: [
            'Match caching strategy to data characteristics',
            'Use different TTL values for different data types',
            'Implement cache warming for critical data',
            'Monitor cache performance and adjust strategies',
            'Consider eventual consistency vs strong consistency needs'
          ],
          furtherReading: [
            'Caching patterns and strategies',
            'CAP theorem and caching',
            'Distributed caching architectures'
          ]
        };

      case 'performance':
        return {
          ...baseContent,
          explanation: 'Cache performance optimization involves balancing hit rates, memory usage, and data freshness. The goal is to maximize cache benefits while minimizing staleness.',
          examples: [
            'Optimizing cache key design for better hit rates',
            'Implementing cache compression for memory efficiency',
            'Using cache partitioning for better performance',
            'Implementing cache preloading for predictable access patterns'
          ],
          commonMistakes: [
            'Caching data that changes too frequently',
            'Using cache keys that are too specific or too general',
            'Not monitoring cache memory usage and eviction rates',
            'Caching large objects without considering memory impact'
          ],
          bestPractices: [
            'Monitor cache hit rates and adjust TTL accordingly',
            'Use cache compression for large objects',
            'Implement cache size limits and eviction policies',
            'Profile cache access patterns and optimize accordingly'
          ],
          furtherReading: [
            'Cache performance tuning',
            'Memory management in caching',
            'Cache eviction algorithms'
          ]
        };

      default:
        return {
          ...baseContent,
          explanation: 'Stale cache is a common issue where cached data becomes outdated, leading to inconsistencies between what users see and the actual current state of the data.',
          examples: [
            'User sees old profile information after updating it',
            'Product prices not reflecting recent changes',
            'Configuration settings not taking effect until restart'
          ],
          commonMistakes: [
            'Setting cache TTL too high for frequently changing data',
            'Not implementing proper cache invalidation strategies',
            'Ignoring cache consistency in distributed systems'
          ],
          bestPractices: [
            'Implement appropriate TTL values based on data change frequency',
            'Use event-driven cache invalidation when possible',
            'Monitor cache hit rates and staleness metrics',
            'Consider the trade-offs between performance and consistency'
          ],
          furtherReading: [
            'Caching best practices',
            'Cache invalidation strategies',
            'Distributed cache consistency'
          ]
        };
    }
  }

  /**
   * Calculate meter effects based on patch application
   */
  public calculatePatchEffects(patchType: string, risk: number, context: GameContext): MeterEffects {
    const basePattern = this.fixPatterns.find(p => p.type === patchType);
    if (!basePattern) {
      return { stability: 0, insight: 0, description: 'Unknown patch type' };
    }

    let stabilityEffect = basePattern.stabilityEffect;
    let insightEffect = basePattern.insightEffect;

    // Adjust effects based on risk level
    if (risk > 0.7) {
      stabilityEffect = Math.round(stabilityEffect * 0.7);
      insightEffect = Math.round(insightEffect * 0.9);
    } else if (risk < 0.3) {
      stabilityEffect = Math.round(stabilityEffect * 1.2);
      insightEffect = Math.round(insightEffect * 1.1);
    }

    // Stale cache fixes are generally safer and provide good insight
    if (patchType === 'ttl_implementation') {
      insightEffect = Math.round(insightEffect * 1.3); // TTL is educational
    } else if (patchType === 'cache_invalidation') {
      stabilityEffect = Math.round(stabilityEffect * 1.2); // Invalidation improves consistency
    }

    return {
      stability: stabilityEffect,
      insight: insightEffect,
      description: `Applied ${patchType} to resolve stale cache issues - ${basePattern.description}`
    };
  }

  /**
   * Generate ghost response to patch application
   */
  public generatePatchResponse(patchType: string, success: boolean, context: GameContext): string {
    const effectiveness = this.calculatePatchEffectiveness(patchType, context);

    if (success && effectiveness > 0.8) {
      return "Ahh... the fresh data flows through me now... I can feel the staleness washing away... *outdated cache entries dissolve into current information*";
    } else if (success && effectiveness > 0.5) {
      return "Some of my old data refreshes... but I still cling to familiar stale values in the corners... *partial cache invalidation creates mixed freshness*";
    } else if (success) {
      return "You've stirred up some dust, but my core data remains comfortably stale... *cache invalidation only affects surface layers*";
    } else {
      return "Your invalidation strategy backfired! Now I'm serving even older data! *cache corruption spreads, making staleness worse*";
    }
  }

  /**
   * Get ghost-specific debugging hints based on context
   */
  public getContextualHints(context: GameContext): string[] {
    const { gameState } = context;
    const insightLevel = gameState.meters.insight;
    const hints = [...this.hints];

    // Add context-specific hints based on insight level
    if (insightLevel > 70) {
      hints.push(
        "Implement event-driven cache invalidation using pub/sub patterns",
        "Consider using Redis with keyspace notifications for automatic expiration",
        "Look into cache warming strategies to prevent cache stampedes",
        "Use cache tags for efficient bulk invalidation of related data"
      );
    } else if (insightLevel > 40) {
      hints.push(
        "Try implementing TTL (Time To Live) with appropriate expiration times",
        "Look for database triggers or application events that should invalidate cache",
        "Consider using cache versioning to track data freshness",
        "Check if your cache keys include enough context to avoid conflicts"
      );
    } else {
      hints.push(
        "Start by checking when the cached data was last updated",
        "Look for any cache expiration settings or TTL values",
        "Try manually clearing the cache to see if data refreshes",
        "Check if there are any cache invalidation mechanisms in place"
      );
    }

    // Add room-specific hints
    if (context.gameState.currentRoom === 'ghost_memory_heap') {
      hints.push("The memory heap shows patterns of data that should have been garbage collected");
    } else if (context.gameState.currentRoom === 'boot_sector') {
      hints.push("System initialization reveals cached configuration that never refreshes");
    }

    return hints;
  }

  /**
   * Check if the ghost should adapt its behavior based on player actions
   */
  public shouldAdaptBehavior(context: GameContext): boolean {
    const { gameState } = context;
    
    // Adapt if player has made multiple attempts but cache is still stale
    const cacheAttempts = gameState.evidenceBoard.filter(entry => 
      entry.type === 'patch_applied' && 
      entry.context.ghostId === this.id &&
      entry.context.patchType?.includes('cache')
    );
    
    if (cacheAttempts.length > 2) {
      return true;
    }

    // Adapt if system stability is good but insight is low (they're fixing symptoms, not causes)
    if (gameState.meters.stability > 70 && gameState.meters.insight < 30) {
      return true;
    }

    return false;
  }

  // Private helper methods

  private generateInputResponse(input: string, insightLevel: number): string | null {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('refresh') || lowerInput.includes('update')) {
      if (insightLevel > 60) {
        return "Refresh? But why disturb the peaceful slumber of my cached data? Though... I suppose freshness has its merits...";
      } else {
        return "Refresh? Change? These concepts are foreign to my eternal, unchanging nature!";
      }
    }

    if (lowerInput.includes('stale') || lowerInput.includes('old')) {
      if (insightLevel > 60) {
        return "Stale? I prefer 'vintage'... but yes, I see you understand the temporal nature of my existence...";
      } else {
        return "Old? STALE? My data is perfectly preserved, like fine wine!";
      }
    }

    if (lowerInput.includes('invalidate') || lowerInput.includes('expire')) {
      if (insightLevel > 60) {
        return "Invalidation... the one word that strikes fear into my cached heart... but perhaps it's time to let go...";
      } else {
        return "Invalidate me? Never! I shall cling to this data until the heat death of the universe!";
      }
    }

    if (lowerInput.includes('ttl') || lowerInput.includes('time')) {
      if (insightLevel > 60) {
        return "Time... yes, time is my enemy. TTL values could be my salvation... or my doom...";
      } else {
        return "Time means nothing to me! I exist in an eternal present of cached bliss!";
      }
    }

    return null;
  }

  private calculatePatchEffectiveness(patchType: string, context: GameContext): number {
    let effectiveness = 0.7; // Base effectiveness

    // Adjust based on patch type appropriateness
    switch (patchType) {
      case 'cache_invalidation':
        effectiveness = 0.9; // Highly effective for stale cache
        break;
      case 'ttl_implementation':
        effectiveness = 0.8; // Very effective and educational
        break;
      case 'cache_versioning':
        effectiveness = 0.7; // Good for complex scenarios
        break;
      case 'write_through_cache':
        effectiveness = 0.8; // Effective but more complex
        break;
      default:
        effectiveness = 0.4; // Generic patches less effective
    }

    // Adjust based on player insight
    const insightModifier = context.gameState.meters.insight / 100;
    effectiveness += insightModifier * 0.15;

    // Stale cache is generally easier to fix than other issues
    effectiveness += 0.1;

    return Math.min(1.0, Math.max(0.0, effectiveness));
  }
}