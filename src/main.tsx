/* =============================================================================
 * Application entry point.
 *
 * Mounts React onto the <div id="root"> in index.html and pulls in the two
 * stylesheets: index.css for the public alumni site, admin.css for the
 * dashboard. They are split that way because the two halves share brand
 * colours but almost no layout.
 *
 * StrictMode is a development-only check — it deliberately runs effects twice
 * to expose ones that are not safe to repeat. It disappears from the
 * production build, so it costs users nothing.
 * ========================================================================== */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './admin.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
