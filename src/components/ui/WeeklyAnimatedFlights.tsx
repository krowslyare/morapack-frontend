import { useEffect, useRef } from "react"
import { useMap } from "react-leaflet"
import L, { Marker, DivIcon, type LatLngTuple } from "leaflet"
import gsap from "gsap"

import type { FlightInstance } from "../../api/simulationService"
import { bezierPoint, bezierTangent, computeControlPoint, calculateBearing } from "./bezierUtils"

interface Props {
  flightInstances: FlightInstance[]
  currentSimTime: Date
  simulationStartTime: Date
  playbackSpeed: number
}

export function WeeklyAnimatedFlights({
  flightInstances,
  currentSimTime,
  simulationStartTime,
  playbackSpeed
}: Props) {
  const map = useMap()
  const markersRef = useRef<Record<string, Marker>>({})
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const processedRef = useRef<Set<string>>(new Set())

  // Inicializar timeline
  useEffect(() => {
    if (!map) return

    timelineRef.current = gsap.timeline({ paused: true })

    return () => {
      timelineRef.current?.kill()
      Object.values(markersRef.current).forEach(m => m.remove())
    }
  }, [map])

  // Cargar vuelos del día
  useEffect(() => {
    if (!timelineRef.current) return
    const tl = timelineRef.current

    const ahead = new Date(currentSimTime.getTime() + 20 * 60000)
    const behind = new Date(currentSimTime.getTime() - 20 * 60000)

    const flightsToAnimate = flightInstances.filter(f => {
      const dep = new Date(f.departureTime)
      const arr = new Date(f.arrivalTime)
      return dep <= ahead && arr >= behind && !processedRef.current.has(f.id)
    })

    flightsToAnimate.forEach(f => {
      processedRef.current.add(f.id)

      const origin: LatLngTuple = [f.originAirport.latitude, f.originAirport.longitude]
      const dest: LatLngTuple = [f.destinationAirport.latitude, f.destinationAirport.longitude]
      const ctrl = computeControlPoint(origin, dest)

      const initialAngle = calculateBearing(origin, dest) + 90

      const icon = new DivIcon({
        html: `<img src="/airplane.png"
              style="width:20px;height:20px;transform:rotate(${initialAngle}deg)" />`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })

      const marker = L.marker(origin, { icon }).addTo(map)
      marker.setOpacity(0)
      markersRef.current[f.id] = marker

      const dep = new Date(f.departureTime).getTime()
      const arr = new Date(f.arrivalTime).getTime()

      const duration = (arr - dep) / 1000
      const offset = (dep - simulationStartTime.getTime()) / 1000

      const obj = { t: 0 }

      tl.to(
        obj,
        {
          t: 1,
          duration,
          ease: "none",
          onUpdate() {
            const pos = bezierPoint(obj.t, origin, ctrl, dest)
            marker.setLatLng(pos)

            const tan = bezierTangent(obj.t, origin, ctrl, dest)
            const angle = (Math.atan2(tan[1], tan[0]) * 180) / Math.PI + 90

            const img = marker.getElement()?.querySelector("img")
            if (img) img.style.transform = `rotate(${angle}deg)`
          },
          onStart() {
            marker.setOpacity(1)
          },
          onComplete() {
            marker.setOpacity(0.3)
          }
        },
        offset
      )
    })

    const elapsed = (currentSimTime.getTime() - simulationStartTime.getTime()) / 1000
    tl.seek(elapsed)
  }, [flightInstances, currentSimTime])

  // Control de velocidad
  useEffect(() => {
    if (!timelineRef.current) return
    timelineRef.current.timeScale(playbackSpeed)
  }, [playbackSpeed])

  return null
}
