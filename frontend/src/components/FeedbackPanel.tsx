import { useEffect, useRef, useState } from 'react'

interface Props {
  chatOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function FeedbackPanel({ chatOpen, onOpenChange }: Props) {
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (chatOpen) {
      timerRef.current = setTimeout(() => setOpen(true), 5000)
    } else {
      setOpen(false)
    }
    return () => clearTimeout(timerRef.current)
  }, [chatOpen])

  useEffect(() => { onOpenChange(open) }, [open, onOpenChange])

  const handleClose = () => setOpen(false)

  if (!open) {
    return (
      <button className="feedback-trigger" onClick={() => setOpen(true)} aria-label="Feedback geben" title="Feedback geben">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                fill="#eaf4ec" stroke="#2f6b3f" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M12 7l1.09 2.26L15.5 9.5l-1.75 1.7.41 2.4L12 12.5l-2.16 1.1.41-2.4L8.5 9.5l2.41-.24z"
                fill="#f5a623" stroke="#e8920a" strokeWidth="0.5" strokeLinejoin="round"/>
        </svg>
      </button>
    )
  }

  return (
    <div className="feedback-panel">
      <div className="feedback-header">
        <span className="feedback-header-title">
          Ihre Meinung zählt!
          <span className="feedback-header-title-en">Your opinion matters!</span>
        </span>
        <button className="feedback-close" onClick={handleClose} aria-label="Schließen">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div className="feedback-body">
        <p className="feedback-desc">
          Wie hilfreich war <strong>FragForrest</strong>? Scannen Sie den QR-Code und nehmen Sie
          an unserer kurzen Umfrage teil – dauert nur eine Minute.
          <span className="feedback-desc-en">
            How helpful was <strong>FragForrest</strong>? Scan the QR code and take our short survey – only takes a minute.
          </span>
        </p>
        <img src="/assets/feedback-qr.jpeg" alt="Feedback-Umfrage QR-Code" className="feedback-qr" />
      </div>
    </div>
  )
}
