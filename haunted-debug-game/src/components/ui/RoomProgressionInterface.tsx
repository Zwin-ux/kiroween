/**
 * RoomProgressionInterface - Enhanced room progression with visual indicators and unlock notifications
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Progress } from './progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

interface RoomProgression {
  roomId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  completionProgress: number;
  ghostsResolved: number;
  totalGhosts: number;
  meetsRequirements: boolean;
  nextUnlockHint?: string;
}

interface UnlockNotification {
  roomId: string;
  roomName: string;
  description: string;
  celebrationLevel: 'minor' | 'major' | 'epic';
}

interface DifficultySettings {
  ghostComplexity: number;
  patchRiskMultiplier: number;
  hintAvailability: number;
  timeConstraints: boolean;
  adaptiveAssistance: boolean;
  educationalDepth: number;
}

interface PlayerStatistics {
  encountersCompleted: number;
  successRate: number;
  preferredDebuggingStyle: string;
  averageRiskTolerance: number;
  hintsUsed: number;
}

interface RoomProgressionInterfaceProps {
  roomProgressions: RoomProgression[];
  currentRoom: string;
  playerStatistics: PlayerStatistics;
  difficultySettings: DifficultySettings;
  onRoomSelect: (roomId: string) => void;
  onUnlockNotificationDismiss: (roomId: string) => void;
  className?: string;
}

export function RoomProgressionInterface({
  roomProgressions,
  currentRoom,
  playerStatistics,
  difficultySettings,
  onRoomSelect,
  onUnlockNotificationDismiss,
  className
}: RoomProgressionInterfaceProps) {
  const [unlockNotifications, setUnlockNotifications] = useState<UnlockNotification[]>([]);
  const [showProgressDetails, setShowProgressDetails] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // Room metadata
  const roomMetadata: Record<string, { name: string; description: string; icon: string; color: string }> = {
    'boot-sector': {
      name: 'Boot Sector',
      description: 'Where the system awakens',
      icon: '🚀',
      color: 'blue'
    },
    'dependency-crypt': {
      name: 'Dependency Crypt',
      description: 'Tangled imports and circular references',
      icon: '🕸️',
      color: 'green'
    },
    'ghost-memory-heap': {
      name: 'Ghost Memory Heap',
      description: 'Memory leaks and phantom allocations',
      icon: '💾',
      color: 'purple'
    },
    'possessed-compiler': {
      name: 'Possessed Compiler',
      description: 'Syntax errors and compilation nightmares',
      icon: '⚙️',
      color: 'orange'
    },
    'ethics-tribunal': {
      name: 'Ethics Tribunal',
      description: 'Moral dilemmas in code decisions',
      icon: '⚖️',
      color: 'yellow'
    },
    'final-merge': {
      name: 'Final Merge',
      description: 'The ultimate debugging challenge',
      icon: '🎯',
      color: 'red'
    }
  };

  // Check for newly unlocked rooms
  useEffect(() => {
    const newlyUnlocked = roomProgressions.filter(room => 
      room.isUnlocked && !unlockNotifications.some(notif => notif.roomId === room.roomId)
    );

    if (newlyUnlocked.length > 0) {
      const notifications = newlyUnlocked.map(room => ({
        roomId: room.roomId,
        roomName: roomMetadata[room.roomId]?.name || room.roomId,
        description: roomMetadata[room.roomId]?.description || '',
        celebrationLevel: getCelebrationLevel(room.roomId)
      }));

      setUnlockNotifications(prev => [...prev, ...notifications]);
    }
  }, [roomProgressions, unlockNotifications]);

  const getCelebrationLevel = (roomId: string): 'minor' | 'major' | 'epic' => {
    const roomOrder = ['boot-sector', 'dependency-crypt', 'ghost-memory-heap', 'possessed-compiler', 'ethics-tribunal', 'final-merge'];
    const index = roomOrder.indexOf(roomId);
    
    if (index <= 1) return 'minor';
    if (index <= 3) return 'major';
    return 'epic';
  };

  const getProgressColor = (progress: number, isCompleted: boolean) => {
    if (isCompleted) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRoomStatusIcon = (room: RoomProgression) => {
    if (room.isCompleted) return '✅';
    if (room.isUnlocked) return '🔓';
    if (room.meetsRequirements) return '🔑';
    return '🔒';
  };

  const dismissUnlockNotification = (roomId: string) => {
    setUnlockNotifications(prev => prev.filter(notif => notif.roomId !== roomId));
    onUnlockNotificationDismiss(roomId);
  };

  const showRoomDetails = (roomId: string) => {
    setSelectedRoom(roomId);
    setShowProgressDetails(true);
  };

  const getOverallProgress = () => {
    const unlockedCount = roomProgressions.filter(room => room.isUnlocked).length;
    const completedCount = roomProgressions.filter(room => room.isCompleted).length;
    const totalRooms = roomProgressions.length;
    
    return {
      unlocked: (unlockedCount / totalRooms) * 100,
      completed: (completedCount / totalRooms) * 100,
      unlockedCount,
      completedCount,
      totalRooms
    };
  };

  const overallProgress = getOverallProgress();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Unlock Notifications */}
      {unlockNotifications.map((notification) => (
        <div
          key={notification.roomId}
          className={cn(
            "border rounded-lg p-4 animate-pulse",
            notification.celebrationLevel === 'epic' && "border-gold-500 bg-gold-900/20",
            notification.celebrationLevel === 'major' && "border-blue-500 bg-blue-900/20",
            notification.celebrationLevel === 'minor' && "border-green-500 bg-green-900/20"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {roomMetadata[notification.roomId]?.icon || '🎉'}
              </span>
              <div>
                <h3 className="text-white font-bold">Room Unlocked!</h3>
                <p className="text-gray-300">{notification.roomName}</p>
                <p className="text-sm text-gray-400">{notification.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissUnlockNotification(notification.roomId)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </div>
      ))}

      {/* Overall Progress Summary */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <h2 className="text-white font-bold text-lg mb-4">Progression Overview</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rooms Unlocked</span>
              <span className="text-white">{overallProgress.unlockedCount}/{overallProgress.totalRooms}</span>
            </div>
            <Progress value={overallProgress.unlocked} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rooms Completed</span>
              <span className="text-white">{overallProgress.completedCount}/{overallProgress.totalRooms}</span>
            </div>
            <Progress value={overallProgress.completed} className="h-2" />
          </div>
        </div>

        {/* Player Performance Indicators */}
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="text-center">
            <div className="text-white font-mono text-lg">
              {Math.round(playerStatistics.successRate * 100)}%
            </div>
            <div className="text-gray-400">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-white font-mono text-lg">
              {playerStatistics.encountersCompleted}
            </div>
            <div className="text-gray-400">Encounters</div>
          </div>
          <div className="text-center">
            <div className="text-white font-mono text-lg">
              {playerStatistics.preferredDebuggingStyle}
            </div>
            <div className="text-gray-400">Style</div>
          </div>
        </div>
      </div>

      {/* Room List with Enhanced Progress */}
      <div className="space-y-3">
        <h3 className="text-white font-bold">Room Progress</h3>
        
        {roomProgressions.map((room) => {
          const metadata = roomMetadata[room.roomId];
          const isActive = currentRoom === room.roomId;
          
          return (
            <div
              key={room.roomId}
              className={cn(
                "border rounded-lg p-4 transition-all duration-200",
                isActive && "border-red-500 bg-red-900/20",
                room.isUnlocked && !isActive && "border-gray-600 bg-gray-800/50",
                !room.isUnlocked && "border-gray-700 bg-gray-900/30 opacity-60"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{metadata?.icon || '📁'}</span>
                  <div>
                    <h4 className="text-white font-bold flex items-center space-x-2">
                      <span>{metadata?.name || room.roomId}</span>
                      <span className="text-sm">{getRoomStatusIcon(room)}</span>
                    </h4>
                    <p className="text-sm text-gray-400">{metadata?.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {room.isUnlocked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showRoomDetails(room.roomId)}
                      className="text-gray-400 hover:text-white"
                    >
                      📊
                    </Button>
                  )}
                  
                  {room.isUnlocked && (
                    <Button
                      variant={isActive ? "horror" : "outline"}
                      size="sm"
                      onClick={() => onRoomSelect(room.roomId)}
                      disabled={isActive}
                    >
                      {isActive ? 'Current' : 'Enter'}
                    </Button>
                  )}
                </div>
              </div>

              {room.isUnlocked && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">
                      {room.ghostsResolved}/{room.totalGhosts} ghosts resolved
                    </span>
                  </div>
                  <Progress 
                    value={room.completionProgress} 
                    className="h-2"
                  />
                </div>
              )}

              {!room.isUnlocked && room.nextUnlockHint && (
                <div className="mt-2 p-2 bg-gray-800 rounded text-sm">
                  <span className="text-gray-400">Unlock requirement: </span>
                  <span className="text-gray-300">{room.nextUnlockHint}</span>
                </div>
              )}

              {!room.isUnlocked && room.meetsRequirements && (
                <div className="mt-2 p-2 bg-green-900/30 border border-green-700 rounded text-sm">
                  <span className="text-green-300">🔑 Ready to unlock!</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Difficulty Indicator */}
      <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <h3 className="text-white font-bold mb-3">Current Difficulty</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Ghost Complexity</span>
              <span className="text-white">{Math.round(difficultySettings.ghostComplexity * 100)}%</span>
            </div>
            <Progress value={difficultySettings.ghostComplexity * 100} className="h-1" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Hint Availability</span>
              <span className="text-white">{Math.round(difficultySettings.hintAvailability * 100)}%</span>
            </div>
            <Progress value={difficultySettings.hintAvailability * 100} className="h-1" />
          </div>
        </div>

        {difficultySettings.adaptiveAssistance && (
          <div className="mt-2 text-xs text-blue-300">
            🤖 Adaptive assistance is active
          </div>
        )}
      </div>

      {/* Room Details Dialog */}
      <Dialog open={showProgressDetails} onOpenChange={setShowProgressDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRoom && roomMetadata[selectedRoom]?.name} Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedRoom && (
            <div className="space-y-4">
              {(() => {
                const room = roomProgressions.find(r => r.roomId === selectedRoom);
                if (!room) return null;
                
                return (
                  <>
                    <div className="text-center">
                      <span className="text-4xl">{roomMetadata[selectedRoom]?.icon}</span>
                      <h3 className="text-lg font-bold text-white mt-2">
                        {roomMetadata[selectedRoom]?.name}
                      </h3>
                      <p className="text-gray-400">{roomMetadata[selectedRoom]?.description}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <span className="text-white">
                          {room.isCompleted ? 'Completed' : room.isUnlocked ? 'In Progress' : 'Locked'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ghosts Resolved</span>
                        <span className="text-white">{room.ghostsResolved}/{room.totalGhosts}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-400">Completion</span>
                        <span className="text-white">{Math.round(room.completionProgress)}%</span>
                      </div>
                      
                      <Progress value={room.completionProgress} className="h-2" />
                    </div>

                    {room.nextUnlockHint && (
                      <div className="p-3 bg-gray-800 rounded">
                        <h4 className="text-white font-bold mb-1">Next Steps</h4>
                        <p className="text-gray-300 text-sm">{room.nextUnlockHint}</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}