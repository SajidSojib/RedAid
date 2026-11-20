"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMyRequestDetails } from "@/action/request.action";
import type { MyRequestDetails } from "@/service/request.service";

type State = {
  id: string | null; // which request this state belongs to
  data: MyRequestDetails | null;
  error: string | null;
};

export function useRequestDetails(id: string | null) {
  const [state, setState] = useState<State>({
    id: null,
    data: null,
    error: null,
  });
  const latest = useRef<string | null>(null);

  // Keeps the old data on screen while it reloads, so the dialog doesn't flash
  const reload = useCallback(async () => {
    if (!id) return;
    latest.current = id;

    const { data, error } = await getMyRequestDetails(id);
    if (latest.current !== id) return; // another request replaced this one

    setState({
      id,
      data: data ?? null,
      error: data ? null : (error?.message ?? "Couldn't load this request"),
    });
  }, [id]);

  useEffect(() => {
    if (!id) {
      latest.current = null;
      return;
    }
    void reload(); // setState happens after the await, not synchronously
  }, [id, reload]);

  // Ignore results that belong to a different request than the one open now
  const current = state.id === id ? state : null;

  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: Boolean(id) && !current,
    reload,
  };
}
