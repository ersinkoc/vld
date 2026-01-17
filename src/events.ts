/**
 * VLD Event System
 *
 * This module defines all VLD-specific events for validation lifecycle,
 * plugin management, and debugging.
 */

import type { EventMap } from './compat/emitter';
import type { VldError } from './errors';
import type { VldBase } from './validators/base';

/**
 * VLD Event definitions
 */
export interface VldEvents extends EventMap {
  // ============================================
  // Parse Lifecycle Events
  // ============================================

  /** Emitted when parsing starts */
  'vld:parse:start': {
    value: unknown;
    schema: VldBase<unknown, unknown>;
    timestamp: number;
  };

  /** Emitted when parsing succeeds */
  'vld:parse:success': {
    data: unknown;
    schema: VldBase<unknown, unknown>;
    duration: number;
    timestamp: number;
  };

  /** Emitted when parsing fails */
  'vld:parse:error': {
    error: VldError;
    schema: VldBase<unknown, unknown>;
    duration: number;
    timestamp: number;
  };

  // ============================================
  // Validation Detail Events
  // ============================================

  /** Emitted for each field validation in objects */
  'vld:validate:field': {
    key: string;
    value: unknown;
    valid: boolean;
    path: (string | number)[];
    timestamp: number;
  };

  /** Emitted when a transform is applied */
  'vld:validate:transform': {
    before: unknown;
    after: unknown;
    schemaName: string;
    timestamp: number;
  };

  /** Emitted when a refinement is checked */
  'vld:validate:refine': {
    value: unknown;
    passed: boolean;
    message?: string;
    timestamp: number;
  };

  // ============================================
  // Plugin Events
  // ============================================

  /** Emitted when a plugin is registered */
  'vld:plugin:registered': {
    name: string;
    version: string;
    timestamp: number;
  };

  /** Emitted when a plugin encounters an error */
  'vld:plugin:error': {
    name: string;
    error: Error;
    timestamp: number;
  };

  /** Emitted when a custom validator is registered */
  'vld:validator:registered': {
    name: string;
    timestamp: number;
  };

  /** Emitted when a custom codec is registered */
  'vld:codec:registered': {
    name: string;
    timestamp: number;
  };

  // ============================================
  // Locale Events
  // ============================================

  /** Emitted when locale is changed */
  'vld:locale:changed': {
    from: string;
    to: string;
    timestamp: number;
  };

  // ============================================
  // Debug Events
  // ============================================

  /** Emitted for debug logging */
  'vld:debug': {
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    data?: unknown;
    timestamp: number;
  };

  /** Emitted for performance metrics */
  'vld:metrics': {
    operation: string;
    duration: number;
    success: boolean;
    metadata?: Record<string, unknown>;
    timestamp: number;
  };
}

/**
 * Event payload types for type-safe event handling
 */
export type VldEventPayload<K extends keyof VldEvents> = VldEvents[K];

/**
 * Parse start event payload
 */
export type ParseStartEvent = VldEvents['vld:parse:start'];

/**
 * Parse success event payload
 */
export type ParseSuccessEvent = VldEvents['vld:parse:success'];

/**
 * Parse error event payload
 */
export type ParseErrorEvent = VldEvents['vld:parse:error'];

/**
 * Field validation event payload
 */
export type FieldValidationEvent = VldEvents['vld:validate:field'];

/**
 * Transform event payload
 */
export type TransformEvent = VldEvents['vld:validate:transform'];

/**
 * Plugin registered event payload
 */
export type PluginRegisteredEvent = VldEvents['vld:plugin:registered'];

/**
 * Locale changed event payload
 */
export type LocaleChangedEvent = VldEvents['vld:locale:changed'];

/**
 * Debug event payload
 */
export type DebugEvent = VldEvents['vld:debug'];

/**
 * Metrics event payload
 */
export type MetricsEvent = VldEvents['vld:metrics'];
