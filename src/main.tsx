
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("Main.tsx is running, attempting to render app...");
console.log("DOM ready state:", document.readyState);
console.log("Root element exists:", !!document.getElementById("root"));

// Additional error handling for root rendering
try {
  console.log("Attempting to find root element...");
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error("Could not find root element!");
    throw new Error("Root element not found");
  }
  
  console.log("Root element found, creating React root...");
  const root = createRoot(rootElement);
  
  console.log("Rendering App component...");
  root.render(<App />);
  
  console.log("App rendering complete");
} catch (error) {
  console.error("Error rendering app:", error);
}

// Add event listener for when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded event fired");
  console.log("Root element exists after DOMContentLoaded:", !!document.getElementById("root"));
});

