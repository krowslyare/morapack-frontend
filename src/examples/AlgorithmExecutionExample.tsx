/**
 * Example: Algorithm Execution Component
 *
 * This example demonstrates how to execute the optimization algorithms
 * and display the results.
 */

import { useState } from 'react'
import {
  useExecuteAlgorithm,
  useExecuteQuickAlgorithm,
  useExecuteTabu,
  useExecuteALNS,
} from '../hooks/api'
import type { AlgorithmResultSchema, AlgorithmRequest } from '../types'

export function AlgorithmExecutionExample() {
  const [result, setResult] = useState<AlgorithmResultSchema | null>(null)
  const [algorithmType, setAlgorithmType] = useState<'TABU' | 'ALNS'>('TABU')

  // Mutations for different execution modes
  const executeCustom = useExecuteAlgorithm()
  const executeQuick = useExecuteQuickAlgorithm()
  const executeTabu = useExecuteTabu()
  const executeALNS = useExecuteALNS()

  // Handle custom algorithm execution
  const handleCustomExecution = async () => {
    const request: AlgorithmRequest = {
      algorithmType,
      maxIterations: 1000,
      maxNoImprovement: 100,
      neighborhoodSize: 100,
      tabuListSize: 50,
      tabuTenure: 10000,
      useDatabase: false,
    }

    try {
      const result = await executeCustom.mutateAsync(request)
      setResult(result)
    } catch (error) {
      console.error('Algorithm execution failed:', error)
    }
  }

  // Handle quick execution
  const handleQuickExecution = async () => {
    try {
      const result = await executeQuick.mutateAsync()
      setResult(result)
    } catch (error) {
      console.error('Quick execution failed:', error)
    }
  }

  // Handle Tabu Search execution
  const handleTabuExecution = async () => {
    try {
      const result = await executeTabu.mutateAsync()
      setResult(result)
    } catch (error) {
      console.error('Tabu execution failed:', error)
    }
  }

  // Handle ALNS execution
  const handleALNSExecution = async () => {
    try {
      const result = await executeALNS.mutateAsync()
      setResult(result)
    } catch (error) {
      console.error('ALNS execution failed:', error)
    }
  }

  const isExecuting =
    executeCustom.isPending ||
    executeQuick.isPending ||
    executeTabu.isPending ||
    executeALNS.isPending

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Algorithm Execution</h1>

      {/* Execution Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleQuickExecution}
          disabled={isExecuting}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isExecuting ? 'not-allowed' : 'pointer',
          }}
        >
          Quick Execute (500 iterations)
        </button>

        <button
          onClick={handleTabuExecution}
          disabled={isExecuting}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isExecuting ? 'not-allowed' : 'pointer',
          }}
        >
          Execute Tabu Search
        </button>

        <button
          onClick={handleALNSExecution}
          disabled={isExecuting}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isExecuting ? 'not-allowed' : 'pointer',
          }}
        >
          Execute ALNS
        </button>
      </div>

      {/* Custom Execution */}
      <div
        style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h2>Custom Execution</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Algorithm Type:{' '}
            <select
              value={algorithmType}
              onChange={(e) => setAlgorithmType(e.target.value as 'TABU' | 'ALNS')}
              style={{ padding: '5px 10px', marginLeft: '10px' }}
            >
              <option value="TABU">Tabu Search</option>
              <option value="ALNS">ALNS</option>
            </select>
          </label>
        </div>
        <button
          onClick={handleCustomExecution}
          disabled={isExecuting}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isExecuting ? 'not-allowed' : 'pointer',
          }}
        >
          Execute Custom
        </button>
      </div>

      {/* Loading State */}
      {isExecuting && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h3>Executing Algorithm...</h3>
          <p>This may take a few minutes depending on the complexity and parameters.</p>
          <div
            style={{
              width: '100%',
              height: '10px',
              backgroundColor: '#e0e0e0',
              borderRadius: '5px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#ffc107',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          <h2>Execution Results</h2>

          {/* Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                padding: '15px',
                backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                borderRadius: '8px',
              }}
            >
              <h4>Status</h4>
              <p
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: result.success ? '#155724' : '#721c24',
                }}
              >
                {result.success ? 'Success' : 'Failed'}
              </p>
            </div>

            <div
              style={{
                padding: '15px',
                backgroundColor: '#d1ecf1',
                borderRadius: '8px',
              }}
            >
              <h4>Execution Time</h4>
              <p style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {result.executionTimeSeconds ? `${result.executionTimeSeconds}s` : 'N/A'}
              </p>
            </div>

            <div
              style={{
                padding: '15px',
                backgroundColor: '#d4edda',
                borderRadius: '8px',
              }}
            >
              <h4>Assigned Orders</h4>
              <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{result.assignedOrders || 0}</p>
            </div>

            <div
              style={{
                padding: '15px',
                backgroundColor: '#f8d7da',
                borderRadius: '8px',
              }}
            >
              <h4>Unassigned Orders</h4>
              <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{result.unassignedOrders || 0}</p>
            </div>
          </div>

          {/* Product Routes */}
          {result.productRoutes && result.productRoutes.length > 0 && (
            <div>
              <h3>Product Routes ({result.productRoutes.length})</h3>
              <div
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Product ID</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Order ID</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Origin</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Destination</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6' }}>Flights</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.productRoutes.map((route, index) => (
                      <tr key={index}>
                        <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                          {route.productId}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                          {route.orderId}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                          {route.originCity}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                          {route.destinationCity}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                          {route.flights?.length || 0} flight(s)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Message */}
          {!result.success && result.errorMessage && (
            <div
              style={{
                padding: '15px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                marginTop: '20px',
              }}
            >
              <h4 style={{ color: '#721c24' }}>Error</h4>
              <p style={{ color: '#721c24' }}>{result.errorMessage}</p>
            </div>
          )}
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  )
}
