declare module 'react-countup' {
  import * as React from 'react'

  export interface CountUpProps {
    end: number
    start?: number
    duration?: number
    separator?: string
    formattingFn?: (value: number) => string
  }

  const CountUp: React.FC<CountUpProps>
  export default CountUp
}
