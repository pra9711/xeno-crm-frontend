import React from 'react'
import Spinner from './Spinner'

export default function HomeLoading() {
  return (
  <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto">
          <Spinner size={32} className="text-blue-600" ariaLabel="Loading" />
        </div>
        <p className="sr-only">Loading</p>
      </div>
    </div>
  )
}

// HomeLoading: central place for a full-page loading state used across dashboard
// pages. Using a single component keeps behavior consistent and easy to test.
