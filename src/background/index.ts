import ILockStatus from '../lib/interfaces/ILockStatus'
import IMessage from '../lib/interfaces/IMessage'
import { ALL_TYPES } from '../lib/utils/constants'
import VaultKeeper from '../lib/vault-keeper'

const app = new VaultKeeper()
const logger = app.logger

// Listen fo app events.
app.on('update_status', (status: ILockStatus) => {
  const message: IMessage = { type: 'UPDATE_STATUS', status }
  chrome.runtime.sendMessage(message).catch(() => {
    app.logger.info('No receiver for pending message')
  })
})

app.on('setup', (pin: string) => {
  encryptAllCookies(pin)
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
  } else if (type == 'DECRYPT_COOKIES') {
    const { cookie } = request
    const decrypted = processCookieHeaderString(cookie || '')
    return { cookie: decrypted }
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

// No encrypt session cookies.
function cookieMustBeEncrypted(cookie: chrome.cookies.Cookie) {
  const { session, hostOnly } = cookie
  return !session && !hostOnly
}

// Replace a cookie value
function replaceCookieValue(oldCookie: chrome.cookies.Cookie, value: string) {
  const { hostOnly, session, ...cookie } = oldCookie
  const { domain, path, secure } = cookie
  const tld = domain.startsWith('.') ? domain.substring(1) : domain
  // const withoutSubdomains = tld.split('.').slice(-2).join('.')
  const url = `http${secure ? 's' : ''}://${tld}${path}`

  return new Promise((resolve, reject) => {
    chrome.cookies.set({ ...cookie, value, url }, (_savedCookie) => {
      if (chrome.runtime.lastError) {
        console.error(url, cookie)
        reject(chrome.runtime.lastError)
      } else {
        app.logger.info(
          `Encrypted new cookie using AES Cipher (domain=${cookie.domain}, name=${cookie.name}`,
        )

        resolve(cookie)
      }
    })
  })
}

// Intercept when browser saves cookies.
chrome.cookies.onChanged.addListener(async (changeInfo) => {
  if (!changeInfo.removed) {
    const { cookie } = changeInfo

    if (app.getStatus() == 'UNLOCKED') {
      const { value } = cookie
      if (cookieMustBeEncrypted(cookie) && !app.isCookieEncrypted(value)) {
        const encrypted = app.encryptCookie(value)
        await replaceCookieValue(cookie, encrypted)
      }
    } else {
      app.logger.warn(
        `Skip cookie encryption due to locked browser (domain=${cookie.domain}, name=${cookie.name}`,
      )
    }
  }
})

// Intercept when website requests a saved cookie.
function processSecret(key: string, secret: string) {
  const unlocked = app.getStatus() == 'UNLOCKED'
  if (unlocked && app.isCookieEncrypted(secret)) {
    app.logger.info(`Decrypting secret using AES Cipher (key=${key})`)
    const decrypted = app.decryptCookie(secret)
    return decrypted
  } else {
    if (!unlocked) app.logger.warn(`Skip cookie decryption due to locked browser (key=${key}})`)
    return secret
  }
}

function processCookieHeaderString(rawCookies: string) {
  const cookies = rawCookies.split(';')
  const decryptedCookies = cookies.map((cookie) => {
    let [name, value] = cookie.split('=')
    name = name.trim()
    value = value.trim()
    return `${name}=${processSecret(name, value)}`
  })
  return decryptedCookies.join(';')
}

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const { requestHeaders } = details
    const newHeaders: chrome.webRequest.HttpHeader[] = []

    for (const header of requestHeaders || []) {
      const { name, value } = header
      if (!value) continue

      if (name.toLowerCase() == 'cookie') {
        header.value = processCookieHeaderString(value)
      } else {
        header.value = processSecret(name, value)
      }

      newHeaders.push(header)
    }

    return { requestHeaders: newHeaders }
  },
  {
    urls: ['<all_urls>'],
    types: ALL_TYPES,
  },
  ['requestHeaders', 'extraHeaders'],
)

// Get all decrypted cookies saved in browser and encrypt them.
async function encryptAllCookies(pin: string) {
  const cookies = await chrome.cookies.getAll({})
  for (const cookie of cookies) {
    const { value } = cookie
    if (cookieMustBeEncrypted(cookie) || app.isCookieEncrypted(value)) continue
    const encrypted = app.encryptCookie(value, pin)
    await replaceCookieValue(cookie, encrypted)
  }
}

// Print a message to the console when the extension is loaded.
logger.info('loading application...')
