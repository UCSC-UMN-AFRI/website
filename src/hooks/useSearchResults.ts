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
    sort: string; // NEW FIELD
}

interface UseSearchResultsReturn {
    results: LegislativeAct[];
    isLoading: boolean;
    hasMoreResults: boolean;
    performSearch: (params: SearchParams) => Promise<void>;
    loadMore: (params: SearchParams) => Promise<void>;
    clearResults: () => void;
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
                    sort: params.sort, // Send the sort to Python
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
                setResults(data);
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
                setResults((prev) => [...prev, ...data]);
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
