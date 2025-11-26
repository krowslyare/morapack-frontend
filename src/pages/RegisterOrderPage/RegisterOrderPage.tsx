import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as S from './RegisterOrderPage.styles'
import { useCreateOrder, useOrder, useUpdateOrder } from '../../hooks/api/useOrders'
import { PackageStatus } from '../../types/PackageStatus'
import { useSimulationStore } from '../../store/useSimulationStore'
import { toast } from 'react-toastify'

// RegisterOrderPage.tsx
const STATUS_OPTS: PackageStatus[] = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'DELAYED']

export default function RegisterOrderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderIdParam = searchParams.get('id')
  const parsedId = orderIdParam ? Number(orderIdParam) : null
  const orderId = Number.isFinite(parsedId) ? parsedId : null
  const isEditMode = Boolean(orderId)

  const createOrder = useCreateOrder()
  const updateOrder = useUpdateOrder()
  const { triggerRefreshIfNeeded } = useSimulationStore()
  const {
    data: existingOrder,
    isLoading: isOrderLoading,
    error: orderFetchError,
  } = useOrder(orderId ?? 0, Boolean(orderId))

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

  useEffect(() => {
    if (existingOrder) {
      setForm({
        name: existingOrder.name ?? '',
        originCityId: existingOrder.originCityId?.toString() ?? '',
        originCityName: existingOrder.originCityName ?? '',
        destinationCityId: existingOrder.destinationCityId?.toString() ?? '',
        destinationCityName: existingOrder.destinationCityName ?? '',
        deliveryDate: existingOrder.deliveryDate
          ? existingOrder.deliveryDate.slice(0, 16)
          : '',
        pickupTimeHours: existingOrder.pickupTimeHours?.toString() ?? '0',
        customerId: existingOrder.customerId?.toString() ?? '',
        status: existingOrder.status ?? 'PENDING',
      })
    }
  }, [existingOrder])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const isValid =
    form.name.trim() &&
    form.originCityId.trim() &&
    form.destinationCityId.trim() &&
    form.customerId.trim() &&
    form.deliveryDate

  const toLocalDateTime = (v: string | Date | null | undefined) => {
    if (!v) return null
    const d = typeof v === 'string' ? new Date(v) : v
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isValid) {
      setError('Completa los campos obligatorios.')
      return
    }

    const parseId = (value: string, label: string) => {
      const parsed = Number(value)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`${label} debe ser un número entero válido.`)
      }
      return Math.trunc(parsed)
    }

    try {
      const payload = {
        name: form.name.trim(),
        originCityId: parseId(form.originCityId, 'Ciudad origen (ID)'),
        originCityName: form.originCityName || null,
        destinationCityId: parseId(form.destinationCityId, 'Ciudad destino (ID)'),
        destinationCityName: form.destinationCityName || null,
        deliveryDate: toLocalDateTime(form.deliveryDate),
        status: form.status as PackageStatus,
        pickupTimeHours: form.pickupTimeHours ? Number(form.pickupTimeHours) : 0,
        creationDate: existingOrder?.creationDate ?? toLocalDateTime(new Date()),
        updatedAt: toLocalDateTime(new Date()),
        customerId: parseId(form.customerId, 'ID cliente'),

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

      if (isEditMode && orderId) {
        await updateOrder.mutateAsync({ id: orderId, updates: payload as any })
      } else {
        await createOrder.mutateAsync(payload as any)

        // NEW: Check if order is within current daily simulation window
        // If yes, trigger algorithm refresh in 1 minute
        if (payload.deliveryDate) {
          const orderDeliveryTime = new Date(payload.deliveryDate)
          const willRefresh = triggerRefreshIfNeeded(orderDeliveryTime)

          if (willRefresh) {
            toast.info('Nueva orden detectada en ventana activa. Algoritmo se ejecutará en 2 minutos.', {
              autoClose: 5000,
            })
          }
        }
      }
      navigate('/envios')
    } catch (err: any) {
      // Extract error message from axios error response
      const errorMessage = err?.response?.data?.error || err?.message || 'No se pudo registrar el pedido.'
      setError(errorMessage)
      console.error('Error al registrar orden:', err)
    }
  }

  const submissionPending = createOrder.isPending || updateOrder.isPending

  return (
    <S.Wrapper>
      <S.Header>
        <div>
          <S.Title>{isEditMode ? 'Editar Pedido' : 'Registrar Pedido'}</S.Title>
          <S.Sub>
            {isEditMode ? 'Actualiza los datos del pedido seleccionado.' : 'Ingresa los datos mínimos y guarda.'}
          </S.Sub>
        </div>
        <S.HeaderActions>
          <S.Button type="button" variant="ghost" onClick={() => navigate('/envios')}>
            ← Volver
          </S.Button>
          <S.Button
            type="submit"
            form="order-form"
            variant="primary"
            disabled={submissionPending || !isValid || (isEditMode && isOrderLoading)}
          >
            {submissionPending ? 'Guardando…' : isEditMode ? 'Actualizar' : 'Guardar'}
          </S.Button>
        </S.HeaderActions>
      </S.Header>

      <S.Panel as="form" id="order-form" onSubmit={handleSubmit}>
        {error && <S.Alert role="alert">⚠ {error}</S.Alert>}
        {orderFetchError && <S.Alert role="alert">⚠ Error al cargar el pedido.</S.Alert>}
        {isEditMode && isOrderLoading && <S.Alert role="status">Cargando pedido...</S.Alert>}

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
            <S.Input
              name="originCityId"
              value={form.originCityId}
              onChange={onChange}
              inputMode="numeric"
              disabled={isOrderLoading}
            />
            <S.Help>Requerido. Usa el ID numérico de la ciudad (verifica IDs válidos en "Datos" del menú).</S.Help>
          </S.Field>
          <S.Field>
            <S.Label>Ciudad Origen (Nombre)</S.Label>
            <S.Input name="originCityName" value={form.originCityName} onChange={onChange} />
            <S.Help>Opcional si usas el ID.</S.Help>
          </S.Field>
          <S.Field>
            <S.Label>Ciudad Destino (ID)</S.Label>
            <S.Input
              name="destinationCityId"
              value={form.destinationCityId}
              onChange={onChange}
              inputMode="numeric"
              disabled={isOrderLoading}
            />
            <S.Help>Requerido. Usa el ID numérico de la ciudad (verifica IDs válidos en "Datos" del menú).</S.Help>
          </S.Field>
          <S.Field>
            <S.Label>Ciudad Destino (Nombre)</S.Label>
            <S.Input
              name="destinationCityName"
              value={form.destinationCityName}
              onChange={onChange}
              disabled={isOrderLoading}
            />
            <S.Help>Opcional si usas el ID.</S.Help>
          </S.Field>
        </S.Grid>

        <S.SectionTitle>Fechas y cliente</S.SectionTitle>
        <S.Grid three>
          <S.Field>
            <S.Label>Fecha de entrega *</S.Label>
            <S.Input
              type="datetime-local"
              name="deliveryDate"
              value={form.deliveryDate}
              onChange={onChange}
              disabled={isOrderLoading}
            />
          </S.Field>
          <S.Field>
            <S.Label>Tiempo de recojo (horas)</S.Label>
            <S.Input
              name="pickupTimeHours"
              value={form.pickupTimeHours}
              onChange={onChange}
              inputMode="decimal"
              disabled={isOrderLoading}
            />
          </S.Field>
          <S.Field>
            <S.Label>ID Cliente</S.Label>
            <S.Input
              name="customerId"
              value={form.customerId}
              onChange={onChange}
              inputMode="numeric"
              disabled={isOrderLoading}
            />
            <S.Help>Requerido. Verifica IDs válidos de clientes en "Datos" del menú.</S.Help>
          </S.Field>
        </S.Grid>

        <S.Footer>
          <S.Muted>Los campos marcados con * son obligatorios.</S.Muted>
          <div>
            <S.Button type="button" variant="ghost" onClick={() => navigate('/envios')}>Cancelar</S.Button>
            <S.Button type="submit" variant="primary" disabled={createOrder.isPending || !isValid}>
              {createOrder.isPending ? 'Guardando…' : 'Guardar pedido'}
            </S.Button>
          </div>
        </S.Footer>
      </S.Panel>
    </S.Wrapper>
  )
}
