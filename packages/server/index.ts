import 'dotenv/config'
import { getPullRequestsForRepository } from './getPullRequestsForUser.ts'
import { persist } from './FileStorage.ts'
import { getDiffPerRepository } from './getRequiredRepositories.ts'
import { mergeAnalyzedDiffs } from './analyzeCounts.ts'
import { saveOutput } from './services/file.ts'
import type { AnalyzedDiffs } from './services/git.ts'

main()

async function main() {
  checkEnvs()

  const targetUser = process.argv[2]

  if (!targetUser) {
    throw new Error('usage: npm run server <user-handle>')
  }

  console.log('Start to gather data')
  const prs = await getPullRequestsForRepository(targetUser)

  try {
    await persist()
    console.log('Caches were persisted successfully')
  } catch (e) {
    console.error('Fail to persist gql cache')
    console.error(e)
  }

  const diffPerRepository = await getDiffPerRepository(prs)

  const markdownReport = generateMarkdownReport(diffPerRepository)

  try {
    await saveOutput(markdownReport, `${targetUser}-git-analysis.md`)
    console.log('Markdown report was saved successfully')
  } catch (e) {
    console.error('Fail to save markdown report')
    console.error(e)
  }
}

function checkEnvs() {
  return [
    [
      'GITHUB_API_URL',
      'Add proper public/enterprise github domain (ex: https://https://github.com)',
    ],
    ['GIT_DOMAIN', 'Add proper git access point (ex: github.com)'],
    [
      'GITHUB_AUTH_KEY',
      'Add your private ssh key (ex: -----BEGIN OPENSSH PRIVATE KEY----- ...)',
    ],
    ['PAT', 'Add proper github personal access token'],
  ].forEach(([key, desc]) => checkEnv(key, desc))
}

function checkEnv(name: string, description: string): void {
  if (!process.env[name]) {
    throw new Error(`${name} is missing in .env file. ${description}`)
  }
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
