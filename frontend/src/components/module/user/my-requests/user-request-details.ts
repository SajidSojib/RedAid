"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMyRequestDetails } from "@/action/request.action";
import type { MyRequestDetails } from "@/service/request.service";

export function useRequestDetails(id: string | null) {
  const [data, setData] = useState<MyRequestDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const latest = useRef<string | null>(null);

  // Keeps the old data on screen while it reloads, so the dialog doesn't flash
  const reload = useCallback(async () => {
    if (!id) return;
    latest.current = id;

    const { data: result, error: failure } = await getMyRequestDetails(id);
    if (latest.current !== id) return; // another request replaced this one

    if (failure || !result) {
      setData(null);
      setError(failure?.message ?? "Couldn't load this request");
    } else {
      setData(result);
      setError(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    setData(null);
    setError(null);

    if (!id) {
      latest.current = null;
      setLoading(false);
      return;
    }

    setLoading(true);
    void reload();
  }, [id, reload]);

  return { data, error, loading, reload };
}
