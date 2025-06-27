import 'dotenv/config'
import { getPullRequestsForRepository } from './getPullRequestsForUser.ts'
import { persist } from './FileStorage.ts'
import { getDiffPerRepository } from './getRequiredRepositories.ts'
import { mergeAnalyzedDiffs } from './analyzeCounts.ts'
import { saveOutput } from './services/file.ts'
import type { AnalyzedDiffs } from './services/git.ts'

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

async function main() {
  console.log('Start to gather data')
  const prs = await getPullRequestsForRepository(targetUser)

  await persist()
  console.log('Saved gathered data successfully.')

  const diffPerRepository = await getDiffPerRepository(prs)

  const markdownReport = generateMarkdownReport(diffPerRepository)
  console.log(markdownReport)
  await saveOutput(markdownReport, `${targetUser}-git-analysis.md`)
}

function generateMarkdownReport(
  diffPerRepository: Map<string, AnalyzedDiffs[]>,
): string {
  let markdown = ''

  for (const [repositoryName, diffs] of diffPerRepository) {
    markdown += `# ${repositoryName}\n\n`

    const countPerPath = mergeAnalyzedDiffs(diffs)
    const countList = sortCountEntries(countPerPath)

    for (const [path, count] of countList) {
      markdown += `${count}\t\t\t${path}\n`
    }

    markdown += '\n---\n\n'
  }

  return markdown
}

function sortCountEntries(
  countPerPath: Map<string, number>,
): [string, number][] {
  return [...countPerPath.entries()].sort((a, b) => {
    const countDiff = b[1] - a[1]
    if (countDiff) return countDiff

    if (a[0] < b[0]) return 1
    if (a[0] > b[0]) return -1
    return 0
  })
}

main()
