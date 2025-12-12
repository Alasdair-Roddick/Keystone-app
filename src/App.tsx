import Home from './pages/Home'
import Loading from './pages/Loading'
import Session from './pages/Session'
import PasswordModal from './components/PasswordModal'
import { useSessionStore } from './state/session'

export default function App() {
  const status = useSessionStore((s) => s.status)
  const showLoading = status === 'creating' || status === 'error'

  return (
    <>
      <PasswordModal />
      {showLoading && <Loading />}
      {status === 'active' && <Session />}
      {status === 'idle' && <Home />}
    </>
  )
}
