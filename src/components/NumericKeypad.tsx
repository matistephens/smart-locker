'use client'
// components/NumericKeypad.tsx
import React, { useState } from 'react';
import { Button } from '@/components/button'; // Updated import path

interface NumericKeypadProps {
  onSubmit: (code: string) => void;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({ onSubmit }) => {
  const [code, setCode] = useState<string>('');

  // Append digit if code length is less than 6
  const handleButtonClick = (digit: string) => {
    if (code.length < 6) {
      setCode((prev) => prev + digit);
    }
  };

  // Remove the last digit
  const handleBackspace = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  // Clear the entire code
  const handleClear = () => {
    setCode('');
  };

  // Submit only if 6 digits have been entered
  const handleSubmit = () => {
    if (code.length === 6) {
      onSubmit(code);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Display the code with placeholders for remaining digits */}
      <div className="mb-4 text-2xl font-mono">
        {code.padEnd(6, '_')}
      </div>

      {/* Render the numeric buttons in a grid */}
      <div className="grid grid-cols-3 gap-2">
        {['1','2','3','4','5','6','7','8','9','0'].map((num) => (
          <Button key={num} onClick={() => handleButtonClick(num)}>
            {num}
          </Button>
        ))}
      </div>

      {/* Control buttons: Backspace, Clear, Submit */}
      <div className="flex mt-2 gap-2">
        <Button variant="destructive" onClick={handleBackspace}>
          Backspace
        </Button>
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
        <Button onClick={handleSubmit}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default NumericKeypad;