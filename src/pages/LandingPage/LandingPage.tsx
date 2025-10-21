import * as S from './LandingPage.styles'

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
            <span className="material-symbols-outlined">search</span>
            <input placeholder="Buscar" />
          </S.Search>
          <S.Avatar>
            <span className="material-symbols-outlined">account_circle</span>
          </S.Avatar>
        </S.TopRight>
      </S.TopBar>

      <S.Container>
        <S.Title>Seleccione un módulo</S.Title>

        <S.Modules>
          <S.ModuleTile onClick={() => window.location.href = '/envios'}>
            <span className="material-symbols-outlined">box</span>
            ENVIOS
          </S.ModuleTile>
          <S.ModuleTile onClick={() => window.location.href = '/monitoreo'}>
            <span className="material-symbols-outlined">connecting_airports</span>
            MONITOREO
          </S.ModuleTile>
          <S.ModuleTile onClick={() => window.location.href = '/datos'}>
            <span className="material-symbols-outlined">database</span>
            DATOS
          </S.ModuleTile>
          <S.ModuleTile onClick={() => window.location.href = '/reportes'}>
            <span className="material-symbols-outlined">description</span>
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


