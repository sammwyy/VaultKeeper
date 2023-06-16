import Logger from '../logs/logger'

export default class PersistentState<T> {
  private logger: Logger
  private object: T

  constructor(object: T | null) {
    this.logger = new Logger('PState')
    this.object = object || ({} as T)
  }

  public get(): T {
    return this.object
  }

  public load() {
    this.logger.info('Loading state from storage')
    return new Promise((resolve) => {
      chrome.storage.session.get('state', (data) => {
        console.log(data)
        const { state } = data
        this.logger.info(`Loaded state from storage (has_data=${state != null})`)
        resolve(state)
      })
    })
  }

  public async asyncLoad() {
    this.logger.info('Trying to load state from storage (async)')

    const status = await this.load()
    if (status) {
      this.object = status as T
      return true
    }

    return false
  }

  public save() {
    const data = JSON.stringify(this.object)
    console.log(data)
    chrome.storage.session.set({ state: data })
    this.logger.info('Saved state to storage')
  }
}
