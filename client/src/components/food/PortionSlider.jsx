import { useState } from 'react';

const PortionSlider = ({ portion = 1, onChange }) => {
  const [value, setValue] = useState(portion);

  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Portion Size</span>
        <span className="font-semibold text-primary">{value.toFixed(1)}x</span>
      </div>
      <input
        type="range"
        min="0.5"
        max="3"
        step="0.1"
        value={value}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>0.5x</span>
        <span>1.5x</span>
        <span>3x</span>
      </div>
    </div>
  );
};

export default PortionSlider;