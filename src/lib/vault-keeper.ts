import Emitter from './events/emitter'
import ILockStatus from './interfaces/ILockStatus'
import Logger from './logs/logger'
import { decryptString, encryptString } from './utils/encryption'

import { lockBrowser, unlockBrowser } from './utils/locker'
import PersistentState from './utils/persistent-state'
import { isLockPinSetup, isPinCorrect, setupLockPin } from './utils/pin'

type LockPin = string | null

const COOKIE_PREFIX = 'vk_ciph_v1'

type VaultKeeperState = {
  pin: LockPin
  status: ILockStatus
}

export default class VaultKeeper extends Emitter {
  public readonly logger: Logger
  private readonly state: PersistentState<VaultKeeperState>

  constructor() {
    super()
    this.logger = new Logger('Worker')
    this.state = new PersistentState<VaultKeeperState>({
      pin: null,
      status: 'NO_FETCHED',
    })
  }

  private _getPin() {
    return this.state.get().pin
  }

  private _save() {
    this.state.save()
  }

  public isCookieEncrypted(cookieValue: string): boolean {
    return cookieValue.startsWith(COOKIE_PREFIX)
  }

  public decryptCookie(cookieValue: string, pin?: string | null): string {
    if (!pin) pin = this._getPin()

    if (!pin) {
      throw new Error("Pin isn't set")
    } else if (!cookieValue) {
      throw new Error('No cookie provided')
    }

    if (!this.isCookieEncrypted(cookieValue)) {
      return cookieValue
    }

    const encrypted = cookieValue.replace(COOKIE_PREFIX, '')
    const decrypted = decryptString(encrypted, pin)
    return decrypted
  }

  public encryptCookie(cookieValue: string, pin?: string | null): string {
    if (!pin) pin = this._getPin()

    if (!pin) {
      throw new Error("Pin isn't set")
    } else if (!cookieValue) {
      throw new Error('No cookie provided')
    }

    const encrypted = COOKIE_PREFIX + encryptString(cookieValue, pin)
    return encrypted
  }

  public getStatus(): ILockStatus {
    return this.state.get().status
  }

  public lock() {
    this.state.get().pin = null
    this.setStatus('LOCKED')
    this._save()
    lockBrowser()
  }

  setStatus(status: ILockStatus) {
    this.state.get().status = status
    this.emit('update_status', status)
  }

  async setup(pin: string) {
    const isSetup = await isLockPinSetup()
    if (isSetup) {
      throw new Error('Pin is already setup')
    }

    await setupLockPin(pin)
    this.lock()
    this.emit('setup', pin)
  }

  async start() {
    const resumed = await this.state.asyncLoad()
    if (resumed) {
      this.logger.info('Resumed previous session')

      if (this.getStatus() !== 'UNLOCKED') {
        lockBrowser()
      }
    } else {
      const isSetup = await isLockPinSetup()
      const newStatus = isSetup ? 'LOCKED' : 'NO_SETUP'
      this.setStatus(newStatus)
      lockBrowser()
    }
  }

  public async unlock(pin: string) {
    const correct = await isPinCorrect(pin)
    if (!correct) {
      throw new Error('Pin is incorrect')
    }

    this.state.get().pin = pin
    this.setStatus('UNLOCKED')
    this._save()
    unlockBrowser()
    return true
  }
}
