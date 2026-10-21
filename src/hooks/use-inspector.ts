"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { seedMemories, USERS } from "@/data/seed";
import { detectClusters } from "@/lib/detect";
import { hygieneStats } from "@/lib/health";
import { applyResolution } from "@/lib/resolve";
import { InMemoryMemoryStore } from "@/lib/store/in-memory-store";
import { NOW } from "@/lib/time";
import type { Cluster, ClusterKind, Resolution } from "@/lib/types";

export type Filter = "all" | ClusterKind;

const NAMES = Object.fromEntries(USERS.map((u) => [u.id, u.name]));

function createStores(): Record<string, InMemoryMemoryStore> {
  const all = seedMemories();
  return Object.fromEntries(USERS.map((u) => [u.id, new InMemoryMemoryStore(all.filter((m) => m.user_id === u.id))]));
}

export function useInspector(initialUser = "sam") {
  const storesRef = useRef<Record<string, InMemoryMemoryStore> | null>(null);
  if (!storesRef.current) storesRef.current = createStores();
  const stores = storesRef.current;

  const [userId, setUserIdState] = useState(initialUser);
  const [version, setVersion] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trend, setTrend] = useState<Record<string, number[]>>({});

  const store = stores[userId];
  // `version` changes after every mutation of the (mutable) store.
  const memories = useMemo(() => store.getAll(userId), [store, userId, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const clusters = useMemo(() => detectClusters(memories, { now: NOW, names: NAMES }), [memories]);
  const stats = useMemo(() => hygieneStats(memories, clusters, NOW), [memories, clusters]);
  const visible = useMemo(() => clusters.filter((c) => filter === "all" || c.kind === filter), [clusters, filter]);
  const selected = visible.find((c) => c.id === selectedId) ?? visible[0] ?? null;
  const scoreTrend = trend[userId] ?? [stats.score];

  const recordScore = useCallback(() => {
    const list = store.getAll(userId);
    const s = hygieneStats(list, detectClusters(list, { now: NOW }), NOW).score;
    setTrend((t) => ({ ...t, [userId]: [...(t[userId] ?? [stats.score]), s].slice(-20) }));
    setVersion((v) => v + 1);
  }, [store, userId, stats.score]);

  const resolve = useCallback(
    (cluster: Cluster, action: Resolution) => {
      applyResolution(store, cluster, action, NOW);
      recordScore();
      return cluster.memberIds.length - 1;
    },
    [store, recordScore],
  );

  const undo = useCallback(() => {
    const ok = store.restore();
    if (ok) recordScore();
    return ok;
  }, [store, recordScore]);

  const setUserId = useCallback((id: string) => {
    setUserIdState(id);
    setSelectedId(null);
  }, []);

  return {
    users: USERS,
    userId,
    setUserId,
    store,
    memories,
    clusters,
    visible,
    stats,
    filter,
    setFilter,
    selected,
    select: setSelectedId,
    resolve,
    undo,
    canUndo: store.undoDepth() > 0,
    scoreTrend,
    version,
  };
}
