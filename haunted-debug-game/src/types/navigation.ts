/**
 * Navigation system types
 */

export interface NavigationResult {
  success: boolean;
  message: string;
  effects: any[];
  previousRoom?: string;
  newRoom?: string;
  unlockConditionsMet?: boolean;
}

export interface RoomTransition {
  fromRoom: string;
  toRoom: string;
  timestamp: Date;
  unlockCondition?: string;
}

export interface UnlockCondition {
  type: 'encounters_completed' | 'meters_threshold' | 'items_collected' | 'time_spent';
  requirement: any;
  description: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  backgroundAsset: string;
  unlockConditions: UnlockCondition[];
  availableGhosts: string[];
  isUnlocked: boolean;
  isCompleted: boolean;
}