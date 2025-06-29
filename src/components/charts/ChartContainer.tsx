import React from 'react';

interface ChartContainerProps {
  children: React.ReactNode;
  config?: {
    height?: number;
    width?: string | number;
  };
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ 
  children,
  config = { height: 300, width: '100%' } 
}) => {
  return (
    <div style={{ 
      width: config.width || '100%', 
      height: config.height || 300 
    }}>
      {children}
    </div>
  );
};
