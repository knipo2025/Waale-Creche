import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import ErreurConfiguration from './components/ErreurConfiguration'
import './index.css'
import { supabaseConfigError } from './lib/supabase'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {supabaseConfigError ? (
      <ErreurConfiguration message={supabaseConfigError} />
    ) : (
      <App />
    )}
  </StrictMode>,
)
