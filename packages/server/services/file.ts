import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { PACKAGE_ROOT } from '../consts.ts'

const outDir = join(PACKAGE_ROOT, './out')

if (!existsSync(outDir)) {
  mkdirSync(outDir)
}

export async function saveOutput(content: string, fileName: string) {
  return writeFile(join(outDir, fileName), content, { encoding: 'utf-8' })
}
