import { useState, useCallback } from "react";

interface LegislativeAct {
    act_num: string;
    year: number;
    state: string;
    name: string;
    link: string;
    backup_link: string;
    relevances: {
        score: number;
        search_key: string;
    }[];
}

interface SearchParams {
    states: string[];
    fromYear: number;
    toYear: number;
    searchKeys: string[];
    limit: number;
}

interface UseSearchResultsReturn {
    results: LegislativeAct[];
    isLoading: boolean;
    hasMoreResults: boolean;
    performSearch: (params: SearchParams) => Promise<void>;
    loadMore: (params: SearchParams) => Promise<void>;
    clearResults: () => void;
}

function mergeResults(
    existing: LegislativeAct[],
    incoming: LegislativeAct[]
): LegislativeAct[] {
    const byActNum = new Map<string, LegislativeAct>();
    const order: string[] = [];

    for (const act of [...existing, ...incoming]) {
        const current = byActNum.get(act.act_num);
        if (!current) {
            byActNum.set(act.act_num, {
                ...act,
                relevances: [...act.relevances],
            });
            order.push(act.act_num);
            continue;
        }
        for (const rel of act.relevances) {
            const found = current.relevances.find(
                (r) => r.search_key === rel.search_key
            );
            if (!found) {
                current.relevances.push({ ...rel });
            } else if (rel.score > found.score) {
                found.score = rel.score;
            }
        }
    }

    return order.flatMap((actNum) => {
        const act = byActNum.get(actNum);
        return act ? [act] : [];
    });
}

export function useSearchResults(): UseSearchResultsReturn {
    const [results, setResults] = useState<LegislativeAct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMoreResults, setHasMoreResults] = useState(true);
    const [offset, setOffset] = useState(0);

    const searchAPI = useCallback(
        async (params: SearchParams, currentOffset: number) => {
            const response = await fetch("api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    states: params.states,
                    from_year: params.fromYear,
                    to_year: params.toYear,
                    search_keys: params.searchKeys,
                    limit: params.limit,
                    offset: currentOffset,
                }),
            });

            if (!response.ok) {
                throw new Error("Search request failed");
            }

            return response.json();
        },
        []
    );

    const performSearch = useCallback(
        async (params: SearchParams) => {
            if (params.searchKeys.length === 0) {
                setResults([]);
                setOffset(0);
                setHasMoreResults(true);
                return;
            }

            setIsLoading(true);
            try {
                const data = await searchAPI(params, 0);
                setResults(mergeResults([], data));
                setOffset(data.length);
                setHasMoreResults(data.length === params.limit);
            } catch (error) {
                console.error("Error performing search:", error);
                setResults([]);
                setOffset(0);
                setHasMoreResults(false);
            } finally {
                setIsLoading(false);
            }
        },
        [searchAPI]
    );

    const loadMore = useCallback(
        async (params: SearchParams) => {
            if (!hasMoreResults || params.searchKeys.length === 0) return;

            try {
                const data = await searchAPI(params, offset);
                setResults((prev) => mergeResults(prev, data));
                setOffset((prev) => prev + data.length);
                setHasMoreResults(data.length === params.limit);
            } catch (error) {
                console.error("Error loading more results:", error);
                setHasMoreResults(false);
            }
        },
        [searchAPI, offset, hasMoreResults]
    );

    const clearResults = useCallback(() => {
        setResults([]);
        setOffset(0);
        setHasMoreResults(true);
    }, []);

    return {
        results,
        isLoading,
        hasMoreResults,
        performSearch,
        loadMore,
        clearResults,
    };
}
