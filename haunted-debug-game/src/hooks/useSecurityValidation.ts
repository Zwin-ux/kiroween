/**
 * useSecurityValidation - Hook for security validation functionality
 */

import { useState, useCallback } from 'react';
import { SecurityValidationSystem, type SecurityValidationResult, type ValidationContext } from '@/engine/SecurityValidationSystem';
import type { PatchPlan } from '@/types/patch';

interface UseSecurityValidationReturn {
  validatePatch: (patch: PatchPlan, context: ValidationContext) => Promise<SecurityValidationResult>;
  isValidating: boolean;
  lastValidationResult: SecurityValidationResult | null;
  error: string | null;
  clearError: () => void;
}

export function useSecurityValidation(): UseSecurityValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidationResult, setLastValidationResult] = useState<SecurityValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [securitySystem] = useState(() => new SecurityValidationSystem());

  const validatePatch = useCallback(async (
    patch: PatchPlan, 
    context: ValidationContext
  ): Promise<SecurityValidationResult> => {
    setIsValidating(true);
    setError(null);

    try {
      const result = await securitySystem.validatePatchSecurity(patch, context);
      setLastValidationResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Security validation failed';
      setError(errorMessage);
      
      // Return a failed validation result
      const failedResult: SecurityValidationResult = {
        isValid: false,
        riskScore: 1.0,
        violations: [{
          id: 'validation-error',
          type: 'dangerous-api' as any,
          severity: 'critical' as any,
          description: 'Security validation system error',
          location: 'System',
          educationalExplanation: errorMessage,
          suggestedFix: 'Please try again or contact support if the issue persists.'
        }],
        educationalContent: [],
        allowedOperations: [],
        blockedOperations: []
      };
      
      setLastValidationResult(failedResult);
      return failedResult;
    } finally {
      setIsValidating(false);
    }
  }, [securitySystem]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    validatePatch,
    isValidating,
    lastValidationResult,
    error,
    clearError
  };
}