import { useEffect, useRef, useCallback, useState } from "react";

interface UseInfiniteScrollOptions {
    hasNextPage: boolean;
    fetchNextPage: () => Promise<void>;
    isLoading: boolean;
    rootMargin?: string;
}

interface UseInfiniteScrollReturn {
    sentinelRef: React.RefObject<HTMLDivElement | null>;
    isFetchingNextPage: boolean;
}

export function useInfiniteScroll({
    hasNextPage,
    fetchNextPage,
    isLoading,
    rootMargin = "100px",
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const fetchingRef = useRef(false);

    const handleIntersection = useCallback(
        async (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;

            if (
                entry.isIntersecting &&
                hasNextPage &&
                !isLoading &&
                !fetchingRef.current
            ) {
                fetchingRef.current = true;
                setIsFetchingNextPage(true);

                try {
                    await fetchNextPage();
                } finally {
                    fetchingRef.current = false;
                    setIsFetchingNextPage(false);
                }
            }
        },
        [hasNextPage, fetchNextPage, isLoading]
    );

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(handleIntersection, {
            rootMargin,
            threshold: 0.1,
        });

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [handleIntersection, rootMargin]);

    return {
        sentinelRef,
        isFetchingNextPage,
    };
}
