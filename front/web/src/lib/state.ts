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
 * Bridge to window globals (transitional):
 * Until every classic-script file has been migrated to ES modules, both
 * worlds must see the same values. Properties below are implemented as
 * getters/setters that proxy to `window`, where the unmigrated state.js
 * classic script still owns the source of truth (`window.SimulationId`,
 * `window.NetworkCache`, …). When the last classic file is migrated,
 * this bridge can be replaced with plain `let` storage.
 *
 * Phase 3b migration step: for each .js file moved into web/src/, add
 *
 *   import { state, LINK_DOWN_JOB_ID, uid } from "../lib/state";
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
  global_eh?: any;
  networkUpdateTimeoutId: any;
  networkCache: unknown[];
  packetsNotFiltered: any;
  packetFilterState: PacketFilterState;
  gridCanvasLayer?: any;
  gridEnabled: boolean;
  currentGridZoom: number;
}

const w = window as Window & Record<string, unknown>;

export const state: MiminetState = {
  get simulationId() {
    return (w.SimulationId as number) ?? 0;
  },
  set simulationId(v) {
    w.SimulationId = v;
  },

  get lastSimulationId() {
    return (w.lastSimulationId as number) ?? 0;
  },
  set lastSimulationId(v) {
    w.lastSimulationId = v;
  },

  get global_cy() {
    return w.global_cy as cytoscape.Core | undefined;
  },
  set global_cy(v) {
    w.global_cy = v;
  },

  get global_eh() {
    return w.global_eh;
  },
  set global_eh(v) {
    w.global_eh = v;
  },

  get networkUpdateTimeoutId() {
    return (w.NetworkUpdateTimeoutId as number) ?? -1;
  },
  set networkUpdateTimeoutId(v) {
    w.NetworkUpdateTimeoutId = v;
  },

  get networkCache() {
    return (w.NetworkCache as unknown[]) ?? [];
  },
  set networkCache(v) {
    w.NetworkCache = v;
  },

  get packetsNotFiltered() {
    return w.packetsNotFiltered;
  },
  set packetsNotFiltered(v) {
    w.packetsNotFiltered = v;
  },

  get packetFilterState() {
    return (
      (w.packetFilterState as PacketFilterState) ?? {
        hideARP: false,
        hideSTP: false,
        hideSYN: false,
      }
    );
  },
  set packetFilterState(v) {
    w.packetFilterState = v;
  },

  get gridCanvasLayer() {
    return w.gridCanvasLayer;
  },
  set gridCanvasLayer(v) {
    w.gridCanvasLayer = v;
  },

  get gridEnabled() {
    return (w.gridEnabled as boolean) ?? true;
  },
  set gridEnabled(v) {
    w.gridEnabled = v;
  },

  get currentGridZoom() {
    return (w.currentGridZoom as number) ?? 1.0;
  },
  set currentGridZoom(v) {
    w.currentGridZoom = v;
  },
};

export const LINK_DOWN_JOB_ID = 6;

/** Random opaque id, used as suffix when generating uid()-based names. */
export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);
