import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "next-themes"
import App from './App.tsx'
import './index.css'

console.log('Main.tsx is loading...');
const rootElement = document.getElementById("root");
console.log('Root element:', rootElement);

if (rootElement) {
  console.log('Creating React root...');
  createRoot(rootElement).render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  );
} else {
  console.error('Root element not found!');
}
