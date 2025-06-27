import {
  cloneRepository,
  DiffFlags,
  diffFlagsContains,
  openRepository,
  Repository,
} from 'es-git'
import { join } from 'path'

export async function getRepository(owner: string, repository: string) {
  const localPath = join(
    __dirname,
    `../../../cache/repositories/${owner}/${repository}`,
  )

  const repo = await openRepository(localPath).catch(() => {
    console.log(`fetching ${owner}/${repository}...`)
    return null
  })

  if (repo?.remoteNames()) return repo

  return await cloneRepository(
    `git@${process.env.GIT_DOMAIN}:${owner}/${repository}`,
    localPath,
    {
      fetch: {
        credential: {
          type: 'SSHKey',
          privateKey: process.env.GITHUB_AUTH_KEY ?? '',
        },
        depth: 0,
      },
      bare: true,
    },
  )
}

export interface AnalyzedDiffs {
  counts: Map<string, number>
  aliases: [string, string][]
}

/**
 * 중복 포함임
 */
export async function getFileDiffList(
  repository: Repository,
  baseRefOid: string,
  headRefOid: string,
): Promise<AnalyzedDiffs> {
  const counts = new Map<string, number>()
  const aliases: [string, string][] = []

  const diff = repository.diffTreeToTree(
    repository.getCommit(baseRefOid).tree(),
    repository.getCommit(headRefOid).tree(),
  )

  for (const delta of diff.deltas()) {
    const fromPath = delta.oldFile().path()
    const toPath = delta.newFile().path()

    if (fromPath && toPath && fromPath !== toPath) {
      aliases.push([fromPath, toPath])
    }
    if (fromPath) {
      increaseCount(counts, fromPath)
    }
    if (toPath) {
      increaseCount(counts, toPath)
    }
  }

  return { counts, aliases }
}

function increaseCount(counts: Map<string, number>, key: string) {
  counts.set(key, (counts.get(key) ?? 0) + 1)
}
