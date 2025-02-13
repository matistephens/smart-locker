'use client';
import React, { useState } from 'react';
import NumericKeypad from '@/components/NumericKeypad';

type Mode = 'idle' | 'delivery' | 'pickup' | 'doorOpened';

const LockerScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>('idle');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Call the real API to process a delivery complete event.
  const handleDeliveryComplete = async () => {
    setError('');
    try {
      const response = await fetch('/api/delivery/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // For now, use a dummy resident email; in production, this could come from a form.
        body: JSON.stringify({ resident_email: 'matias.stur@gmail.com' }),
      });
      const result = await response.json();
      if (result.success) {
        console.log('Delivery complete: Door locked.');
        setMessage('Thank you for your delivery! The door is now locked.');
        setMode('delivery');
        // Transition to pickup mode after 3 seconds.
        setTimeout(() => {
          setMode('pickup');
          setMessage('');
        }, 3000);
      } else {
        setError(result.error || 'Error processing delivery.');
      }
    } catch (err) {
      console.error('Error in handleDeliveryComplete:', err);
      setError('Error processing delivery.');
    }
  };

  // Call the real API to validate the resident's code.
  const handleSubmitCode = async (code: string) => {
    setError('');
    try {
      const response = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (result.valid) {
        console.log('Door opened.');
        setMessage('Door Opened!');
        setMode('doorOpened');
        // Revert back to idle mode after 3 seconds.
        setTimeout(() => {
          setMode('idle');
          setMessage('');
        }, 3000);
      } else {
        setError(result.message || 'Invalid Code, please try again.');
      }
    } catch (err) {
      console.error('Error validating code:', err);
      setError('Error validating code.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      {mode === 'idle' && (
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Smart Locker System</h1>
          <p>Waiting for delivery or pickup...</p>
          {/* Button to trigger the delivery complete API call */}
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