import Home from './pages/Home'
import Loading from './pages/Loading'
import Session from './pages/Session'
import { useSessionStore } from './state/session'

export default function App() {
  const status = useSessionStore((s) => s.status)

  if (status === 'creating') return <Loading />
  if (status === 'active') return <Session />

  return <Home />
}
