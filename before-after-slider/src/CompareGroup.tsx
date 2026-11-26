import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Lets several sliders in the same row share one height, so photos with
 * different aspect ratios still line up. Each slider reports the height it
 * would like; the group renders every member at the tallest reported height.
 */
interface CompareGroupValue {
  height: number | undefined;
  reportHeight: (id: string, height: number | undefined) => void;
}

const CompareGroupContext = createContext<CompareGroupValue | null>(null);

export function CompareGroup({ children }: { children: ReactNode }) {
  const [heights, setHeights] = useState<Record<string, number>>({});

  const reportHeight = useCallback((id: string, height: number | undefined) => {
    setHeights((previous) => {
      if (previous[id] === height) return previous;
      const next = { ...previous };
      if (height === undefined) delete next[id];
      else next[id] = height;
      return next;
    });
  }, []);

  const value = useMemo<CompareGroupValue>(() => {
    const values = Object.values(heights);
    return { height: values.length ? Math.max(...values) : undefined, reportHeight };
  }, [heights, reportHeight]);

  return <CompareGroupContext.Provider value={value}>{children}</CompareGroupContext.Provider>;
}

/** Returns the surrounding group, or `null` when the slider stands alone. */
export function useCompareGroup(): CompareGroupValue | null {
  return useContext(CompareGroupContext);
}
