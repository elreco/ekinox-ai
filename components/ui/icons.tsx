'use client'

import { cn } from '@/lib/utils'

function IconLogo({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      role="img"
      className={cn('h-4 w-4', className)}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 34"
    >
      <g id="logogram" transform="translate(0, 0) rotate(0)">
        <path
          d="M15.4992 0H36.5808L21.0816 22.9729H0L15.4992 0Z"
          fill="#0066CC"
        ></path>
        <path
          d="M16.4224 25.102L10.4192 34H32.5008L48 11.0271H31.7024L22.2064 25.102H16.4224Z"
          fill="#00407F"
        ></path>
      </g>
      <g id="logotype" transform="translate(48, 17)"></g>
    </svg>
  )
}
function IconCheck({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      className={cn('h-4 w-4', className)}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function IconSpinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      className={cn('h-4 w-4 animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export const Icons = {
  check: IconCheck,
  spinner: IconSpinner,
  logo: IconLogo
}

export { IconLogo }
