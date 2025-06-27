import 'dotenv/config'
import { getPullRequestsForRepository } from './getPullRequestsForUser.ts'
import { persist } from './FileStorage.ts'
import { getDiffPerRepository } from './getRequiredRepositories.ts'
import { mergeAnalyzedDiffs } from './analyzeCounts.ts'

if (!process.env.GITHUB_API_URL) {
  throw new Error(
    'GITHUB_API_URL is missing in .env file. Add proper public/enterprise github domain.',
  )
}

if (!process.env.GIT_DOMAIN) {
  throw new Error(
    'GIT_DOMAIN is missing in .env file. Add proper git access point (ex: github.com)',
  )
}

if (!process.env.GITHUB_AUTH_KEY) {
  throw new Error(
    'GITHUB_AUTH_KEY is missing in .env file. Add your private ssh key (ex: -----BEGIN OPENSSH PRIVATE KEY----- ...)',
  )
}

if (!process.env.PAT) {
  throw new Error(
    'PAT is missing in .env file. Add proper github personal access token',
  )
}

const targetUser = process.argv[2]

if (!targetUser) {
  throw new Error('usage: npm run server <user-handle>')
}

console.log('Start to gather data')
const prs = await getPullRequestsForRepository(targetUser)

await persist()
console.log('Saved gathered data successfully.')

const diffPerRepository = await getDiffPerRepository(prs)

for (const [repositoryName, diffs] of diffPerRepository) {
  console.log(`# ${repositoryName}\n`)

  const countPerPath = mergeAnalyzedDiffs(diffs)
  const countList = [...countPerPath.entries()].sort((a, b) => {
    const countDiff = b[1] - a[1]

    if (countDiff) return countDiff

    if (a[0] < b[0]) return 1
    if (a[0] > b[0]) return -1
    return 0
  })

  for (const [path, count] of countList) {
    console.log(`${count}\t\t\t${path}`)
  }

  console.log('\n---\n')
}
