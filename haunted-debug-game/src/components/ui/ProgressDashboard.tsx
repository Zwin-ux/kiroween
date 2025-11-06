/**
 * ProgressDashboard - Visual progress tracking and room completion status
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Progress } from './progress';
import { useProgressTracking, useProgressAnalytics } from '@/hooks/useProgressTracking';
import type { RoomProgress, ProgressRequirement } from '@/engine/ProgressTracker';

interface ProgressDashboardProps {
  onClose: () => void;
  onNavigateToRoom?: (roomId: string) => void;
  className?: string;
}

export function ProgressDashboard({ 
  onClose, 
  onNavigateToRoom, 
  className 
}: ProgressDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'analytics'>('overview');
  
  const {
    allRoomProgress,
    currentRoomProgress,
    nextRecommendedRoom,
    unlockableRooms,
    isLoading,
    error
  } = useProgressTracking();
  
  const analytics = useProgressAnalytics();

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-gray-900", className)}>
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-gray-900", className)}>
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-400">Error loading progress: {error}</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-gray-900 text-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-red-700">
        <div>
          <h2 className="text-2xl font-bold text-red-300">Progress Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">
            Track your debugging journey and room completion
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕ Close
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-700">
        {(['overview', 'rooms', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 text-sm font-medium capitalize transition-colors",
              activeTab === tab
                ? "text-red-300 border-b-2 border-red-500 bg-gray-800/50"
                : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/30"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <OverviewSection 
            analytics={analytics}
            currentRoomProgress={currentRoomProgress}
            nextRecommendedRoom={nextRecommendedRoom}
            unlockableRooms={unlockableRooms}
            onNavigateToRoom={onNavigateToRoom}
          />
        )}
        
        {activeTab === 'rooms' && (
          <RoomsSection 
            allRoomProgress={allRoomProgress}
            onNavigateToRoom={onNavigateToRoom}
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsSection analytics={analytics} />
        )}
      </div>
    </div>
  );
}

// Overview Section Component
function OverviewSection({ 
  analytics, 
  currentRoomProgress, 
  nextRecommendedRoom,
  unlockableRooms,
  onNavigateToRoom 
}: {
  analytics: any;
  currentRoomProgress: RoomProgress | null;
  nextRecommendedRoom: string | null;
  unlockableRooms: string[];
  onNavigateToRoom?: (roomId: string) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Overall Progress */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Overall Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProgressCard
            title="Completion"
            value={analytics.progressPercentage}
            format="percentage"
            description={`${analytics.roomsCompleted}/${analytics.totalRooms} rooms completed`}
            color="text-green-400"
          />
          
          <ProgressCard
            title="Current Streak"
            value={analytics.currentStreak}
            format="number"
            description={analytics.isOnStreak ? "Keep it up!" : "Start a new streak"}
            color={analytics.isOnStreak ? "text-yellow-400" : "text-gray-400"}
          />
          
          <ProgressCard
            title="Efficiency"
            value={analytics.efficiencyScore * 100}
            format="percentage"
            description={analytics.isHighPerformer ? "Excellent performance" : "Room for improvement"}
            color={analytics.isHighPerformer ? "text-blue-400" : "text-orange-400"}
          />
          
          <ProgressCard
            title="Learning Rate"
            value={analytics.learningVelocity}
            format="decimal"
            description={`${analytics.learningRate} learner`}
            color="text-purple-400"
          />
        </div>
      </div>

      {/* Current Room Status */}
      {currentRoomProgress && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Current Room Progress</h3>
          <CurrentRoomCard roomProgress={currentRoomProgress} />
        </div>
      )}

      {/* Recommendations */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Recommendations</h3>
        <div className="space-y-4">
          {nextRecommendedRoom && (
            <RecommendationCard
              type="next_room"
              title="Continue Your Journey"
              description={`We recommend focusing on ${getRoomDisplayName(nextRecommendedRoom)} next`}
              action="Go to Room"
              onAction={() => onNavigateToRoom?.(nextRecommendedRoom)}
            />
          )}
          
          {unlockableRooms.length > 0 && (
            <RecommendationCard
              type="unlock"
              title="New Areas Available!"
              description={`You can now unlock: ${unlockableRooms.map(getRoomDisplayName).join(', ')}`}
              action="View Rooms"
              onAction={() => {/* Switch to rooms tab */}}
            />
          )}
          
          {analytics.currentStreak === 0 && (
            <RecommendationCard
              type="improvement"
              title="Build Momentum"
              description="Focus on making successful decisions to build a streak"
              action="View Tips"
              onAction={() => {/* Show tips */}}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Rooms Section Component
function RoomsSection({ 
  allRoomProgress, 
  onNavigateToRoom 
}: {
  allRoomProgress: RoomProgress[];
  onNavigateToRoom?: (roomId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">Room Progress</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allRoomProgress.map((roomProgress) => (
          <RoomProgressCard
            key={roomProgress.roomId}
            roomProgress={roomProgress}
            onNavigate={() => onNavigateToRoom?.(roomProgress.roomId)}
          />
        ))}
      </div>
    </div>
  );
}

// Analytics Section Component
function AnalyticsSection({ analytics }: { analytics: any }) {
  return (
    <div className="space-y-8">
      <h3 className="text-xl font-bold text-white">Detailed Analytics</h3>
      
      {/* Performance Metrics */}
      <div>
        <h4 className="text-lg font-medium text-gray-300 mb-4">Performance Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Longest Streak"
            value={analytics.longestStreak}
            subtitle="consecutive successes"
          />
          
          <MetricCard
            title="Average Time per Room"
            value={analytics.averageTimePerRoom.toFixed(1)}
            subtitle="minutes"
          />
          
          <MetricCard
            title="Learning Velocity"
            value={analytics.learningVelocity.toFixed(2)}
            subtitle="concepts per hour"
          />
        </div>
      </div>

      {/* Progress Trends */}
      <div>
        <h4 className="text-lg font-medium text-gray-300 mb-4">Progress Trends</h4>
        <div className="bg-gray-800/50 p-6 rounded-lg">
          <p className="text-gray-400 text-center">
            Progress trend visualization would appear here
          </p>
          <p className="text-sm text-gray-500 text-center mt-2">
            Track your improvement over time
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function ProgressCard({ 
  title, 
  value, 
  format, 
  description, 
  color 
}: {
  title: string;
  value: number;
  format: 'percentage' | 'number' | 'decimal';
  description: string;
  color: string;
}) {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
        return val.toString();
      case 'decimal':
        return val.toFixed(2);
      default:
        return val.toString();
    }
  };

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
      <div className={cn("text-2xl font-bold mb-1", color)}>
        {formatValue(value, format)}
      </div>
      <div className="text-white font-medium text-sm mb-1">{title}</div>
      <div className="text-gray-400 text-xs">{description}</div>
    </div>
  );
}

