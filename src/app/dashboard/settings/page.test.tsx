import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Provide simple mocks for Next app-router usage and authService before importing the page.
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock('@/lib/auth', () => ({ authService: { getCurrentUser: jest.fn().mockResolvedValue({ id: 'u1', name: 'Test User', email: 'test@example.com' }) } }))

import SettingsPage from './page'
import { AuthProvider } from '@/providers/AuthProvider'

// Mock apiRequest to avoid network and CORS issues in jsdom; return expected shapes.
jest.mock('@/lib/apiRequest', () => ({ __esModule: true, default: jest.fn((config: unknown) => {
  const cfg = config as { method?: string; data?: unknown } | undefined
  if (cfg?.method === 'put') {
    return Promise.resolve({ ok: true, status: 200, data: { success: true, data: cfg.data } })
  }
  return Promise.resolve({ ok: true, status: 200, data: { success: true, data: { id: 'u1', name: 'Test User', email: 'test@example.com' } } })
}) }))

test('renders settings and saves profile', async () => {
  render(
    <AuthProvider>
      <SettingsPage />
    </AuthProvider>
  )

  // wait for initial load (spinner goes away)
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())

  // name/email inputs should be prefilled (inputs don't have for/id so use display value)
  expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
  expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()

  // change name and submit (first textbox is name)
  const textboxes = screen.getAllByRole('textbox')
  fireEvent.change(textboxes[0], { target: { value: 'New Name' } })
  fireEvent.click(screen.getByRole('button', { name: /Save profile/i }))

  await waitFor(() => expect(screen.getByText(/Settings saved/i)).toBeInTheDocument())
})
