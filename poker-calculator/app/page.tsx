'use client';

import { useState } from 'react';

interface UnknownDevice {
  deviceId: string;
  nickname: string;
}

interface ExistingPlayer {
  id: number;
  name: string;
}

export default function HomePage() {
  const [inputValue, setInputValue] = useState('');
  const [payout, setPayout] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unknownDevices, setUnknownDevices] = useState<UnknownDevice[]>([]);
  const [existingPlayers, setExistingPlayers] = useState<ExistingPlayer[]>([]);
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

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsLoading(true);
    setPayout('');
    setUnknownDevices([]);
    setDeviceLinks({});
    
    try {
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
        // Sort existing players alphabetically by name
        const sortedPlayers = data.existingPlayers.sort((a: ExistingPlayer, b: ExistingPlayer) => 
          a.name.localeCompare(b.name)
        );
        setExistingPlayers(sortedPlayers);
      } else {
        // Success, show payout
        setPayout(data.payout);
      }
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

      // Clear linking UI and show success message
      setUnknownDevices([]);
      setDeviceLinks({});
      alert('Devices linked successfully! Please submit the ledger again.');
    } catch (error) {
      console.error('Linking failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to link devices');
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
    <div>
      <h1>Submit ledger</h1>
      
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter pokernow.club URL"
      />
      
      <button onClick={handlePaste}>
        Paste
      </button>
      
      <button onClick={handleSubmit} disabled={!isValid || isLoading}>
        {isLoading ? 'Processing...' : 'Submit'}
      </button>
      
      {showError && (
        <div>Error: URL must start with &quot;https://www.pokernow.com/games/&quot;</div>
      )}

      {showLinkingUI && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid orange', borderRadius: '5px', backgroundColor: '#fff3cd' }}>
          <h2>Link Unknown Device IDs</h2>
          <p>The following device IDs need to be linked to players:</p>
          
          {unknownDevices.map(device => (
            <div key={device.deviceId} style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold', minWidth: '150px' }}>{device.nickname}</span>
              <select
                value={deviceLinks[device.deviceId] || ''}
                onChange={(e) => handleDeviceLinkChange(device.deviceId, e.target.value)}
                style={{ padding: '5px', minWidth: '200px' }}
              >
                <option value="">Select a player...</option>
                {existingPlayers.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          
          <button 
            onClick={handleLinkDevices} 
            disabled={!allDevicesLinked || isLoading}
            style={{ marginTop: '10px' }}
          >
            {isLoading ? 'Linking...' : 'Submit Links'}
          </button>
        </div>
      )}

      {payout && (
        <div>
          <h2>Payout</h2>
          <pre>{payout}</pre>
          <button onClick={handleCopy}>Copy</button>
        </div>
      )}
    </div>
  );
}