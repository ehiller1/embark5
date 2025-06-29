import React from 'react';

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

export const ChartTooltipContent: React.FC<ChartTooltipContentProps> = ({ 
  active, 
  payload, 
  label 
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-white p-2 border rounded shadow-sm">
      <p className="font-medium text-sm">{label}</p>
      <div className="mt-1">
        {payload.map((entry, index) => (
          <div key={`tooltip-item-${index}`} className="flex items-center gap-2 text-sm">
            <span 
              className="inline-block w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span>{`${entry.name}: ${entry.value}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
