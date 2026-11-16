import { useEffect, useState } from 'react'
import { authClient } from './auth-client'
import './App.css'

function App(): React.JSX.Element {
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState('')
  const [authorizationCode, setAuthorizationCode] = useState(() => sessionStorage.getItem('keeply-electron-auth-code') || '')
  const [copied, setCopied] = useState(false)
  const query = Object.fromEntries(new URLSearchParams(window.location.search).entries())

  useEffect(() => {
    const code = authClient.electron.getAuthorizationCode()
    if (code) {
      sessionStorage.setItem('keeply-electron-auth-code', code)
      setAuthorizationCode(code)
    }
    const timer = authClient.ensureElectronRedirect()
    return () => clearTimeout(timer)
  }, [])

  const signIn = async (): Promise<void> => {
    setIsSigningIn(true)
    setError('')
    setAuthorizationCode('')
    sessionStorage.removeItem('keeply-electron-auth-code')
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.href,
        fetchOptions: { query }
      })
      if (result.error) {
        setError(result.error.message || 'Unable to start sign-in. Please try again.')
        setIsSigningIn(false)
      }
    } catch {
      setError('Unable to reach Keeply. Check your connection and try again.')
      setIsSigningIn(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark" aria-hidden="true">K</div>
        <p className="eyebrow">KEEP YOUR LINKS CLOSE</p>
        <h1>Welcome to Keeply</h1>
        <p className="auth-copy">Sign in with Google to continue to your personal link library.</p>
        <button className="google-button" onClick={signIn} disabled={isSigningIn}>
          {isSigningIn ? 'Connecting to Google…' : 'Continue with Google'}
        </button>
        {error && <p role="alert" className="auth-error">{error}</p>}
        {authorizationCode && (
          <div className="manual-code" role="status">
            <p>If Keeply didn’t reopen, copy this sign-in code and paste it into the desktop app.</p>
            <code>{authorizationCode}</code>
            <button onClick={() => {
              void navigator.clipboard.writeText(authorizationCode).then(() => setCopied(true))
            }}>
              {copied ? 'Copied' : 'Copy code'}
            </button>
          </div>
        )}
        <p className="auth-footnote">Your sign-in is handled securely by Google.</p>
      </section>
    </main>
  )
}

export default App
