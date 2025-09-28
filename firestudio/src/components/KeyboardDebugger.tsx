'use client';

import React, { useEffect, useState } from 'react';

export const KeyboardDebugger: React.FC = () => {
  const [lastKey, setLastKey] = useState<string>('None');
  const [keyCount, setKeyCount] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('🎹 Global keyboard test:', e.key);
      setLastKey(e.key);
      setKeyCount(prev => prev + 1);
    };

    document.addEventListener('keydown', handleKeyDown);
    console.log('🔧 KeyboardDebugger: Added global listener');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      console.log('🧹 KeyboardDebugger: Removed global listener');
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <div>Last Key: {lastKey}</div>
      <div>Count: {keyCount}</div>
      <div>Test: Press 1-5 or Shift+A</div>
    </div>
  );
};
