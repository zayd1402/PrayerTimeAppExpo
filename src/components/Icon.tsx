import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface IconProps extends Omit<ComponentProps<typeof Ionicons>, 'name'> {
  name: string;
}

/**
 * Type-safe wrapper around Ionicons that accepts any string icon name.
 * Centralizes the cast so call sites don't need `as any`.
 */
export function Icon({ name, ...props }: IconProps) {
  return <Ionicons name={name as IoniconsName} {...props} />;
}

export function iconName(name: string): IoniconsName {
  return name as IoniconsName;
}
