import * as S from './DashboardPage.styles'

export function DashboardPage() {
  return (
    <S.Wrapper>
      <S.Title>Seleccione un módulo</S.Title>
      <S.Grid>
        <S.ModuleCard>ENVÍOS</S.ModuleCard>
        <S.ModuleCard>MONITOREO</S.ModuleCard>
        <S.ModuleCard>DATOS</S.ModuleCard>
        <S.ModuleCard>REPORTES</S.ModuleCard>
      </S.Grid>
    </S.Wrapper>
  )
}

