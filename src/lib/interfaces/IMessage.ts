import ILockStatus from './ILockStatus'
import IMessageType from './IMessageType'

type IMessage = {
  cookie?: string
  pin?: string
  status?: ILockStatus
  type: IMessageType
}

export default IMessage
