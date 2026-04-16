import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY ?? '0'.repeat(64)
  return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string): string {
  const key    = getKey()
  const iv     = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc    = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag    = cipher.getAuthTag()
  return [iv.toString('hex'), tag.toString('hex'), enc.toString('hex')].join(':')
}

export function decrypt(ciphertext: string): string {
  const key              = getKey()
  const [ivH, tagH, encH] = ciphertext.split(':')
  const iv     = Buffer.from(ivH, 'hex')
  const tag    = Buffer.from(tagH, 'hex')
  const enc    = Buffer.from(encH, 'hex')
  const d      = crypto.createDecipheriv(ALGO, key, iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8')
}

export function verifyHmac(body: string, header: string, secret: string): boolean {
  const [algo, hash] = header.split('=')
  if (algo !== 'sha256' || !hash) return false
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
