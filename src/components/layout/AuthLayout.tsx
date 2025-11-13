import { PropsWithChildren } from 'react'

type AuthLayoutProps = PropsWithChildren<{}>

export function AuthLayout({ children }: AuthLayoutProps) {
  return <>{children}</>
}
