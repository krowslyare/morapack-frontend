import { type FormEvent, useState } from 'react'

export function useLoginForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Implement login logic here
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email')
      const password = formData.get('password')
      const remember = formData.get('remember')

      console.log({ email, password, remember })
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    handleSubmit,
  }
}

