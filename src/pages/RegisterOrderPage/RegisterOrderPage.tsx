import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as S from './RegisterOrderPage.styles'
import { useCreateOrder } from '../../hooks/api/useOrders'
import { PackageStatus } from '../../types/PackageStatus' 

// RegisterOrderPage.tsx
const STATUS_OPTS: PackageStatus[] = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'DELAYED']

export default function RegisterOrderPage() {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()

  const [form, setForm] = useState({
    name: '',
    originCityId: '',
    originCityName: '',
    destinationCityId: '',
    destinationCityName: '',
    deliveryDate: '',          // datetime-local value
    pickupTimeHours: '0',
    customerId: '',
    status: 'PENDING' as PackageStatus,
  })
  const [error, setError] = useState<string | null>(null)

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const isValid =
    form.name.trim() &&
    (form.originCityId || form.originCityName) &&
    (form.destinationCityId || form.destinationCityName) &&
    form.deliveryDate

  const toLocalDateTime = (v: string | Date | null | undefined) => {
        if (!v) return null
        const d = typeof v === 'string' ? new Date(v) : v
        const pad = (n:number)=>String(n).padStart(2,'0')
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isValid) {
      setError('Completa los campos obligatorios.')
      return
    }

    const payload = {
      name: form.name.trim(),
      originCityId: form.originCityId ? Number(form.originCityId) : null,
      originCityName: form.originCityName || null,
      destinationCityId: form.destinationCityId ? Number(form.destinationCityId) : null,
      destinationCityName: form.destinationCityName || null,
      deliveryDate: toLocalDateTime(form.deliveryDate),
      status: form.status as PackageStatus,
      pickupTimeHours: form.pickupTimeHours ? Number(form.pickupTimeHours) : 0,
      creationDate: toLocalDateTime(new Date()),
      updatedAt:   toLocalDateTime(new Date()),
      customerId: form.customerId ? Number(form.customerId) : null,

      // Campos legacy opcionales: los dejamos null para que el backend los ignore si no aplica
      customerSchema: null,
      destinationCitySchema: null,
      orderDate: null,
      deliveryDeadline: null,
      currentLocation: null,
      assignedRouteSchema: null,
      priority: 0,
      productSchemas: [],
    }

    try {
      await createOrder.mutateAsync(payload as any)
      navigate('/envios')
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar el pedido.')
    }
  }

  return (
    <S.Wrapper>
      <S.Header>
        <div>
          <S.Title>Registrar Pedido</S.Title>
          <S.Sub>Ingresa los datos mínimos y guarda.</S.Sub>
        </div>
        <S.HeaderActions>
          <S.Button type="button" variant="ghost" onClick={() => navigate('/envios')}>
            ← Volver
          </S.Button>
          <S.Button type="submit" form="order-form" variant="primary" disabled={createOrder.isPending   || !isValid}>
            {createOrder.isPending   ? 'Guardando…' : 'Guardar'}
          </S.Button>
        </S.HeaderActions>
      </S.Header>

      <S.Panel as="form" id="order-form" onSubmit={handleSubmit}>
        {error && <S.Alert role="alert">⚠ {error}</S.Alert>}

        <S.Grid two>
          <S.Field>
            <S.Label>Nombre del pedido *</S.Label>
            <S.Input name="name" value={form.name} onChange={onChange} placeholder="Ej. Pedido #2025-001" />
          </S.Field>

          <S.Field>
            <S.Label>Estado *</S.Label>
            <S.Select name="status" value={form.status} onChange={onChange}>
                {STATUS_OPTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </S.Select>
          </S.Field>
        </S.Grid>

        <S.SectionTitle>Origen y destino</S.SectionTitle>
        <S.Grid two>
          <S.Field>
            <S.Label>Ciudad Origen (ID)</S.Label>
            <S.Input name="originCityId" value={form.originCityId} onChange={onChange} inputMode="numeric" />
            <S.Help>Opcional si llenas el nombre.</S.Help>
          </S.Field>
          <S.Field>
            <S.Label>Ciudad Origen (Nombre)</S.Label>
            <S.Input name="originCityName" value={form.originCityName} onChange={onChange} />
            <S.Help>Opcional si usas el ID.</S.Help>
          </S.Field>
          <S.Field>
            <S.Label>Ciudad Destino (ID)</S.Label>
            <S.Input name="destinationCityId" value={form.destinationCityId} onChange={onChange} inputMode="numeric" />
            <S.Help>Opcional si llenas el nombre.</S.Help>
          </S.Field>
          <S.Field>
            <S.Label>Ciudad Destino (Nombre)</S.Label>
            <S.Input name="destinationCityName" value={form.destinationCityName} onChange={onChange} />
            <S.Help>Opcional si usas el ID.</S.Help>
          </S.Field>
        </S.Grid>

        <S.SectionTitle>Fechas y cliente</S.SectionTitle>
        <S.Grid three>
          <S.Field>
            <S.Label>Fecha de entrega *</S.Label>
            <S.Input type="datetime-local" name="deliveryDate" value={form.deliveryDate} onChange={onChange} />
          </S.Field>
          <S.Field>
            <S.Label>Tiempo de recojo (horas)</S.Label>
            <S.Input name="pickupTimeHours" value={form.pickupTimeHours} onChange={onChange} inputMode="decimal" />
          </S.Field>
          <S.Field>
            <S.Label>ID Cliente</S.Label>
            <S.Input name="customerId" value={form.customerId} onChange={onChange} inputMode="numeric" />
          </S.Field>
        </S.Grid>

        <S.Footer>
          <S.Muted>Los campos marcados con * son obligatorios.</S.Muted>
          <div>
            <S.Button type="button" variant="ghost" onClick={() => navigate('/envios')}>Cancelar</S.Button>
            <S.Button type="submit" variant="primary" disabled={createOrder.isPending   || !isValid}>
              {createOrder.isPending   ? 'Guardando…' : 'Guardar pedido'}
            </S.Button>
          </div>
        </S.Footer>
      </S.Panel>
    </S.Wrapper>
  )
}
