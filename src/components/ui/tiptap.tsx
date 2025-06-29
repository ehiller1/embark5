import React from 'react';

interface TiptapProps {
  content?: string;
  onChange?: (content: string) => void;
  className?: string;
  placeholder?: string;
}

// Simple rich text editor component
const Tiptap: React.FC<TiptapProps> = ({ 
  content = '', 
  onChange,
  className = '',
  placeholder = 'Start writing...'
}) => {
  // For a real implementation, you would use the tiptap editor library
  // This is a simplified version for type checking purposes
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  
  return (
    <div className={`border rounded-md ${className}`}>
      <div className="bg-muted p-2 border-b flex gap-2">
        <button className="p-1 hover:bg-background rounded">B</button>
        <button className="p-1 hover:bg-background rounded">I</button>
        <button className="p-1 hover:bg-background rounded">U</button>
        <button className="p-1 hover:bg-background rounded">•</button>
      </div>
      <textarea
        className="w-full p-3 min-h-[200px] focus:outline-none resize-none"
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  );
};

export default Tiptap;
