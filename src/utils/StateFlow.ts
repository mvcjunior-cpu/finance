/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

/**
 * A lightweight simulation of Kotlin's StateFlow for React components.
 * Retains a single state value and broadcasts updates to multiple subscribers.
 */
export class StateFlow<T> {
  private _value: T;
  private listeners: Set<(value: T) => void> = new Set();

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  /**
   * Retrieves the current value of the flow (synchronous).
   */
  get value(): T {
    return this._value;
  }

  /**
   * Updates the state value and notifies all active subscribers.
   */
  set value(newValue: T) {
    this._value = newValue;
    this.emit(newValue);
  }

  /**
   * Emits a new value to all subscribers.
   */
  emit(newValue: T) {
    this._value = newValue;
    this.listeners.forEach((listener) => {
      try {
        listener(newValue);
      } catch (err) {
        console.error("StateFlow listener error:", err);
      }
    });
  }

  /**
   * Subscribes to value changes. Returns an unsubscribe function.
   * Immediately executes the listener with the current value upon subscription.
   */
  subscribe(listener: (value: T) => void): () => void {
    listener(this._value);
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/**
 * Custom React hook that subscribes to a StateFlow and yields its values
 * as normal React state, forcing a re-render on emission.
 */
export function useCollectAsState<T>(stateFlow: StateFlow<T>): T {
  const [state, setState] = useState<T>(stateFlow.value);

  useEffect(() => {
    // Subscribe to changes in the StateFlow
    const unsubscribe = stateFlow.subscribe((val) => {
      setState(val);
    });
    return unsubscribe;
  }, [stateFlow]);

  return state;
}
