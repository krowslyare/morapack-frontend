import type { LatLngTuple } from "leaflet"

// Bezier control point
export function computeControlPoint(a: LatLngTuple, b: LatLngTuple, curvature = 0.25): LatLngTuple {
  const lat1 = a[0]
  const lng1 = a[1]
  const lat2 = b[0]
  const lng2 = b[1]
  const latMid = (lat1 + lat2) / 2
  const lngMid = (lng1 + lng2) / 2
  const scale = Math.cos(((lat1 + lat2) * Math.PI) / 360)
  const dx = (lng2 - lng1) * scale
  const dy = lat2 - lat1
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const offset = curvature * len
  const ctrlLng = lngMid + (nx * offset) / (scale || 1e-6)
  const ctrlLat = latMid + ny * offset
  return [ctrlLat, ctrlLng]
}

// Bezier point interpolation
export function bezierPoint(t: number, p0: LatLngTuple, p1: LatLngTuple, p2: LatLngTuple): LatLngTuple {
  const oneMinusT = 1 - t
  const lat = oneMinusT * oneMinusT * p0[0] + 2 * oneMinusT * t * p1[0] + t * t * p2[0]
  const lng = oneMinusT * oneMinusT * p0[1] + 2 * oneMinusT * t * p1[1] + t * t * p2[1]
  return [lat, lng]
}

// Bezier tangent vector
export function bezierTangent(t: number, p0: LatLngTuple, p1: LatLngTuple, p2: LatLngTuple): LatLngTuple {
  const oneMinusT = 1 - t
  const dlat = 2 * oneMinusT * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
  const dlng = 2 * oneMinusT * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
  return [dlat, dlng]
}

// Bearing (heading)
export function calculateBearing(from: LatLngTuple, to: LatLngTuple): number {
  const lat1 = (from[0] * Math.PI) / 180
  const lat2 = (to[0] * Math.PI) / 180
  const dLng = ((to[1] - from[1]) * Math.PI) / 180

  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const bearing = (Math.atan2(y, x) * 180) / Math.PI

  return (bearing + 360) % 360
}
