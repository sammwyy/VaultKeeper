export default class {
  private readonly context: string

  constructor(context: string) {
    this.context = context
  }

  info(message: any) {
    console.log(`(VK-${this.context}) [INFO]`, message)
  }
}
