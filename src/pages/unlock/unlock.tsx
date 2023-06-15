import { useEffect, useState } from 'react'

import NoFetched from './components/no-fetched'
import NoSetup from './components/no-setup'
import Locked from './components/locked'
import Unlocked from './components/unlocked'

import ILockStatus from '../../lib/interfaces/ILockStatus'
import IMessage from '../../lib/interfaces/IMessage'
import Logger from '../../lib/logs/logger'

function App() {
  const logger = new Logger('Render')
  const [status, setStatus] = useState<ILockStatus>('NO_FETCHED')

  const handleLockStatus = (message: IMessage) => {
    if (message.type == 'UPDATE_STATUS' && message.status) {
      logger.info(`Update status ${message.status}`)
      setStatus(message.status)
    }
  }

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message: IMessage) => handleLockStatus(message))

    chrome.runtime.sendMessage({ type: 'GET_LOCK_STATUS' }, (response: IMessage) =>
      handleLockStatus(response),
    )
  }, [])

  return (
    <main>
      <div className="content">
        {status == 'NO_FETCHED' && <NoFetched />}
        {status == 'NO_SETUP' && <NoSetup />}
        {status == 'LOCKED' && <Locked />}
        {status == 'UNLOCKED' && <Unlocked />}
      </div>
    </main>
  )
}

export default App