function CurrentRoomCard({ roomProgress }: { roomProgress: RoomProgress }) {
  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-white">
          {getRoomDisplayName(roomProgress.roomId)}
        </h4>
        <div className="text-sm text-gray-400">
          {(roomProgress.completionPercentage * 100).toFixed(0)}% Complete
        </div>
      </div>
      
      <Progress value={roomProgress.completionPercentage * 100} className="mb-4" />
      
      <div className="space-y-2">
        {roomProgress.requirements.map((req, i) => (
          <RequirementItem
            key={i}
            requirement={req}
            isCompleted={roomProgress.completedRequirements.includes(req.description)}
          />
        ))}
      </div>
      
      {roomProgress.estimatedTimeToComplete && (
        <div className="mt-4 text-sm text-gray-400">
          Estimated time to complete: {roomProgress.estimatedTimeToComplete} minutes
        </div>
      )}
    </div>
  );
}

function RoomProgressCard({ 
  roomProgress, 
  onNavigate 
}: { 
  roomProgress: RoomProgress; 
  onNavigate: () => void; 
}) {
  const getStatusColor = () => {
    if (!roomProgress.isUnlocked) return 'border-gray-600 bg-gray-800/30';
    if (roomProgress.isCompleted) return 'border-green-600 bg-green-900/20';
    return 'border-blue-600 bg-blue-900/20';
  };

  const getStatusIcon = () => {
    if (!roomProgress.isUnlocked) return '🔒';
    if (roomProgress.isCompleted) return '✅';
    return '🚪';
  };

  return (
    <div className={cn("p-4 rounded-lg border", getStatusColor())}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getStatusIcon()}</span>
          <h4 className="font-medium text-white">
            {getRoomDisplayName(roomProgress.roomId)}
          </h4>
        </div>
        
        {roomProgress.isUnlocked && (
          <Button
            size="sm"
            onClick={onNavigate}
            disabled={!roomProgress.isUnlocked}
            className="text-xs"
          >
            {roomProgress.isCompleted ? 'Revisit' : 'Enter'}
          </Button>
        )}
      </div>
      
      {roomProgress.isUnlocked && (
        <>
          <Progress value={roomProgress.completionPercentage * 100} className="mb-2" />
          <div className="text-xs text-gray-400">
            {roomProgress.completedRequirements.length}/{roomProgress.requirements.length} requirements met
          </div>
        </>
      )}
      
      {!roomProgress.isUnlocked && (
        <div className="text-xs text-gray-500">
          Complete previous rooms to unlock
        </div>
      )}
    </div>
  );
}

function RequirementItem({ 
  requirement, 
  isCompleted 
}: { 
  requirement: ProgressRequirement; 
  isCompleted: boolean; 
}) {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className={isCompleted ? "text-green-400" : "text-gray-400"}>
        {isCompleted ? "✓" : "○"}
      </span>
      <span className={isCompleted ? "text-gray-300" : "text-gray-400"}>
        {requirement.description}
      </span>
    </div>
  );
}

function RecommendationCard({ 
  type, 
  title, 
  description, 
  action, 
  onAction 
}: {
  type: string;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  const getTypeColor = () => {
    switch (type) {
      case 'next_room': return 'border-blue-500 bg-blue-900/20';
      case 'unlock': return 'border-green-500 bg-green-900/20';
      case 'improvement': return 'border-yellow-500 bg-yellow-900/20';
      default: return 'border-gray-500 bg-gray-900/20';
    }
  };

  return (
    <div className={cn("p-4 rounded-lg border", getTypeColor())}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-white mb-1">{title}</h4>
          <p className="text-sm text-gray-300">{description}</p>
        </div>
        <Button size="sm" onClick={onAction}>
          {action}
        </Button>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtitle 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
}) {
  return (
    <div className="bg-gray-800/30 p-4 rounded-lg text-center">
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-300 mb-1">{title}</div>
      <div className="text-xs text-gray-400">{subtitle}</div>
    </div>
  );
}

// Helper function
function getRoomDisplayName(roomId: string): string {
  const roomNames: Record<string, string> = {
    'boot-sector': 'Boot Sector',
    'dependency-crypt': 'Dependency Crypt',
    'ghost-memory-heap': 'Ghost Memory Heap',
    'possessed-compiler': 'Possessed Compiler',
    'ethics-tribunal': 'Ethics Tribunal',
    'final-merge': 'Final Merge'
  };
  return roomNames[roomId] || roomId;
}