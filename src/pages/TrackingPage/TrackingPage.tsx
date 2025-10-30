import * as S from './TrackingPage.styles'

export function TrackingPage() {
  return (
    <S.Wrapper>
      <S.ActionBar>
        <S.Search>
          <span className="material-symbols-outlined">search</span>
          <input placeholder="Buscar" />
        </S.Search>

        <S.Actions>
          <S.Button variant="secondary">
            <span className="material-symbols-outlined">view_column</span>
            Columnas
          </S.Button>
          <S.Button variant="secondary">
            <span className="material-symbols-outlined">upload</span>
            Subir datos
          </S.Button>
          <S.Button variant="primary">
            <span className="material-symbols-outlined">add_circle</span>
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
