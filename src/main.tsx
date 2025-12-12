import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Apply saved theme before React renders to prevent flash
const savedSettings = localStorage.getItem('keystone-settings')
if (savedSettings) {
  try {
    const parsed = JSON.parse(savedSettings)
    if (parsed?.state?.theme) {
      document.documentElement.setAttribute('data-theme', parsed.state.theme)
    }
  } catch {
    // Ignore parse errors
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <App />
)
