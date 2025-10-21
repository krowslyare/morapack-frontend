import * as S from './LandingPage.styles'

function IconBox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="7" width="16" height="12" rx="2" />
      <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function IconMonitor() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M7 16l-1 4h12l-1-4" />
      <path d="M5 11l3-3 3 3 3-3 3 3" />
    </svg>
  )
}

function IconDatabase() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.657 3.134 3 7 3s7-1.343 7-3V6" />
      <path d="M5 12v6c0 1.657 3.134 3 7 3s7-1.343 7-3v-6" />
    </svg>
  )
}

function IconReport() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M15 3v4h4" />
      <path d="M9 13h6M9 17h6M9 9h2" />
    </svg>
  )
}

export function LandingPage() {
  return (
    <S.Page>
      <S.TopBar>
        <S.Brand>MoraPack</S.Brand>
        <S.Menus>
          <S.MenuItem>Envíos ▾</S.MenuItem>
          <S.MenuItem>Rastreo ▾</S.MenuItem>
          <S.MenuItem>Monitoreo ▾</S.MenuItem>
          <S.MenuItem>Aeropuertos ▾</S.MenuItem>
        </S.Menus>
        <S.TopRight>
          <S.Search>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input placeholder="Buscar" />
          </S.Search>
          <S.Avatar>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </S.Avatar>
        </S.TopRight>
      </S.TopBar>

      <S.Container>
        <S.Title>Seleccione un módulo</S.Title>

        <S.Modules>
          <S.ModuleTile>
            <IconBox />
            ENVIOS
          </S.ModuleTile>
          <S.ModuleTile>
            <IconMonitor />
            MONITOREO
          </S.ModuleTile>
          <S.ModuleTile>
            <IconDatabase />
            DATOS
          </S.ModuleTile>
          <S.ModuleTile>
            <IconReport />
            REPORTES
          </S.ModuleTile>
        </S.Modules>

        <S.Stats>
          <S.StatCard>
            <S.StatValue>80%</S.StatValue>
            <S.StatLabel>Entregas A Tiempo</S.StatLabel>
          </S.StatCard>
          <S.StatCard>
            <S.StatValue>50</S.StatValue>
            <S.StatLabel>Capacidad Usada De Almacenes</S.StatLabel>
          </S.StatCard>
          <S.StatCard>
            <S.StatValue>60</S.StatValue>
            <S.StatLabel>Vuelos Enviados</S.StatLabel>
          </S.StatCard>
        </S.Stats>
      </S.Container>
    </S.Page>
  )
}


