import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("Main.tsx loading...");

const rootElement = document.getElementById("root");
console.log("Root element found:", !!rootElement);

if (rootElement) {
  // Add a temporary visible element for debugging
  rootElement.style.backgroundColor = "red";
  rootElement.innerHTML = "<div style='color: white; padding: 20px; font-size: 24px;'>React is mounting...</div>";
  
  setTimeout(() => {
    console.log("Creating React root...");
    createRoot(rootElement).render(<App />);
  }, 1000);
} else {
  console.error("Root element not found!");
}
