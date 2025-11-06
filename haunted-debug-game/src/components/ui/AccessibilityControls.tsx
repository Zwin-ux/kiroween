/**
 * AccessibilityControls - Comprehensive accessibility settings interface
 */

import React, { useState, useEffect } from 'react';
import { Button } from './button';
import type { 
  AccessibilitySettings, 
  AccessibilityProfile, 
  AccessibilityFeature 
} from '@/types/game';

interface AccessibilityControlsProps {
  settings: AccessibilitySettings;
  profiles: AccessibilityProfile[];
  features: AccessibilityFeature[];
  currentProfile: AccessibilityProfile | null;
  onSettingsChange: (settings: Partial<AccessibilitySettings>) => void;
  onProfileChange: (profileId: string) => void;
  onFeatureToggle: (featureId: string, enabled: boolean) => void;
  onTestFeature: (featureId: string) => Promise<void>;
  onExportSettings: () => string;
  onImportSettings: (data: string) => boolean;
  className?: string;
}

export function AccessibilityControls({
  settings,
  profiles,
  features,
  currentProfile,
  onSettingsChange,
  onProfileChange,
  onFeatureToggle,
  onTestFeature,
  onExportSettings,
  onImportSettings,
  className = ''
}: AccessibilityControlsProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'detailed' | 'profiles' | 'features'>('quick');
  const [testingFeature, setTestingFeature] = useState<string | null>(null);
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Group features by category
  const featuresByCategory = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, AccessibilityFeature[]>);

  const handleSliderChange = (key: keyof AccessibilitySettings, value: number) => {
    onSettingsChange({ [key]: value });
  };

  const handleToggleChange = (key: keyof AccessibilitySettings, checked: boolean) => {
    onSettingsChange({ [key]: checked });
  };

  const handleFeatureTest = async (featureId: string) => {
    setTestingFeature(featureId);
    try {
      await onTestFeature(featureId);
    } finally {
      setTestingFeature(null);
    }
  };

  const handleExport = () => {
    const data = onExportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accessibility-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (importData.trim()) {
      const success = onImportSettings(importData);
      if (success) {
        setImportData('');
        setShowImportDialog(false);
        alert('Settings imported successfully!');
      } else {
        alert('Failed to import settings. Please check the format.');
      }
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={`accessibility-controls ${className}`}>
      {/* Header */}
      <div className="accessibility-header">
        <h2>Accessibility Settings</h2>
        <div className="current-profile">
          {currentProfile && (
            <span>Active: {currentProfile.name}</span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab ${activeTab === 'quick' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick')}
        >
          Quick Setup
        </button>
        <button
          className={`tab ${activeTab === 'detailed' ? 'active' : ''}`}
          onClick={() => setActiveTab('detailed')}
        >
          Detailed Settings
        </button>
        <button
          className={`tab ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          Profiles
        </button>
        <button
          className={`tab ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          Features
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'quick' && (
          <QuickSetupTab
            settings={settings}
            profiles={profiles}
            onSettingsChange={onSettingsChange}
            onProfileChange={onProfileChange}
          />
        )}

        {activeTab === 'detailed' && (
          <DetailedSettingsTab
            settings={settings}
            onSettingsChange={onSettingsChange}
            onSliderChange={handleSliderChange}
            onToggleChange={handleToggleChange}
          />
        )}

        {activeTab === 'profiles' && (
          <ProfilesTab
            profiles={profiles}
            currentProfile={currentProfile}
            onProfileChange={onProfileChange}
            onExport={handleExport}
            onImport={() => setShowImportDialog(true)}
          />
        )}

        {activeTab === 'features' && (
          <FeaturesTab
            featuresByCategory={featuresByCategory}
            testingFeature={testingFeature}
            onFeatureToggle={onFeatureToggle}
            onFeatureTest={handleFeatureTest}
          />
        )}
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="import-dialog-overlay">
          <div className="import-dialog">
            <h3>Import Accessibility Settings</h3>
            <div className="import-options">
              <label>
                Upload File:
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                />
              </label>
              <div className="or-divider">or</div>
              <label>
                Paste JSON:
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste accessibility settings JSON here..."
                  rows={10}
                />
              </label>
            </div>
            <div className="dialog-actions">
              <Button onClick={handleImport} disabled={!importData.trim()}>
                Import
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImportDialog(false);
                  setImportData('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick Setup Tab Component
function QuickSetupTab({
  settings,
  profiles,
  onSettingsChange,
  onProfileChange
}: {
  settings: AccessibilitySettings;
  profiles: AccessibilityProfile[];
  onSettingsChange: (settings: Partial<AccessibilitySettings>) => void;
  onProfileChange: (profileId: string) => void;
}) {
  return (
    <div className="quick-setup">
      <h3>Quick Accessibility Setup</h3>
      
      {/* Profile Selection */}
      <div className="profile-selection">
        <h4>Choose a Profile</h4>
        <div className="profile-grid">
          {profiles.filter(p => p.isDefault).map(profile => (
            <button
              key={profile.id}
              className="profile-card"
              onClick={() => onProfileChange(profile.id)}
            >
              <div className="profile-name">{profile.name}</div>
              <div className="profile-description">{profile.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="quick-toggles">
        <h4>Quick Adjustments</h4>
        
        <label className="toggle-item">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(e) => onSettingsChange({ reduceMotion: e.target.checked })}
          />
          <span>Reduce Motion</span>
          <small>Minimizes animations and movement effects</small>
        </label>

        <label className="toggle-item">
          <input
            type="checkbox"
            checked={settings.disableFlashing}
            onChange={(e) => onSettingsChange({ disableFlashing: e.target.checked })}
          />
          <span>Disable Flashing</span>
          <small>Removes flashing and strobe effects</small>
        </label>

        <label className="toggle-item">
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => onSettingsChange({ highContrast: e.target.checked })}
          />
          <span>High Contrast</span>
          <small>Increases contrast for better visibility</small>
        </label>

        <label className="toggle-item">
          <input
            type="checkbox"
            checked={settings.alternativeText}
            onChange={(e) => onSettingsChange({ alternativeText: e.target.checked })}
          />
          <span>Alternative Text</span>
          <small>Provides text descriptions for visual elements</small>
        </label>
      </div>

      {/* Quick Sliders */}
      <div className="quick-sliders">
        <div className="slider-item">
          <label>Visual Effect Intensity: {Math.round(settings.visualEffectIntensity * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.visualEffectIntensity}
            onChange={(e) => onSettingsChange({ visualEffectIntensity: parseFloat(e.target.value) })}
          />
        </div>

        <div className="slider-item">
          <label>Audio Volume: {Math.round(settings.audioEffectVolume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.audioEffectVolume}
            onChange={(e) => onSettingsChange({ audioEffectVolume: parseFloat(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}

// Detailed Settings Tab Component
function DetailedSettingsTab({
  settings,
  onSettingsChange,
  onSliderChange,
  onToggleChange
}: {
  settings: AccessibilitySettings;
  onSettingsChange: (settings: Partial<AccessibilitySettings>) => void;
  onSliderChange: (key: keyof AccessibilitySettings, value: number) => void;
  onToggleChange: (key: keyof AccessibilitySettings, checked: boolean) => void;
}) {
  return (
    <div className="detailed-settings">
      <h3>Detailed Accessibility Settings</h3>

      {/* Visual Settings */}
      <div className="settings-section">
        <h4>Visual Settings</h4>
        
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(e) => onToggleChange('reduceMotion', e.target.checked)}
            />
            Reduce Motion
          </label>
          <p>Minimizes animations, transitions, and moving elements that may cause discomfort.</p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.disableFlashing}
              onChange={(e) => onToggleChange('disableFlashing', e.target.checked)}
            />
            Disable Flashing Effects
          </label>
          <p>Removes all flashing, strobing, and rapidly changing visual effects.</p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => onToggleChange('highContrast', e.target.checked)}
            />
            High Contrast Mode
          </label>
          <p>Increases contrast between text and background for better readability.</p>
        </div>

        <div className="setting-item">
          <label>Visual Effect Intensity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.visualEffectIntensity}
            onChange={(e) => onSliderChange('visualEffectIntensity', parseFloat(e.target.value))}
          />
          <span>{Math.round(settings.visualEffectIntensity * 100)}%</span>
          <p>Controls the overall intensity of visual effects and animations.</p>
        </div>
      </div>

      {/* Audio Settings */}
      <div className="settings-section">
        <h4>Audio Settings</h4>
        
        <div className="setting-item">
          <label>Audio Effect Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.audioEffectVolume}
            onChange={(e) => onSliderChange('audioEffectVolume', parseFloat(e.target.value))}
          />
          <span>{Math.round(settings.audioEffectVolume * 100)}%</span>
          <p>Controls the volume of all audio effects and feedback sounds.</p>
        </div>
      </div>

      {/* Assistive Technology */}
      <div className="settings-section">
        <h4>Assistive Technology</h4>
        
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.alternativeText}
              onChange={(e) => onToggleChange('alternativeText', e.target.checked)}
            />
            Alternative Text Descriptions
          </label>
          <p>Provides text descriptions for visual elements and effects.</p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.screenReaderSupport}
              onChange={(e) => onToggleChange('screenReaderSupport', e.target.checked)}
            />
            Screen Reader Support
          </label>
          <p>Optimizes the interface for screen reader compatibility.</p>
        </div>
      </div>
    </div>
  );
}

// Profiles Tab Component
function ProfilesTab({
  profiles,
  currentProfile,
  onProfileChange,
  onExport,
  onImport
}: {
  profiles: AccessibilityProfile[];
  currentProfile: AccessibilityProfile | null;
  onProfileChange: (profileId: string) => void;
  onExport: () => void;
  onImport: () => void;
}) {
  return (
    <div className="profiles-tab">
      <h3>Accessibility Profiles</h3>
      
      <div className="profile-list">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className={`profile-item ${currentProfile?.id === profile.id ? 'active' : ''}`}
          >
            <div className="profile-info">
              <h4>{profile.name}</h4>
              <p>{profile.description}</p>
              {profile.isDefault && <span className="default-badge">Default</span>}
            </div>
            <div className="profile-actions">
              <Button
                onClick={() => onProfileChange(profile.id)}
                variant={currentProfile?.id === profile.id ? 'default' : 'outline'}
              >
                {currentProfile?.id === profile.id ? 'Active' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="profile-management">
        <h4>Profile Management</h4>
        <div className="management-actions">
          <Button onClick={onExport}>Export Settings</Button>
          <Button onClick={onImport} variant="outline">Import Settings</Button>
        </div>
      </div>
    </div>
  );
}

// Features Tab Component
function FeaturesTab({
  featuresByCategory,
  testingFeature,
  onFeatureToggle,
  onFeatureTest
}: {
  featuresByCategory: Record<string, AccessibilityFeature[]>;
  testingFeature: string | null;
  onFeatureToggle: (featureId: string, enabled: boolean) => void;
  onFeatureTest: (featureId: string) => Promise<void>;
}) {
  return (
    <div className="features-tab">
      <h3>Accessibility Features</h3>
      
      {Object.entries(featuresByCategory).map(([category, features]) => (
        <div key={category} className="feature-category">
          <h4>{category.charAt(0).toUpperCase() + category.slice(1)} Features</h4>
          
          <div className="feature-list">
            {features.map(feature => (
              <div key={feature.id} className="feature-item">
                <div className="feature-info">
                  <div className="feature-header">
                    <label>
                      <input
                        type="checkbox"
                        checked={feature.enabled}
                        onChange={(e) => onFeatureToggle(feature.id, e.target.checked)}
                      />
                      {feature.name}
                    </label>
                  </div>
                  <p>{feature.description}</p>
                </div>
                <div className="feature-actions">
                  <Button
                    onClick={() => onFeatureTest(feature.id)}
                    disabled={testingFeature === feature.id}
                    variant="outline"
                    size="sm"
                  >
                    {testingFeature === feature.id ? 'Testing...' : 'Test'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}