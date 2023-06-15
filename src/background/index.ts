import ILockStatus from '../lib/interfaces/ILockStatus'
import IMessage from '../lib/interfaces/IMessage'
import VaultKeeper from '../lib/vault-keeper'

const app = new VaultKeeper()
const logger = app.logger

// Listen fo app events.
app.on('update_status', (status: ILockStatus) => {
  const message: IMessage = { type: 'UPDATE_STATUS', status }
  chrome.runtime.sendMessage(message)
})

// Lock when the extension is loaded.
app.start()

// Handle unlock
async function tryUnlock(pin?: string) {
  if (!pin || pin == '') {
    throw new Error('No pin provided')
  }

  return await app.unlock(pin)
}

async function trySetup(pin?: string) {
  if (!pin || pin == '') {
    throw new Error('No pin provided')
  }

  return await app.setup(pin)
}

// Handle messages from the extension.
async function handleMessage(request: IMessage, sender: chrome.runtime.MessageSender) {
  const { type } = request
  const self = chrome.runtime.id == sender.id

  if (!self) {
    throw new Error('Sender ID mismatch (not self)')
  }

  app.logger.info('Receive channel message: ' + type)

  if (type == 'UNLOCK') {
    const { pin } = request
    await tryUnlock(pin)
  } else if (type == 'SETUP') {
    const { pin } = request
    await trySetup(pin)
  } else if (type == 'GET_LOCK_STATUS') {
    return { status: app.getStatus(), type: 'UPDATE_STATUS' }
  } else {
    throw new Error(`Unknown message type: ${type}`)
  }
}

chrome.runtime.onMessage.addListener((request: IMessage, sender, sendResponse) => {
  const sendError = (e: Error) => {
    sendResponse({ success: false, error: e.message })
  }

  const sendSuccess = (body?: null | any) => {
    const response = { success: true, ...(body || {}) }
    sendResponse(response)
  }

  handleMessage(request, sender).then(sendSuccess).catch(sendError)
  return true
})

// Print a message to the console when the extension is loaded.
logger.info('application is loaded.')
