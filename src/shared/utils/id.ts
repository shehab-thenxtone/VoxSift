import { nanoid } from 'nanoid'

export const genId = (): string => nanoid()
export const genSegmentId = (): string => `seg_${nanoid(10)}`
export const genContentId = (): string => `cnt_${nanoid(12)}`
export const genReqId = (): string => `req_${nanoid(8)}`
