import { ChangeEvent, FormEvent, useState } from 'react'

import IMessage from '../../../lib/interfaces/IMessage'

export default function NoSetup() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const isError = error && error != ''

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()

    const payload: IMessage = { type: 'SETUP', pin }
    chrome.runtime.sendMessage(payload, ({ success, error }) => {
      if (!success) {
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
      <h1>Welcome to VaultKeeper</h1>
      <p>Before you begin, you must define a password that will be used to encrypt your data.</p>

      <div className="warning">
        <b>Beware:</b> If you forget this pin, you will need to log in again on each website.
      </div>

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
          Set pin
        </button>
      </form>

      <a href="https://twitter.com/sammwy" target="_blank">
        Created by Sammwy
      </a>
    </>
  )
}
