/**
 * Example: Orders Page Component
 *
 * This example demonstrates how to use the API hooks in a real component.
 * You can use this as a reference for implementing your actual pages.
 */

import { useState } from 'react'
import {
  useOrders,
  useOrdersByStatus,
  useCreateOrder,
  useUpdateOrderStatus,
  useDeleteOrder,
} from '../hooks/api'
import { PackageStatus } from '../types'

export function OrdersPageExample() {
  const [filterStatus, setFilterStatus] = useState<PackageStatus | undefined>()

  // Queries - Fetch data
  const { data: allOrders, isLoading, error } = useOrders()
  const { data: pendingOrders } = useOrdersByStatus(PackageStatus.PENDING)
  const { data: inTransitOrders } = useOrdersByStatus(PackageStatus.IN_TRANSIT)

  // Mutations - Modify data
  const createOrder = useCreateOrder()
  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()

  // Handlers
  const handleCreateOrder = async () => {
    try {
      await createOrder.mutateAsync({
        name: `Order ${Date.now()}`,
        originCityId: 1,
        originCityName: 'Lima',
        destinationCityId: 2,
        destinationCityName: 'Brussels',
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: PackageStatus.PENDING,
        pickupTimeHours: 2,
        customerId: 1,
      })
      alert('Order created successfully!')
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('Failed to create order')
    }
  }

  const handleUpdateStatus = async (id: number, status: PackageStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status })
      alert(`Order ${id} updated to ${status}`)
    } catch (error) {
      console.error('Failed to update order:', error)
    }
  }

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return

    try {
      await deleteOrder.mutateAsync(id)
      alert('Order deleted successfully!')
    } catch (error) {
      console.error('Failed to delete order:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Orders</h1>
        <p>Loading orders...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Orders</h1>
        <p style={{ color: 'red' }}>Error: {error.message}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Orders Management</h1>

      {/* Actions */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleCreateOrder}
          disabled={createOrder.isPending}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: createOrder.isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {createOrder.isPending ? 'Creating...' : 'Create New Order'}
        </button>
      </div>

      {/* Statistics */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}
        >
          <h3>Total Orders</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{allOrders?.length || 0}</p>
        </div>
        <div
          style={{
            padding: '15px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
          }}
        >
          <h3>Pending</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{pendingOrders?.length || 0}</p>
        </div>
        <div
          style={{
            padding: '15px',
            backgroundColor: '#d1ecf1',
            borderRadius: '8px',
          }}
        >
          <h3>In Transit</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{inTransitOrders?.length || 0}</p>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          Filter by status:{' '}
          <select
            value={filterStatus || ''}
            onChange={(e) =>
              setFilterStatus(e.target.value ? (e.target.value as PackageStatus) : undefined)
            }
            style={{ padding: '5px 10px', marginLeft: '10px' }}
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
      </div>

      {/* Orders List */}
      <div>
        <h2>Orders List</h2>
        {allOrders && allOrders.length > 0 ? (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>ID</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Name</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Origin</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Destination</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Status</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Delivery Date</th>
                <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allOrders
                .filter((order) => (filterStatus ? order.status === filterStatus : true))
                .map((order) => (
                  <tr key={order.id}>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{order.id}</td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{order.name}</td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                      {order.originCityName}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                      {order.destinationCityName}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            order.status === 'DELIVERED'
                              ? '#d4edda'
                              : order.status === 'IN_TRANSIT'
                                ? '#d1ecf1'
                                : order.status === 'PENDING'
                                  ? '#fff3cd'
                                  : '#f8d7da',
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                      {order.deliveryDate && new Date(order.deliveryDate).toLocaleDateString()}
                    </td>
                    <td
                      style={{
                        padding: '10px',
                        border: '1px solid #dee2e6',
                        textAlign: 'center',
                      }}
                    >
                      <select
                        value={order.status}
                        onChange={(e) =>
                          order.id && handleUpdateStatus(order.id, e.target.value as PackageStatus)
                        }
                        style={{
                          padding: '5px',
                          marginRight: '5px',
                          fontSize: '12px',
                        }}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      <button
                        onClick={() => order.id && handleDeleteOrder(order.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p>No orders found.</p>
        )}
      </div>

      {/* Mutation States */}
      {(createOrder.isPending || updateStatus.isPending || deleteOrder.isPending) && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '15px',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}
        >
          Processing...
        </div>
      )}
    </div>
  )
}
