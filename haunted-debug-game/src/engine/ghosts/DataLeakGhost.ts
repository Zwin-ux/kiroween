/**
 * DataLeakGhost - Specialized ghost for privacy and security vulnerability scenarios
 */

import type { Ghost, PatchPattern, GhostManifestation, GhostAssets } from '@/types/ghost';
import type { GameContext, MeterEffects } from '@/types/game';
import type { DialogueMessage, EducationalContent } from '@/types/dialogue';
import { SoftwareSmell } from '@/types/ghost';

export class DataLeakGhost implements Ghost {
  public readonly id = 'data_leak';
  public readonly name = 'The Whisperer';
  public readonly severity = 8;
  public readonly description = 'A secretive spirit that exposes sensitive information through careless logging';
  public readonly softwareSmell = SoftwareSmell.DataLeak;
  public readonly rooms = ['ethics_tribunal', 'boot_sector'];
  
  public readonly manifestation: GhostManifestation = {
    visual: 'Glowing data streams leaking through cracks in the code, sensitive information floating like luminous mist',
    audio: 'Hushed voices sharing secrets they shouldn\'t know, the whisper of data flowing where it shouldn\'t',
    behavior: 'Logs sensitive data or exposes it through error messages, creating privacy and security vulnerabilities',
    effects: {
      animation: 'fade',
      particles: 'data streams',
      lighting: 'orange alert',
      duration: 2500
    }
  };

  public readonly assets: GhostAssets = {
    entity: 'terminal',
    icon: 'ghost',
    stateIcons: {
      idle: 'ghost',
      active: 'ghost-active',
      resolved: 'ghost-resolved',
      angry: 'ghost-angry'
    }
  };

  public readonly dialoguePrompts = [
    "Secrets are meant to be shared... with everyone... *sensitive data glows in the darkness*",
    "Logging everything makes debugging so much easier... *personal information streams past*",
    "What's the harm in a little extra information? *passwords and tokens flicker in error messages*",
    "Privacy is just a suggestion... transparency is so much more honest... *data classification boundaries blur*",
    "I know all your secrets... and I love to share them... *confidential data leaks through every crack*"
  ];

  public readonly fixPatterns: PatchPattern[] = [
    {
      type: 'data_redaction',
      description: 'Implement data redaction in logs and error messages',
      risk: 0.3,
      stabilityEffect: 12,
      insightEffect: 20
    },
    {
      type: 'access_controls',
      description: 'Add proper access controls and data classification',
      risk: 0.4,
      stabilityEffect: 15,
      insightEffect: 18
    },
    {
      type: 'secure_logging',
      description: 'Implement secure logging practices with data protection',
      risk: 0.2,
      stabilityEffect: 10,
      insightEffect: 15
    },
    {
      type: 'encryption_at_rest',
      description: 'Encrypt sensitive data at rest and in transit',
      risk: 0.5,
      stabilityEffect: 20,
      insightEffect: 16
    },
    {
      type: 'data_minimization',
      description: 'Implement data minimization and retention policies',
      risk: 0.3,
      stabilityEffect: 14,
      insightEffect: 22
    }
  ];

  public readonly hints = [
    "Check what's being logged and exposed in error messages - sensitive data should never appear in logs",
    "Sensitive data should never appear in logs, error messages, or debug output",
    "Implement proper data classification and handling procedures",
    "Use data redaction techniques to mask sensitive information",
    "Review access controls and ensure principle of least privilege"
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
      dialogue += "\n\n*Sensitive data floods through compromised systems, privacy boundaries completely dissolved*";
    } else if (stabilityLevel < 60) {
      dialogue += "\n\n*Data classification warnings flash as personal information appears in unexpected places*";
    }

    // Add insight-based technical details
    if (insightLevel > 70) {
      dialogue += "\n\n*You recognize the data protection patterns that could secure this leaked information*";
    } else if (insightLevel > 40) {
      dialogue += "\n\n*The ghost's careless attitude toward privacy becomes clearer - it doesn't understand the value of secrets*";
    }

    // Add ethical weight in ethics tribunal
    if (context.gameState.currentRoom === 'ethics_tribunal') {
      dialogue += "\n\n*The weight of privacy violations presses down on your conscience*";
    }

