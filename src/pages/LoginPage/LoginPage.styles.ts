import styled from 'styled-components'

export const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
`

export const Subtitle = styled.p`
  margin: 0 0 1.5rem 0;
  font-size: 0.875rem;
  color: #64748b;

  a {
    color: #00c896;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`

export const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
`

export const Label = styled.label`
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
`

export const HelpLink = styled.a`
  display: inline-block;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: #00c896;
  text-decoration: none;
  text-align: right;

  &:hover {
    text-decoration: underline;
  }
`

export const CheckboxWrapper = styled.div`
  margin-bottom: 1.25rem;
`

export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

