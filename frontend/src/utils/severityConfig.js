/**
 * Centralized severity color config used across AlertCard, AlertDetails, WeatherPage, etc.
 */
export const severityConfig = {
  CRITICAL: {
    badge: 'bg-red-100 text-red-600 border border-red-200',
    dot: 'bg-red-500',
    ring: 'ring-red-200',
  },
  HIGH: {
    badge: 'bg-orange-100 text-orange-600 border border-orange-200',
    dot: 'bg-orange-500',
    ring: 'ring-orange-200',
  },
  MEDIUM: {
    badge: 'bg-yellow-100 text-yellow-600 border border-yellow-200',
    dot: 'bg-yellow-500',
    ring: 'ring-yellow-200',
  },
  LOW: {
    badge: 'bg-green-100 text-green-600 border border-green-200',
    dot: 'bg-green-500',
    ring: 'ring-green-200',
  },
};

export function getSeverityConfig(severity) {
  return severityConfig[severity?.toUpperCase()] || severityConfig.LOW;
}
