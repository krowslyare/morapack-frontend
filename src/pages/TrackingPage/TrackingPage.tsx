import * as S from './TrackingPage.styles'

export function TrackingPage() {
  return (
    <S.Wrapper>
      <S.ActionBar>
        <S.Search>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input placeholder="Buscar" />
        </S.Search>

        <S.Actions>
          <S.Button variant="secondary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Columnas
          </S.Button>
          <S.Button variant="secondary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Subir datos
          </S.Button>
          <S.Button variant="primary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Registrar Paquete
          </S.Button>
        </S.Actions>
      </S.ActionBar>

      <S.ContentPanel>
        <S.PlaceholderText>Contenido de la página</S.PlaceholderText>
      </S.ContentPanel>
    </S.Wrapper>
  )
}

