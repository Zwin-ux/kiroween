/**
 * UnlockNotification - Celebration effects for room unlocks and achievements
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface UnlockNotificationProps {
  type: 'room' | 'achievement' | 'ghost' | 'lore';
  title: string;
  description: string;
  icon?: string;
  celebrationLevel: 'minor' | 'major' | 'epic';
  autoHide?: boolean;
  duration?: number;
  onDismiss: () => void;
  className?: string;
}

export function UnlockNotification({
  type,
  title,
  description,
  icon,
  celebrationLevel,
  autoHide = true,
  duration = 5000,
  onDismiss,
  className
}: UnlockNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Start animation
    setIsAnimating(true);
    
    // Auto-hide after duration
    if (autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  };

  const getTypeIcon = () => {
    if (icon) return icon;
    
    const typeIcons = {
      room: '🏠',
      achievement: '🏆',
      ghost: '👻',
      lore: '📜'
    };
    
    return typeIcons[type] || '🎉';
  };

  const getCelebrationEffects = () => {
    switch (celebrationLevel) {
      case 'epic':
        return {
          border: 'border-gold-500',
          background: 'bg-gradient-to-r from-gold-900/30 to-yellow-900/30',
          glow: 'shadow-lg shadow-gold-500/20',
          animation: 'animate-bounce',
          particles: '✨🎆✨'
        };
      case 'major':
        return {
          border: 'border-blue-500',
          background: 'bg-gradient-to-r from-blue-900/30 to-purple-900/30',
          glow: 'shadow-lg shadow-blue-500/20',
          animation: 'animate-pulse',
          particles: '🎊🎉🎊'
        };
      case 'minor':
        return {
          border: 'border-green-500',
          background: 'bg-gradient-to-r from-green-900/30 to-teal-900/30',
          glow: 'shadow-md shadow-green-500/20',
          animation: 'animate-fade-in',
          particles: '⭐🌟⭐'
        };
    }
  };

  const effects = getCelebrationEffects();

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm",
        "transform transition-all duration-300 ease-out",
        isAnimating ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        className
      )}
    >
      <div
        className={cn(
          "border-2 rounded-lg p-4 backdrop-blur-sm",
          effects.border,
          effects.background,
          effects.glow,
          effects.animation
        )}
      >
        {/* Celebration particles */}
        <div className="absolute -top-2 -right-2 text-lg animate-bounce">
          {effects.particles}
        </div>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-3xl block animate-bounce">
              {getTypeIcon()}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">
                  {title}
                </h3>
                <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white ml-2 flex-shrink-0"
              >
                ✕
              </Button>
            </div>

            {/* Progress bar for auto-hide */}
            {autoHide && (
              <div className="mt-3">
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div 
                    className={cn(
                      "h-1 rounded-full transition-all ease-linear",
                      celebrationLevel === 'epic' && "bg-gold-500",
                      celebrationLevel === 'major' && "bg-blue-500",
                      celebrationLevel === 'minor' && "bg-green-500"
                    )}
                    style={{
                      width: '100%',
                      animation: `shrink ${duration}ms linear forwards`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional celebration effects for epic unlocks */}
        {celebrationLevel === 'epic' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-gold-400/10 to-transparent animate-shimmer" />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/**
 * UnlockNotificationManager - Manages multiple unlock notifications
 */
interface UnlockNotificationData {
  id: string;
  type: 'room' | 'achievement' | 'ghost' | 'lore';
  title: string;
  description: string;
  icon?: string;
  celebrationLevel: 'minor' | 'major' | 'epic';
  timestamp: Date;
}

interface UnlockNotificationManagerProps {
  notifications: UnlockNotificationData[];
  onDismiss: (id: string) => void;
  maxVisible?: number;
  className?: string;
}

export function UnlockNotificationManager({
  notifications,
  onDismiss,
  maxVisible = 3,
  className
}: UnlockNotificationManagerProps) {
  // Show only the most recent notifications
  const visibleNotifications = notifications
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxVisible);

  return (
    <div className={cn("fixed top-4 right-4 z-50 space-y-2", className)}>
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index
          }}
        >
          <UnlockNotification
            type={notification.type}
            title={notification.title}
            description={notification.description}
            icon={notification.icon}
            celebrationLevel={notification.celebrationLevel}
            onDismiss={() => onDismiss(notification.id)}
            duration={5000 + (index * 1000)} // Stagger auto-hide
          />
        </div>
      ))}
    </div>
  );
}