'use client';

import { useState } from 'react';
import { PageContainer } from '@/components/layout/page-container';

interface UnknownDevice {
  deviceId: string;
  nickname: string;
}

interface ExistingPlayer {
  id: number;
  name: string;
}

interface LedgerSubmitFormProps {
  existingPlayers: ExistingPlayer[];
}

export function LedgerSubmitForm({ existingPlayers }: LedgerSubmitFormProps) {
  const [inputValue, setInputValue] = useState('');
  const [payout, setPayout] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unknownDevices, setUnknownDevices] = useState<UnknownDevice[]>([]);
  const [deviceLinks, setDeviceLinks] = useState<Record<string, number>>({});
  
  const isValid = inputValue.trim().startsWith('https://www.pokernow.com/games/');
  const showError = inputValue.trim() !== '' && !isValid;
  const showLinkingUI = unknownDevices.length > 0;
  const allDevicesLinked = unknownDevices.every(device => deviceLinks[device.deviceId]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputValue(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const submitLedger = async () => {
    const response = await fetch('/api/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: inputValue })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process ledger');
    }

    if (data.requiresLinking) {
      // Unknown device IDs found, show linking UI
      setUnknownDevices(data.unknownDeviceIds);
      // Note: We no longer need to fetch or sort players - they're pre-loaded from the server!
    } else {
      // Success, show payout
      setPayout(data.payout);
    }
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsLoading(true);
    setPayout('');
    setUnknownDevices([]);
    setDeviceLinks({});
    
    try {
      await submitLedger();
    } catch (error) {
      console.error('Submit failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to process ledger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceLinkChange = (deviceId: string, playerId: string) => {
    setDeviceLinks(prev => ({
      ...prev,
      [deviceId]: parseInt(playerId)
    }));
  };

  const handleLinkDevices = async () => {
    setIsLoading(true);
    
    try {
      const links = unknownDevices.map(device => ({
        deviceId: device.deviceId,
        playerId: deviceLinks[device.deviceId]
      }));

      const response = await fetch('/api/link-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link devices');
      }

      // Clear linking UI
      setUnknownDevices([]);
      setDeviceLinks({});

      // Automatically resubmit the ledger
      await submitLedger();
    } catch (error) {
      console.error('Linking or submission failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to link devices or process ledger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payout);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <PageContainer title="Submit Ledger" maxWidth="lg">
      <div className="space-y-6">
        {/* URL Input Card */}
        <div className="card space-y-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter PokerNow game URL"
            className="input-field"
          />
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handlePaste}
              className="btn-secondary flex-1"
            >
              📋 Paste
            </button>
            
            <button 
              onClick={handleSubmit} 
              disabled={!isValid || isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? '⏳ Processing...' : '✓ Submit'}
            </button>
          </div>
          
          {showError && (
            <div className="p-3 md:p-4 rounded-lg bg-poker-coral/20 border-l-4 border-poker-coral text-white text-sm md:text-base">
              ⚠️ Error: URL must start with &quot;https://www.pokernow.com/games/&quot;
            </div>
          )}
        </div>

        {/* Device Linking Card */}
        {showLinkingUI && (
          <div className="card bg-poker-coral/10 border-poker-coral/30">
            <h2 className="text-xl md:text-2xl font-bold text-poker-coral mb-4">
              🔗 Link Unknown Device IDs
            </h2>
            <p className="text-poker-sage mb-6 text-sm md:text-base">
              The following device IDs need to be linked to players:
            </p>
            
            <div className="space-y-4">
              {unknownDevices.map(device => (
                <div key={device.deviceId} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <span className="font-bold text-poker-light-green min-w-[150px] text-sm md:text-base">
                    {device.nickname}
                  </span>
                  <select
                    value={deviceLinks[device.deviceId] || ''}
                    onChange={(e) => handleDeviceLinkChange(device.deviceId, e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/10 border-2 border-poker-sage/30 rounded-lg text-white focus:border-poker-light-green focus:ring-2 focus:ring-poker-light-green/20 transition-all outline-none text-sm md:text-base"
                  >
                    <option value="">Select a player...</option>
                    {existingPlayers.map(player => (
                      <option key={player.id} value={player.id} className="bg-poker-dark-green">
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleLinkDevices} 
              disabled={!allDevicesLinked || isLoading}
              className="btn-secondary w-full mt-6"
            >
              {isLoading ? '⏳ Linking...' : '✓ Submit Links'}
            </button>
          </div>
        )}

        {/* Payout Card */}
        {payout && (
          <div className="card bg-poker-light-green/10 border-poker-light-green/30">
            <h2 className="text-xl md:text-2xl font-bold text-poker-light-green mb-4">
              💰 Payout
            </h2>
            <pre className="bg-white/5 p-4 rounded-lg overflow-x-auto text-sm md:text-base font-mono text-white whitespace-pre-wrap">
              {payout}
            </pre>
            <button 
              onClick={handleCopy}
              className="btn-primary w-full mt-4"
            >
              📋 Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
