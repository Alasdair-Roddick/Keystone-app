import Home from './pages/Home'
import Loading from './pages/Loading'
import Session from './pages/Session'
import PasswordModal from './components/PasswordModal'
import { useSessionStore } from './state/session'

export default function App() {
  const status = useSessionStore((s) => s.status)

  return (
    <>
      <PasswordModal />
      {status === 'creating' && <Loading />}
      {status === 'active' && <Session />}
      {status === 'idle' && <Home />}
    </>
  )
}
