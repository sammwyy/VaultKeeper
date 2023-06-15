import { ChangeEvent, FormEvent, useState } from 'react'
import { PacmanLoader } from 'react-spinners'
import IMessage from '../../../lib/interfaces/IMessage'

export default function Locked() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const isError = error && error != ''

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()

    const payload: IMessage = { type: 'UNLOCK', pin }
    chrome.runtime.sendMessage(payload, ({ success, error }) => {
      if (success) {
        window.close()
      } else {
        setError(error)
      }
    })
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value)
    if (error) {
      setError(null)
    }
  }

  return (
    <>
      <h1>Browser Locked</h1>
      <p>This browser is blocked due to security measures. Enter the pin you have configured.</p>

      <button onClick={() => window.history.back()}>Close</button>

      {isError && (
        <div className="error">
          <b>Error: </b>
          {error}
        </div>
      )}

      <form action="post" className="form" onSubmit={onSubmit}>
        <input
          type="password"
          placeholder="Pin"
          required
          className="input"
          value={pin}
          onChange={onChange}
        />
        <button type="submit" className="btn">
          Unlock
        </button>
      </form>

      <a href="https://twitter.com/sammwy" target="_blank">
        Created by Sammwy
      </a>
    </>
  )
}
