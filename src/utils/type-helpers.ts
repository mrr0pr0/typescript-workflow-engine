/**
 * Type Helper Utilities
 */

import type { PortType } from '../types/core';

export const getPortTypeColor = (portType: PortType): string => {
  switch (portType.kind) {
    case 'any':
      return '#94A3B8'; // Slate 400
    case 'string':
      return '#10B981'; // Emerald 500
    case 'number':
      return '#3B82F6'; // Blue 500
    case 'boolean':
      return '#F59E0B'; // Amber 500
    case 'object':
      return '#8B5CF6'; // Violet 500
    case 'array':
      return '#EC4899'; // Pink 500
    case 'void':
      return '#6B7280'; // Gray 500
    case 'custom':
      return '#06B6D4'; // Cyan 500
    default:
      return '#94A3B8';
  }
};

export const getPortTypeLabel = (portType: PortType): string => {
  if (portType.kind === 'custom') {
    return portType.typeName;
  }
  return portType.kind;
};

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'trigger':
      return '#10B981'; // Emerald
    case 'logic':
      return '#F59E0B'; // Amber
    case 'transform':
      return '#3B82F6'; // Blue
    case 'effect':
      return '#EF4444'; // Red
    case 'data':
      return '#8B5CF6'; // Violet
    default:
      return '#6B7280'; // Gray
  }
};