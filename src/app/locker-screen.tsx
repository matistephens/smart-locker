'use client';
import React, { useState } from 'react';
import NumericKeypad from '@/components/NumericKeypad';

type Mode = 'idle' | 'delivery' | 'pickup' | 'doorOpened';

const LockerScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>('idle');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleDeliveryComplete = () => {
    console.log('Door locked (simulated)');
    setMessage('Thank you for your delivery! The door is now locked.');
    setMode('delivery');
    setTimeout(() => {
      setMode('pickup');
      setMessage('');
    }, 3000);
  };

  const handleSubmitCode = async (code: string) => {
    setError('');
    if (code === '123456') {
      console.log('Door Opened (simulated)');
      setMessage('Door Opened!');
      setMode('doorOpened');
      setTimeout(() => {
        setMode('idle');
        setMessage('');
      }, 3000);
    } else {
      setError('Invalid Code, please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      {mode === 'idle' && (
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Smart Locker System</h1>
          <p>Waiting for delivery or pickup...</p>
          <button
            onClick={handleDeliveryComplete}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Simulate Delivery Complete
          </button>
        </div>
      )}

      {mode === 'delivery' && (
        <div className="text-center">
          <h2 className="text-2xl mb-4">Thank You, Driver!</h2>
          <p>{message}</p>
        </div>
      )}

      {mode === 'pickup' && (
        <div className="text-center">
          <h2 className="text-2xl mb-4">Resident Pickup</h2>
          <NumericKeypad onSubmit={handleSubmitCode} />
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </div>
      )}

      {mode === 'doorOpened' && (
        <div className="text-center">
          <h2 className="text-2xl mb-4">Door Opened</h2>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default LockerScreen;