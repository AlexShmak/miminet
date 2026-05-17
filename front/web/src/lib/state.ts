/**
 * Shared mutable state for the front-end.
 *
 * Why an object instead of individual `export let`?
 * ES module exports are READ-ONLY from importing modules — once a module
 * does `export let X = 0`, no other module can reassign `X`. The 13
 * classic-script files heavily mutate these globals from many places, so
 * to migrate without rewriting every assignment we bundle them on a
 * single object and access as `state.X = ...` everywhere.
 *
 * Phase 3b migration step: for each .js file moved into web/src/, add
 *
 *   import { state, CONSTANTS } from "../lib/state";
 *
 * and replace bare references like `SimulationId` → `state.simulationId`.
 */

import type cytoscape from "cytoscape";

export interface PacketFilterState {
  hideARP: boolean;
  hideSTP: boolean;
  hideSYN: boolean;
}

export interface MiminetState {
  simulationId: number;
  lastSimulationId: number;
  global_cy?: cytoscape.Core;
  global_eh?: unknown;
  networkUpdateTimeoutId: number;
  networkCache: unknown[];
  packetsNotFiltered: unknown;
  packetFilterState: PacketFilterState;
  gridCanvasLayer?: unknown;
  gridEnabled: boolean;
  currentGridZoom: number;
}

export const state: MiminetState = {
  simulationId: 0,
  lastSimulationId: 0,
  global_cy: undefined,
  global_eh: undefined,
  networkUpdateTimeoutId: -1,
  networkCache: [],
  packetsNotFiltered: null,
  packetFilterState: {
    hideARP: false,
    hideSTP: false,
    hideSYN: false,
  },
  gridCanvasLayer: undefined,
  gridEnabled: true,
  currentGridZoom: 1.0,
};

export const LINK_DOWN_JOB_ID = 6;

/** Random opaque id, used as suffix when generating uid()-based names. */
export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);
