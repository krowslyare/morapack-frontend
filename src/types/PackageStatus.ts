export const PackageStatus = {
  PENDING: 'PENDING',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  DELIVERED: 'DELIVERED',
  DELAYED: 'DELAYED',
} as const

export type PackageStatus = typeof PackageStatus[keyof typeof PackageStatus]