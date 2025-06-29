import React from 'react';

interface ChartLegendContentProps {
  payload?: Array<{
    value: string;
    color: string;
    type?: string;
  }>;
}

export const ChartLegendContent: React.FC<ChartLegendContentProps> = ({ payload }) => {
  if (!payload || !payload.length) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-4 justify-center mt-2 text-sm">
      {payload.map((entry, index) => (
        <li key={`legend-item-${index}`} className="flex items-center gap-1">
          <span 
            className="inline-block w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }} 
          />
          <span>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};
