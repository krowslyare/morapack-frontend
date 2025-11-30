import styled from "styled-components"
import type { FlightInstance } from "../api/simulationService"

const ListContainer = styled.div`
  padding: 12px;
  overflow-y: auto;
  flex: 1;
`

const Card = styled.div`
  padding: 12px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  margin-bottom: 10px;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }
`

interface FlightsListProps {
  flights: FlightInstance[];
  onSelectFlight: (flight: FlightInstance) => void;
}

export function FlightsList({ flights, onSelectFlight }: FlightsListProps) {
  return (
    <ListContainer>
      {flights.map(f => (
        <Card key={f.flightId} onClick={() => onSelectFlight(f)}>
          <strong>{f.flightCode}</strong>

          <div>
            {f.originAirport.codeIATA} → {f.destinationAirport.codeIATA}
          </div>

          <div>Sale: {new Date(f.departureTime).toLocaleString()}</div>

          <div>Estado: {f.status}</div>

          <div>
            {new Date(f.departureTime).toLocaleTimeString("es-PE", { hour12: false })}
          </div>

          <div>
            {f.assignedProducts} productos asignados
          </div>
        </Card>
      ))}
    </ListContainer>
  )
}
