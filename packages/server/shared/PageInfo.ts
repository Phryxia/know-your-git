export const PageInfoFragment = `
fragment PageInfoFragment on PageInfo {
  endCursor
  hasNextPage
}
`

export interface PageInfo {
  endCursor: string | null
  hasNextPage: boolean
}
