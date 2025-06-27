import type { Repository } from 'es-git'
import type { PullRequest } from './types/pullRequest.ts'
import {
  AnalyzedDiffs,
  getFileDiffList,
  getRepository,
} from './services/git.ts'

export async function getDiffPerRepository(prs: PullRequest[]) {
  console.log('Cloning participated repository...')
  const repoMap = await getRequiredRepositories(prs)
  console.log('Cloning has been done successfully')

  const repoKeys = prs.map(
    (pr) => `${pr.repository.owner}/${pr.repository.name}`,
  )

  const diffs = await Promise.all(
    prs.map((pr, index) => {
      const repoKey = repoKeys[index]
      const repo = repoMap.get(repoKey)

      if (!repo) {
        console.error(`Cannot find repository: ${repoKey}`)
        return Promise.resolve(null)
      }
      return getFileDiffList(repo, pr.baseRefOid, pr.headRefOid).catch(
        () => null,
      )
    }),
  )

  const diffMap = new Map<string, AnalyzedDiffs[]>()

  for (let i = 0; i < repoKeys.length; ++i) {
    const diff = diffs[i]

    if (!diff) continue

    const repoKey = repoKeys[i]

    const bin = diffMap.get(repoKey) ?? []
    bin.push(diff)
    diffMap.set(repoKey, bin)
  }

  return diffMap
}

async function getRequiredRepositories(
  prs: PullRequest[],
): Promise<Map<string, Repository>> {
  const uniqueRepoIds = [
    ...new Set(
      prs.map(({ repository: { owner, name } }) => `${owner}/${name}`),
    ).values(),
  ]

  const repoList = await Promise.all(
    uniqueRepoIds.map((repoId) => {
      const [owner, name] = repoId.split('/')
      return getRepository(owner, name)
    }),
  )

  console.log(repoList)

  return new Map(
    uniqueRepoIds.map((repoId, index) => [repoId, repoList[index]]),
  )
}
