/**
 * useEvidenceTimeline - Hook for managing evidence timeline functionality
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { 
  EvidenceTimeline, 
  type EvidenceTimelineEntry,
  type TimelineSearchQuery,
  type TimelineSearchResult,
  type PostMortemReport
} from '../engine/EvidenceTimeline';
import type { 
  EncounterSession, 
  PatchApplicationResult 
} from '../types/encounter';
import type { PlayerChoice } from '../types/game';

export interface UseEvidenceTimelineReturn {
  // Timeline instance
  timeline: EvidenceTimeline | null;
  
  // Timeline data
  entries: EvidenceTimelineEntry[];
  isLoading: boolean;
  error: string | null;
  
  // Search functionality
  searchResults: TimelineSearchResult | null;
  searchQuery: TimelineSearchQuery;
  
  // Actions
  recordEncounter: (encounter: EncounterSession) => string | null;
  recordPatchApplication: (session: any, result: PatchApplicationResult, choice: PlayerChoice) => string | null;
  recordDecision: (choice: PlayerChoice, outcome: any, context: { ghostId?: string; patchId?: string; roomId: string }) => string | null;
  searchEntries: (query: TimelineSearchQuery) => TimelineSearchResult;
  clearSearch: () => void;
  exportReport: (format?: 'json' | 'csv' | 'pdf') => PostMortemReport | null;
  
  // Persistence
  saveTimeline: () => void;
  loadTimeline: () => boolean;
  
  // Statistics
  statistics: TimelineStatistics;
}

export interface TimelineStatistics {
  totalEntries: number;
  successRate: number;
  averageConfidence: number;
  riskDistribution: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  conceptsLearned: number;
  skillsApplied: number;
  recentActivity: EvidenceTimelineEntry[];
}

export function useEvidenceTimeline(): UseEvidenceTimelineReturn {
  const gameStore = useGameStore();
  const [timeline, setTimeline] = useState<EvidenceTimeline | null>(null);
  const [entries, setEntries] = useState<EvidenceTimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<TimelineSearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState<TimelineSearchQuery>({});

  // Initialize timeline when session changes
  useEffect(() => {
    const sessionId = gameStore.systemStates.session.sessionId;
    const gameRunId = gameStore.run.id;
    
    if (sessionId && gameRunId) {
      try {
        setIsLoading(true);
        setError(null);
        
        const newTimeline = new EvidenceTimeline(sessionId, gameRunId);
        
        // Try to load existing timeline data
        const loaded = newTimeline.loadFromStorage();
        if (loaded) {
          console.log('Loaded existing evidence timeline');
        } else {
          console.log('Created new evidence timeline');
        }
        
        setTimeline(newTimeline);
        setEntries(newTimeline.getTimeline());
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize evidence timeline:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize timeline');
        setIsLoading(false);
      }
    }
  }, [gameStore.systemStates.session.sessionId, gameStore.run.id]);

  // Record encounter
  const recordEncounter = useCallback((encounter: EncounterSession): string | null => {
    if (!timeline) {
      console.warn('Timeline not initialized');
      return null;
    }
    
    try {
      const entryId = timeline.recordEncounter(encounter);
      setEntries(timeline.getTimeline());
      
      // Auto-save after recording
      timeline.saveToStorage();
      
      return entryId;
    } catch (err) {
      console.error('Failed to record encounter:', err);
      setError(err instanceof Error ? err.message : 'Failed to record encounter');
      return null;
    }
  }, [timeline]);

  // Record patch application
  const recordPatchApplication = useCallback((
    session: any, 
    result: PatchApplicationResult, 
    choice: PlayerChoice
  ): string | null => {
    if (!timeline) {
      console.warn('Timeline not initialized');
      return null;
    }
    
    try {
      const entryId = timeline.recordPatchApplication(session, result, choice);
      setEntries(timeline.getTimeline());
      
      // Auto-save after recording
      timeline.saveToStorage();
      
      return entryId;
    } catch (err) {
      console.error('Failed to record patch application:', err);
      setError(err instanceof Error ? err.message : 'Failed to record patch application');
      return null;
    }
  }, [timeline]);

  // Record decision
  const recordDecision = useCallback((
    choice: PlayerChoice, 
    outcome: any, 
    context: { ghostId?: string; patchId?: string; roomId: string }
  ): string | null => {
    if (!timeline) {
      console.warn('Timeline not initialized');
      return null;
    }
    
    try {
      const entryId = timeline.recordDecision(choice, outcome, context);
      setEntries(timeline.getTimeline());
      
      // Auto-save after recording
      timeline.saveToStorage();
      
      return entryId;
    } catch (err) {
      console.error('Failed to record decision:', err);
      setError(err instanceof Error ? err.message : 'Failed to record decision');
      return null;
    }
  }, [timeline]);

  // Search entries
  const searchEntries = useCallback((query: TimelineSearchQuery): TimelineSearchResult => {
    if (!timeline) {
      console.warn('Timeline not initialized');
      return {
        entries: [],
        totalCount: 0,
        searchTime: 0,
        suggestions: [],
        relatedConcepts: []
      };
    }
    
    try {
      const results = timeline.searchEntries(query);
      setSearchResults(results);
      setSearchQuery(query);
      return results;
    } catch (err) {
      console.error('Failed to search entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to search entries');
      return {
        entries: [],
        totalCount: 0,
        searchTime: 0,
        suggestions: [],
        relatedConcepts: []
      };
    }
  }, [timeline]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchResults(null);
    setSearchQuery({});
  }, []);

  // Export report
  const exportReport = useCallback((format: 'json' | 'csv' | 'pdf' = 'json'): PostMortemReport | null => {
    if (!timeline) {
      console.warn('Timeline not initialized');
      return null;
    }
    
    try {
      const report = timeline.exportReport(format);
      
      // Trigger download based on format
      downloadReport(report, format);
      
      return report;
    } catch (err) {
      console.error('Failed to export report:', err);
      setError(err instanceof Error ? err.message : 'Failed to export report');
      return null;
    }
  }, [timeline]);

  // Save timeline
  const saveTimeline = useCallback(() => {
    if (!timeline) {
      console.warn('Timeline not initialized');
      return;
    }
    
    try {
      timeline.saveToStorage();
      console.log('Evidence timeline saved');
    } catch (err) {
      console.error('Failed to save timeline:', err);
      setError(err instanceof Error ? err.message : 'Failed to save timeline');
    }
  }, [timeline]);

  // Load timeline
  const loadTimeline = useCallback((): boolean => {
    if (!timeline) {
      console.warn('Timeline not initialized');
      return false;
    }
    
    try {
      const loaded = timeline.loadFromStorage();
      if (loaded) {
        setEntries(timeline.getTimeline());
        console.log('Evidence timeline loaded');
      }
      return loaded;
    } catch (err) {
      console.error('Failed to load timeline:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
      return false;
    }
  }, [timeline]);

  // Calculate statistics
  const statistics = useMemo((): TimelineStatistics => {
    const displayEntries = searchResults?.entries || entries;
    
    if (displayEntries.length === 0) {
      return {
        totalEntries: 0,
        successRate: 0,
        averageConfidence: 0,
        riskDistribution: {},
        categoryBreakdown: {},
        conceptsLearned: 0,
        skillsApplied: 0,
        recentActivity: []
      };
    }
    
    return {
      totalEntries: displayEntries.length,
      successRate: displayEntries.filter(e => e.outcome === 'success').length / displayEntries.length,
      averageConfidence: displayEntries.reduce((sum, e) => sum + e.confidence, 0) / displayEntries.length,
      riskDistribution: displayEntries.reduce((acc, e) => {
        acc[e.riskLevel] = (acc[e.riskLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      categoryBreakdown: displayEntries.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      conceptsLearned: [...new Set(displayEntries.flatMap(e => e.conceptsInvolved))].length,
      skillsApplied: [...new Set(displayEntries.flatMap(e => e.skillsApplied))].length,
      recentActivity: displayEntries.slice(0, 10) // Most recent 10 entries
    };
  }, [entries, searchResults]);

  // Auto-save timeline periodically
  useEffect(() => {
    if (!timeline) return;
    
    const interval = setInterval(() => {
      saveTimeline();
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(interval);
  }, [timeline, saveTimeline]);

  return {
    timeline,
    entries,
    isLoading,
    error,
    searchResults,
    searchQuery,
    recordEncounter,
    recordPatchApplication,
    recordDecision,
    searchEntries,
    clearSearch,
    exportReport,
    saveTimeline,
    loadTimeline,
    statistics
  };
}

// Helper function to download report
function downloadReport(report: PostMortemReport, format: 'json' | 'csv' | 'pdf') {
  let content: string;
  let mimeType: string;
  let filename: string;
  
  switch (format) {
    case 'json':
      content = JSON.stringify(report, null, 2);
      mimeType = 'application/json';
      filename = `evidence-report-${report.sessionId}.json`;
      break;
      
    case 'csv':
      content = convertToCSV(report);
      mimeType = 'text/csv';
      filename = `evidence-report-${report.sessionId}.csv`;
      break;
      
    case 'pdf':
      // For PDF, we would need a PDF generation library
      // For now, fall back to JSON
      content = JSON.stringify(report, null, 2);
      mimeType = 'application/json';
      filename = `evidence-report-${report.sessionId}.json`;
      console.warn('PDF export not implemented, falling back to JSON');
      break;
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  // Create and trigger download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper function to convert report to CSV
function convertToCSV(report: PostMortemReport): string {
  const headers = [
    'Timestamp',
    'Category',
    'Description',
    'Outcome',
    'Risk Level',
    'Confidence',
    'Room ID',
    'Ghost ID',
    'Concepts',
    'Skills'
  ];
  
  const rows = report.timeline.map(entry => [
    entry.timestamp.toISOString(),
    entry.category,
    `"${entry.description.replace(/"/g, '""')}"`, // Escape quotes
    entry.outcome,
    entry.riskLevel,
    entry.confidence.toString(),
    entry.roomId || '',
    entry.ghostId || '',
    `"${entry.conceptsInvolved.join(', ')}"`,
    `"${entry.skillsApplied.join(', ')}"`,
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}