import { describe, it, expect } from 'vitest'
import { addDryRunToQuery } from './RateLimit'

describe('addDryRunToQuery', () => {
  it('adds dryRun parameter to query with no parameters', () => {
    const query = 'query { someField }'
    const result = addDryRunToQuery(query)
    expect(result).toBe('query (dryRun: Boolean = false) { someField }')
  })

  it('adds dryRun parameter to query with existing parameters', () => {
    const query = 'query ($param1: String) { someField }'
    const result = addDryRunToQuery(query)
    expect(result).toBe(
      'query ($param1: String, dryRun: Boolean = false) { someField }',
    )
  })
})
