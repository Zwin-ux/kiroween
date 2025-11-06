/**
 * NavigationPanel - Room navigation and progress visualization
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Progress } from './progress';

interface Room {
  id: string;
  name: string;
  description: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  encounterCount: number;
  completedEncounters: number;
}

interface NavigationPanelProps {
  currentRoom: string;
  unlockedRooms: string[];
  onRoomSelect: (roomId: string) => void;
  className?: string;
}

export function NavigationPanel({ 
  currentRoom, 
  unlockedRooms, 
  onRoomSelect, 
  className 
}: NavigationPanelProps) {
  
  // Define room data
  const rooms: Room[] = [
    {
      id: 'boot-sector',
      name: 'Boot Sector',
      description: 'Where the system awakens',
      isUnlocked: true,
      isCompleted: false,
      encounterCount: 3,
      completedEncounters: 0
    },
    {
      id: 'dependency-crypt',
      name: 'Dependency Crypt',
      description: 'Tangled imports and circular references',
      isUnlocked: unlockedRooms.includes('dependency-crypt'),
      isCompleted: false,
      encounterCount: 4,
      completedEncounters: 0
    },
    {
      id: 'ghost-memory-heap',
      name: 'Ghost Memory Heap',
      description: 'Memory leaks and phantom allocations',
      isUnlocked: unlockedRooms.includes('ghost-memory-heap'),
      isCompleted: false,
      encounterCount: 3,
      completedEncounters: 0
    },
    {
      id: 'possessed-compiler',
      name: 'Possessed Compiler',
      description: 'Syntax errors and compilation nightmares',
      isUnlocked: unlockedRooms.includes('possessed-compiler'),
      isCompleted: false,
      encounterCount: 5,
      completedEncounters: 0
    },
    {
      id: 'ethics-tribunal',
      name: 'Ethics Tribunal',
      description: 'Moral dilemmas in code decisions',
      isUnlocked: unlockedRooms.includes('ethics-tribunal'),
      isCompleted: false,
      encounterCount: 2,
      completedEncounters: 0
    },
    {
      id: 'final-merge',
      name: 'Final Merge',
      description: 'The ultimate debugging challenge',
      isUnlocked: unlockedRooms.includes('final-merge'),
      isCompleted: false,
      encounterCount: 1,
      completedEncounters: 0
    }
  ];

  const getRoomIcon = (roomId: string) => {
    const icons: Record<string, string> = {
      'boot-sector': '🚀',
      'dependency-crypt': '🕸️',
      'ghost-memory-heap': '💾',
      'possessed-compiler': '⚙️',
      'ethics-tribunal': '⚖️',
      'final-merge': '🎯'
    };
    return icons[roomId] || '📁';
  };

  const getRoomProgress = (room: Room) => {
    if (room.encounterCount === 0) return 0;
    return (room.completedEncounters / room.encounterCount) * 100;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="border-b border-gray-700 pb-4">
        <h2 className="text-white font-bold text-lg mb-2">Navigation</h2>
        <p className="text-gray-400 text-sm">
          Explore different areas of the haunted codebase
        </p>
      </div>

      <div className="space-y-2">
        {rooms.map((room) => {
          const isActive = currentRoom === room.id;
          const progress = getRoomProgress(room);
          
          return (
            <div key={room.id} className="space-y-2">
              <Button
                variant={isActive ? "horror" : room.isUnlocked ? "outline" : "ghost"}
                size="sm"
                onClick={() => room.isUnlocked && onRoomSelect(room.id)}
                disabled={!room.isUnlocked}
                className={cn(
                  "w-full justify-start text-left p-3 h-auto",
                  isActive && "bg-red-900/50 border-red-500",
                  !room.isUnlocked && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start space-x-3 w-full">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {getRoomIcon(room.id)}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-sm truncate">
                        {room.name}
                      </h3>
                      {isActive && (
                        <span className="text-xs text-red-300 flex-shrink-0">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                      {room.description}
                    </p>
                    
                    {room.isUnlocked && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            Progress
                          </span>
                          <span className="text-gray-400">
                            {room.completedEncounters}/{room.encounterCount}
                          </span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-1"
                        />
                      </div>
                    )}
                    
                    {!room.isUnlocked && (
                      <div className="text-xs text-gray-500 flex items-center">
                        🔒 Locked
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            </div>
          );
        })}
      </div>

      {/* Overall progress */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-white font-bold text-sm mb-3">Overall Progress</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Rooms Unlocked</span>
            <span className="text-white">
              {unlockedRooms.length}/{rooms.length}
            </span>
          </div>
          
          <Progress 
            value={(unlockedRooms.length / rooms.length) * 100}
            className="h-2"
          />
          
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
            <div>
              <div className="text-white font-mono">
                {rooms.reduce((sum, room) => sum + room.completedEncounters, 0)}
              </div>
              <div>Encounters</div>
            </div>
            <div>
              <div className="text-white font-mono">
                {rooms.filter(room => room.isCompleted).length}
              </div>
              <div>Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="border-t border-gray-700 pt-4 space-y-2">
        <h3 className="text-white font-bold text-sm mb-2">Quick Actions</h3>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-400 hover:text-white"
          onClick={() => {/* TODO: Implement save game */}}
        >
          💾 Save Progress
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-400 hover:text-white"
          onClick={() => {/* TODO: Implement game menu */}}
        >
          ⚙️ Game Menu
        </Button>
      </div>
    </div>
  );
}