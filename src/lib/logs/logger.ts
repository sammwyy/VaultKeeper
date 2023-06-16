export default class Logger {
  private readonly context: string

  constructor(context: string) {
    this.context = context
  }

  public info(message: any) {
    console.log(`(VK-${this.context}) [INFO]`, message)
  }

  public warn(message: any) {
    console.warn(`(VK-${this.context}) [WARN]`, message)
  }
}
