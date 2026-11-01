import React from 'react';
import { StateEmblem } from '../common/StateEmblem';

export const Watermark: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.045] overflow-hidden select-none">
      <StateEmblem size={580} variant="karnataka" useVector={true} className="grayscale contrast-125" />
    </div>
  );
};
