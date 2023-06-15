import Emitter from './events/emitter'
import ILockStatus from './interfaces/ILockStatus'
import Logger from './logs/logger'

import { lockBrowser, unlockBrowser } from './utils/locker'
import { isLockPinSetup, isPinCorrect, setupLockPin } from './utils/pin'

type LockPin = string | null

export default class VaultKeeper extends Emitter {
  public readonly logger: Logger
  private pin: LockPin
  private status: ILockStatus

  constructor() {
    super()
    this.logger = new Logger('Worker')
    this.pin = null
    this.status = 'NO_SETUP'
  }

  public getStatus(): ILockStatus {
    return this.status
  }

  public lock() {
    this.pin = null
    this.setStatus('LOCKED')
    lockBrowser()
  }

  setStatus(status: ILockStatus) {
    this.status = status
    this.emit('update_status', status)
  }

  async setup(pin: string) {
    const isSetup = await isLockPinSetup()
    if (isSetup) {
      throw new Error('Pin is already setup')
    }

    await setupLockPin(pin)
    this.lock()
  }

  async start() {
    const isSetup = await isLockPinSetup()
    this.status = isSetup ? 'LOCKED' : 'NO_SETUP'
    lockBrowser()
  }

  public async unlock(pin: string) {
    const correct = await isPinCorrect(pin)
    if (!correct) {
      throw new Error('Pin is incorrect')
    }

    this.pin = pin
    this.setStatus('UNLOCKED')
    unlockBrowser()
    return true
  }
}
