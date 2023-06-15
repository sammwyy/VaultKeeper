import ILockStatus from './ILockStatus'
import IMessageType from './IMessageType'

type IMessage = {
  pin?: string
  status?: ILockStatus
  type: IMessageType
}

export default IMessage
