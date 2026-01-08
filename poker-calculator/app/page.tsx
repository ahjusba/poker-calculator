'use client';

import { useState } from 'react';

export default function HomePage() {
  const [inputValue, setInputValue] = useState('');
  const [payout, setPayout] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const isValid = inputValue.trim().startsWith('pokernow.club');
  const showError = inputValue.trim() !== '' && !isValid;

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

      setPayout(data.payout);
    } catch (error) {
      console.error('Submit failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to process ledger');
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
        <div>Error: URL must start with &quot;pokernow.club&quot;</div>
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