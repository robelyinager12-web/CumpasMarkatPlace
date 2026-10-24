import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'

export const hashPassword = (plain: string) => bcrypt.hash(plain, env.BCRYPT_COST)
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash)

// Compared against when an email does not exist, so login timing does not reveal which emails are registered.
export const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-password', env.BCRYPT_COST)