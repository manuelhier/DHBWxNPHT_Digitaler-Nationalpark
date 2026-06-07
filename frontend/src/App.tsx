import { useCallback, useState } from 'react'
import ChatWidget from './components/ChatWidget'
import FeedbackPanel from './components/FeedbackPanel'

export default function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const handleFeedbackOpenChange = useCallback((open: boolean) => setFeedbackOpen(open), [])

  return (
    <>
      {(chatOpen || feedbackOpen) && <div className="page-overlay" />}

      <section className="hero">
        <div className="hero-upper">
          <nav className="hero-nav">
            <img src="/assets/npht-logo.png" className="hero-nav-logo" alt="Nationalpark Hohe Tauern" />
            <span className="hero-nav-sep">×</span>
            <img src="/assets/dhbw-logo.svg" className="hero-nav-logo logo-dhbw" alt="DHBW" />
          </nav>
        </div>

        <div className="hero-content">
          <p className="hero-eyebrow">Nationalpark Hohe Tauern · Österreich</p>
          <h1 className="hero-title">Raum für <em>Wissen</em> und <em>Erlebnis</em></h1>
          <p className="hero-sub">
            Eine der großartigsten Hochgebirgslandschaften der Erde –
            entdecken Sie Gletscher, Wildtiere und alpine Vielfalt.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">1.856 km²</div>
              <div className="stat-label">unberührte Natur</div>
            </div>
            <div className="stat">
              <div className="stat-value">15.000</div>
              <div className="stat-label">Tierarten</div>
            </div>
            <div className="stat">
              <div className="stat-value">3.798 m</div>
              <div className="stat-label">Großglockner</div>
            </div>
          </div>
          <div className="hero-buttons">
            <button className="btn-chat" onClick={() => setChatOpen(true)}>
              💬 Mit FragForrest chatten
            </button>
          </div>
        </div>

        <div className="hero-lower" />
      </section>

      <FeedbackPanel chatOpen={chatOpen} onOpenChange={handleFeedbackOpenChange} />
      <ChatWidget open={chatOpen} onOpen={() => setChatOpen(true)} onClose={() => setChatOpen(false)} />
    </>
  )
}
