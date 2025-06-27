import type {
  StorageAdapter,
  SerializedEntries,
} from '@urql/exchange-graphcache'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'path'
import type { NodeSystemError } from './SystemError.ts'

const cache: any = {}
const CACHE_PATH = join(__dirname, '../../cache')

try {
  await mkdir(join(CACHE_PATH))
} catch {}

export function makeFileStorage(): StorageAdapter {
  return {
    async writeData(delta: SerializedEntries) {
      Object.assign(cache, delta)
    },
    async readData(): Promise<SerializedEntries> {
      try {
        const response = await readFile(join(CACHE_PATH, './cache.txt'), {
          encoding: 'utf-8',
        })
        const data = JSON.parse(response)
        Object.assign(cache, data)
        return cache
      } catch (e) {
        if ((e as NodeSystemError)?.code === 'ENOENT') {
          await writeFile(join(CACHE_PATH, './cache.txt'), '{}', {
            encoding: 'utf-8',
          })
        }
        return {}
      }
    },
  }
}

export function persist() {
  return writeFile(
    join(CACHE_PATH, './cache.txt'),
    JSON.stringify(cache, null, 2),
    {
      encoding: 'utf-8',
    },
  )
}
