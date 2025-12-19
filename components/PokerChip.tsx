
import React from 'react';

interface PokerChipProps {
  value: number;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const PokerChip: React.FC<PokerChipProps> = ({ value, color, size = 'md', onClick }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-12 h-12 text-xs',
    lg: 'w-16 h-16 text-sm'
  };

  return (
    <button
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-full border-4 border-dashed flex items-center justify-center font-bold text-white chip-shadow transition-transform hover:scale-110 active:scale-95`}
      style={{
        backgroundColor: color,
        borderColor: 'rgba(255,255,255,0.4)',
        boxShadow: `inset 0 0 10px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)`
      }}
    >
      <div className="bg-black/20 w-full h-full rounded-full flex items-center justify-center">
        {value}
      </div>
    </button>
  );
};

export default PokerChip;
