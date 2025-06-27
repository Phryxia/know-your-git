export interface PullRequest {
  title: string
  body: string
  number: number
  repository: {
    owner: string
    name: string
  }
  baseRefOid: string
  headRefOid: string
}