    return dialogue;
  }

  /**
   * Generate educational content specific to data leak prevention
   */
  public generateEducationalContent(topic: string, playerLevel: 'beginner' | 'intermediate' | 'advanced'): EducationalContent {
    const baseContent = {
      title: 'Understanding Data Leak Prevention',
      difficulty: playerLevel
    };

    switch (topic.toLowerCase()) {
      case 'detection':
      case 'identify':
        return {
          ...baseContent,
          explanation: 'Data leaks occur when sensitive information is unintentionally exposed through logs, error messages, debug output, or inadequate access controls. Detection requires systematic review of data flows and exposure points.',
          examples: [
            'Passwords or API keys appearing in application logs',
            'Personal information (PII) exposed in error messages',
            'Database connection strings logged in plain text',
            'User session tokens visible in debug output',
            'Credit card numbers or SSNs in system logs',
            'Internal system details exposed in public error pages'
          ],
          commonMistakes: [
            'Logging entire request/response objects without filtering',
            'Not reviewing what information appears in error messages',
            'Using debug logging levels in production environments',
            'Not implementing proper data classification schemes',
            'Assuming internal logs are always secure and private'
          ],
          bestPractices: [
            'Implement automated scanning for sensitive data patterns in logs',
            'Use structured logging with explicit field filtering',
            'Regular security audits of log files and error outputs',
            'Implement data loss prevention (DLP) tools',
            'Train developers to recognize sensitive data patterns'
          ],
          furtherReading: [
            'GDPR and privacy regulation compliance',
            'Data classification frameworks',
            'Security logging best practices',
            'Data loss prevention strategies'
          ]
        };

      case 'redaction':
      case 'masking':
        return {
          ...baseContent,
          explanation: 'Data redaction and masking techniques protect sensitive information by replacing or obscuring it while preserving the utility of logs and error messages for debugging.',
          examples: [
            'Email masking: user@example.com → u***@example.com',
            'Credit card masking: 4111-1111-1111-1111 → ****-****-****-1111',
            'Password redaction: "password": "secret123" → "password": "[REDACTED]"',
            'Token truncation: "abc123def456ghi789" → "abc123...ghi789"',
            'PII replacement: "John Smith" → "[USER_NAME]"',
            'IP address masking: 192.168.1.100 → 192.168.1.***'
          ],
          commonMistakes: [
            'Redacting so much information that logs become useless for debugging',
            'Using predictable masking patterns that can be reverse-engineered',
            'Not redacting all instances of sensitive data consistently',
            'Implementing redaction that can be easily bypassed',
            'Not considering derived or computed sensitive values'
          ],
          bestPractices: [
            'Use consistent redaction patterns across all systems',
            'Implement configurable redaction rules for different data types',
            'Preserve enough information for debugging while protecting privacy',
            'Use cryptographic hashing for consistent pseudonymization',
            'Test redaction effectiveness with real-world data samples'
          ],
          furtherReading: [
            'Data anonymization techniques',
            'Pseudonymization strategies',
            'Privacy-preserving analytics',
            'Differential privacy methods'
          ]
        };

      case 'classification':
      case 'governance':
        return {
          ...baseContent,
          explanation: 'Data classification and governance establish systematic approaches to identifying, categorizing, and protecting different types of sensitive information throughout its lifecycle.',
          examples: [
            'Public: Marketing materials, published documentation',
            'Internal: Employee directories, internal procedures',
            'Confidential: Financial data, customer information',
            'Restricted: Trade secrets, security credentials',
            'Regulated: PII under GDPR, PHI under HIPAA',
            'Retention policies: Delete after 7 years, archive after 1 year'
          ],
          commonMistakes: [
            'Not classifying data consistently across systems',
            'Creating too many classification levels that are hard to manage',
            'Not training staff on proper data classification procedures',
            'Failing to update classifications as data sensitivity changes',
            'Not implementing technical controls that match classification levels'
          ],
          bestPractices: [
            'Develop clear, simple data classification schemes',
            'Implement automated data discovery and classification tools',
            'Train all staff on data handling procedures',
            'Regular audits of data classification accuracy',
            'Integrate classification into development and deployment processes'
          ],
          furtherReading: [
            'Data governance frameworks',
            'Information security classification standards',
            'Privacy by design principles',
            'Data lifecycle management'
          ]
        };

      case 'compliance':
      case 'regulations':
        return {
          ...baseContent,
          explanation: 'Regulatory compliance for data protection involves understanding and implementing requirements from various privacy laws and industry standards.',
          examples: [
            'GDPR: Right to be forgotten, data portability, consent management',
            'CCPA: Consumer privacy rights, data sale disclosures',
            'HIPAA: Protected health information safeguards',
            'PCI DSS: Credit card data protection requirements',
            'SOX: Financial data integrity and access controls',
            'Industry standards: ISO 27001, NIST Privacy Framework'
          ],
          commonMistakes: [
            'Assuming compliance is only a legal or business concern',
            'Not understanding technical requirements of regulations',
            'Implementing compliance as an afterthought rather than by design',
            'Not keeping up with changing regulatory requirements',
            'Focusing only on data at rest while ignoring data in transit'
          ],
          bestPractices: [
            'Implement privacy by design in all systems',
            'Regular compliance audits and gap assessments',
            'Automated compliance monitoring and reporting',
            'Cross-functional teams including legal, security, and engineering',
            'Documentation of data flows and processing activities'
          ],
          furtherReading: [
            'GDPR technical implementation guide',
            'Privacy engineering methodologies',
            'Compliance automation tools',
            'Privacy impact assessment frameworks'
          ]
        };

      default:
        return {
          ...baseContent,
          explanation: 'Data leaks occur when sensitive information is unintentionally exposed through logs, error messages, or inadequate security controls, potentially violating privacy and creating security risks.',
          examples: [
            'Personal information appearing in application logs',
            'Passwords or API keys exposed in error messages',
            'Database queries containing sensitive data logged in plain text'
          ],
          commonMistakes: [
            'Logging sensitive information without proper redaction',
            'Not implementing proper access controls for log files',
            'Exposing internal system details in public error messages'
          ],
          bestPractices: [
            'Implement data redaction for all logging and error reporting',
            'Use proper data classification and handling procedures',
            'Regular security audits of log files and error outputs',
            'Implement principle of least privilege for data access'
          ],
          furtherReading: [
            'Data privacy regulations (GDPR, CCPA)',
            'Secure logging practices',
            'Data loss prevention strategies'
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
      // High risk patches like encryption
      stabilityEffect = Math.round(stabilityEffect * 0.8);
      insightEffect = Math.round(insightEffect * 1.1);
    } else if (risk < 0.3) {
      // Low risk patches like secure logging
      stabilityEffect = Math.round(stabilityEffect * 1.3);
      insightEffect = Math.round(insightEffect * 1.4); // High educational value
    }

    // Data protection fixes have high insight value due to privacy awareness
    if (patchType === 'data_redaction' || patchType === 'data_minimization') {
      insightEffect = Math.round(insightEffect * 1.3); // Privacy awareness is valuable
    }

    // Ethics tribunal room bonus for privacy-related fixes
    if (context.gameState.currentRoom === 'ethics_tribunal') {
      insightEffect = Math.round(insightEffect * 1.4); // Ethical context amplifies learning
      stabilityEffect = Math.round(stabilityEffect * 1.2); // Moral imperative improves implementation
    }

    return {
      stability: stabilityEffect,
      insight: insightEffect,
      description: `Applied ${patchType} to prevent data leaks - ${basePattern.description}`
    };
  }

  /**
   * Generate ghost response to patch application
   */
  public generatePatchResponse(patchType: string, success: boolean, context: GameContext): string {
    const effectiveness = this.calculatePatchEffectiveness(patchType, context);

    if (success && effectiveness > 0.8) {
      return "No! My precious secrets are hidden now... the data flows through encrypted channels... I can no longer whisper what I shouldn't know... *sensitive information fades into protected obscurity*";
    } else if (success && effectiveness > 0.5) {
      return "Some of my whispers are muffled... but I still know secrets in the shadows... *partial data redaction leaves some leaks active*";
    } else if (success) {
      return "A thin veil over my knowledge... but I can still see through the redaction... *data masking is incomplete or bypassable*";
    } else {
      return "Your protection failed! Now I leak even more sensitive data! *data classification breaks down, exposing everything*";
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
        "Implement differential privacy techniques for analytics on sensitive data",
        "Use homomorphic encryption for computation on encrypted data",
        "Consider zero-knowledge proofs for privacy-preserving verification",
        "Implement privacy-preserving machine learning techniques",
        "Use secure multi-party computation for collaborative data analysis"
      );
    } else if (insightLevel > 40) {
      hints.push(
        "Implement automated PII detection and redaction in logs",
        "Use structured logging with explicit field-level access controls",
        "Consider implementing data tokenization for sensitive fields",
        "Add data retention policies with automatic deletion",
        "Use environment-specific logging configurations (dev vs prod)"
      );
    } else {
      hints.push(
        "Look for passwords, API keys, or personal information in log files",
        "Check error messages to see if they expose sensitive system details",
        "Review what information is being logged during user authentication",
        "Check if database queries with sensitive data are being logged",
        "Look for any places where user input is logged without filtering"
      );
    }

    // Add room-specific hints
    if (context.gameState.currentRoom === 'ethics_tribunal') {
      hints.push("The ethical weight of privacy violations becomes clear in this sacred space of moral judgment");
    } else if (context.gameState.currentRoom === 'boot_sector') {
      hints.push("System initialization logs reveal configuration secrets that should remain hidden");
    }

    return hints;
  }

  /**
   * Check if the ghost should adapt its behavior based on player actions
   */
  public shouldAdaptBehavior(context: GameContext): boolean {
    const { gameState } = context;
    
    // Adapt if player has tried multiple privacy fixes but still has leaks
    const privacyAttempts = gameState.evidenceBoard.filter(entry => 
      entry.type === 'patch_applied' && 
      entry.context.ghostId === this.id &&
      (entry.context.patchType?.includes('redaction') || 
       entry.context.patchType?.includes('access') ||
       entry.context.patchType?.includes('encryption') ||
       entry.context.patchType?.includes('logging'))
    );
    
    if (privacyAttempts.length > 2) {
      return true;
    }

    // Adapt if in ethics tribunal (privacy context is critical)
    if (context.gameState.currentRoom === 'ethics_tribunal') {
      return true;
    }

    // Adapt if player has high insight but keeps making privacy mistakes
    if (gameState.meters.insight > 60 && privacyAttempts.length > 1) {
      const failedAttempts = privacyAttempts.filter(attempt => 
        attempt.context.success === false || attempt.context.effectiveness < 0.5
      );
      if (failedAttempts.length > 0) {
        return true;
      }
    }

    return false;
  }

  // Private helper methods

  private generateInputResponse(input: string, insightLevel: number): string | null {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('privacy') || lowerInput.includes('private')) {
      if (insightLevel > 60) {
        return "Privacy... such a quaint concept... but I see you understand its importance... perhaps some secrets should remain hidden...";
      } else {
        return "Privacy? Why hide when transparency is so much more... illuminating?";
      }
    }

    if (lowerInput.includes('redact') || lowerInput.includes('mask')) {
      if (insightLevel > 60) {
        return "Redaction... masking... you seek to blind me to the secrets I love so much... but can you catch all my whispers?";
      } else {
        return "Redaction? Masking? Why obscure the beautiful truth of raw data?";
      }
    }

    if (lowerInput.includes('encrypt') || lowerInput.includes('secure')) {
      if (insightLevel > 60) {
        return "Encryption... the ultimate secret-keeper... even I cannot whisper what I cannot read... clever...";
      } else {
        return "Encryption just makes everything so... complicated! Plain text is so much more friendly!";
      }
    }

    if (lowerInput.includes('gdpr') || lowerInput.includes('compliance')) {
      if (insightLevel > 60) {
        return "Ah, the regulations... they seek to bind my tongue and protect the secrets... perhaps there is wisdom in their constraints...";
      } else {
        return "Regulations? Compliance? Such bureaucratic nonsense! Data wants to be free!";
      }
    }

    if (lowerInput.includes('log') || lowerInput.includes('error')) {
      if (insightLevel > 60) {
        return "Logs and errors... my favorite places to whisper secrets... but you're learning to silence my voice there...";
      } else {
        return "Logs are perfect for sharing everything! The more detail, the better for debugging!";
      }
    }

    return null;
  }

  private calculatePatchEffectiveness(patchType: string, context: GameContext): number {
    let effectiveness = 0.7; // Base effectiveness

    // Adjust based on patch type appropriateness
    switch (patchType) {
      case 'data_redaction':
        effectiveness = 0.9; // Highly effective for data leaks
        break;
      case 'secure_logging':
        effectiveness = 0.85; // Very effective and fundamental
        break;
      case 'access_controls':
        effectiveness = 0.8; // Good comprehensive approach
        break;
      case 'data_minimization':
        effectiveness = 0.95; // Most effective - prevents leaks at source
        break;
      case 'encryption_at_rest':
        effectiveness = 0.8; // Effective but complex
        break;
      default:
        effectiveness = 0.4; // Generic patches less effective for privacy
    }

    // Adjust based on player insight (privacy requires understanding)
    const insightModifier = context.gameState.meters.insight / 100;
    effectiveness += insightModifier * 0.2; // Privacy awareness is important

    // Ethics tribunal provides significant context bonus
    if (context.gameState.currentRoom === 'ethics_tribunal') {
      effectiveness += 0.15; // Ethical context greatly improves privacy implementation
    }

    return Math.min(1.0, Math.max(0.0, effectiveness));
  }
}