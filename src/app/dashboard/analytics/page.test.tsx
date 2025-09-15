import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Dev-only mock gating is handled in `test/jest.setup.ts`

// mock useApi to observe calls
jest.mock('@/lib/useApi', () => {
  return jest.fn(() => ({
    request: jest.fn()
  }))
})

import useApi from '@/lib/useApi'
import AnalyticsPage from './page'

describe('AnalyticsPage', () => {
  it('fetches analytics on mount and when timeRange changes only', async () => {
    const mockedUseApi = useApi as jest.MockedFunction<typeof useApi>
    // create a stable mock client with a request mock
  // return success:false so the component uses the built-in mockAnalytics fallback (which defines summary)
  const requestMock = jest.fn().mockResolvedValue({ ok: true, status: 200, data: { success: false } })
  // return a stable client object so its identity doesn't change across renders
  const clientObj = { request: requestMock }
  mockedUseApi.mockImplementation(() => clientObj as unknown as ReturnType<typeof useApi>)

  render(<AnalyticsPage />)
  // wait for initial fetch to complete
    await waitFor(() => expect(requestMock).toHaveBeenCalled())
    const initialCallCount = requestMock.mock.calls.length
  // small wait to allow any stray effects (should not cause new requests)
  await new Promise((r) => setTimeout(r, 50))
  expect(requestMock.mock.calls.length).toBe(initialCallCount)

    // simulate changing timeRange by re-rendering with the select changed
    // We can't directly change internal state from here, but we can re-render and then simulate the select change by querying and firing events.
    // Instead, assert that when timeRange changes the effect will call the API again by directly calling the fetch via the requestMock calls count check.
    // Simulate user changing timeframe via DOM
    const select = screen.getByRole('combobox')
  fireEvent.change(select, { target: { value: '7d' } })

    await waitFor(() => expect(requestMock.mock.calls.length).toBeGreaterThan(initialCallCount))
  })
})
