import { useState, useRef, useEffect } from "react";
import {
    Search,
    Calendar,
    MapPin,
    BookOpen,
    X,
    CheckSquare,
    XSquare,
    Plus,
    Star,
    Loader2,
    Brain,
    Info,
} from "lucide-react";
import search_keys, {
    initializeLocalSemanticSearch,
    getExpandedKeywords,
} from "./keywords";

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

function App() {
    const [yearRange, setYearRange] = useState({
        min: 1975,
        max: new Date().getFullYear(),
    });
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [stateSearch, setStateSearch] = useState("");
    const [keywords, setKeywords] = useState<string[]>([]);
    const [currentKeyword, setCurrentKeyword] = useState("");
    const [filteredKeywords, setFilteredKeywords] = useState<string[]>([]);
    const [isKeywordDropdownOpen, setIsKeywordDropdownOpen] = useState(false);
    const keywordDropdownRef = useRef<HTMLDivElement>(null);
    const [results, setResults] = useState<LegislativeAct[]>([]);
    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
    const stateDropdownRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Semantic search states
    const [isSemanticExpansionEnabled, setIsSemanticExpansionEnabled] =
        useState(false);
    const [expandedKeywords, setExpandedKeywords] = useState<string[]>([]);
    const [semanticThreshold, setSemanticThreshold] = useState(0.65);
    const [debouncedSemanticThreshold, setDebouncedSemanticThreshold] =
        useState(0.65);
    const [maxResults, setMaxResults] = useState(10);
    const [debouncedMaxResults, setDebouncedMaxResults] = useState(10);
    const [isSemanticSearchPending, setIsSemanticSearchPending] =
        useState(false);

    // Infinite scroll states
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMoreResults, setHasMoreResults] = useState(true);
    const [offset, setOffset] = useState(0);
    const [resultsPerLoad, setResultsPerLoad] = useState(20);

    // Initialize semantic search (server-side is always ready)
    useEffect(() => {
        initializeLocalSemanticSearch();
    }, []);

    // Debounce semantic threshold changes to avoid excessive API calls
    useEffect(() => {
        if (semanticThreshold !== debouncedSemanticThreshold) {
            setIsSemanticSearchPending(true);
        }

        const timer = setTimeout(() => {
            setDebouncedSemanticThreshold(semanticThreshold);
            setIsSemanticSearchPending(false);
        }, 750); // 750ms delay

        return () => clearTimeout(timer);
    }, [semanticThreshold, debouncedSemanticThreshold]);

    // Debounce max results changes to avoid excessive API calls
    useEffect(() => {
        if (maxResults !== debouncedMaxResults) {
            setIsSemanticSearchPending(true);
        }

        const timer = setTimeout(() => {
            setDebouncedMaxResults(maxResults);
            setIsSemanticSearchPending(false);
        }, 750); // 750ms delay

        return () => clearTimeout(timer);
    }, [maxResults, debouncedMaxResults]);

    // Update expanded keywords when semantic expansion is enabled and keywords change
    useEffect(() => {
        const updateExpandedKeywords = async () => {
            if (isSemanticExpansionEnabled && keywords.length > 0) {
                try {
                    const expanded = await getExpandedKeywords(
                        keywords,
                        debouncedSemanticThreshold,
                        debouncedMaxResults
                    );
                    setExpandedKeywords(expanded);
                } catch (error) {
                    console.error("Error expanding keywords:", error);
                    setExpandedKeywords(keywords);
                }
            } else {
                setExpandedKeywords([]);
            }
        };

        updateExpandedKeywords();
    }, [
        keywords,
        isSemanticExpansionEnabled,
        debouncedSemanticThreshold,
        debouncedMaxResults,
    ]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                stateDropdownRef.current &&
                !stateDropdownRef.current.contains(event.target as Node)
            ) {
                setIsStateDropdownOpen(false);
            }
            if (
                keywordDropdownRef.current &&
                !keywordDropdownRef.current.contains(event.target as Node)
            ) {
                setIsKeywordDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Scroll detection for infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop + 100 >=
                    document.documentElement.offsetHeight &&
                !loadingMore &&
                !isLoading &&
                hasMoreResults &&
                results.length > 0
            ) {
                loadMoreResults();
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [loadingMore, isLoading, hasMoreResults, results.length]);

    const handleSearch = async (isNewSearch = true) => {
        // Prevent search if no keywords are entered
        if (keywords.length === 0) {
            console.log("Search prevented: No keywords provided.");
            setResults([]); // Clear previous results
            setOffset(0);
            setHasMoreResults(true);
            return;
        }

        if (isNewSearch) {
            setIsLoading(true);
            setOffset(0);
            setHasMoreResults(true);
        }

        const searchOffset = isNewSearch ? 0 : offset;

        try {
            // Use expanded keywords if semantic expansion is enabled
            const searchKeys =
                isSemanticExpansionEnabled && expandedKeywords.length > 0
                    ? expandedKeywords
                    : keywords;

            const response = await fetch("api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    states: selectedStates,
                    from_year: yearRange.min,
                    to_year: yearRange.max,
                    search_keys: searchKeys,
                    limit: resultsPerLoad,
                    offset: searchOffset,
                }),
            });
            const data = await response.json();

            if (isNewSearch) {
                setResults(data);
            } else {
                setResults((prevResults) => [...prevResults, ...data]);
            }

            // If we got fewer results than requested, we've reached the end
            setHasMoreResults(data.length === resultsPerLoad);
            setOffset(searchOffset + data.length);
        } catch (error) {
            console.error("Error fetching results:", error);
            if (isNewSearch) {
                setResults([]);
            }
        } finally {
            if (isNewSearch) {
                setIsLoading(false);
            }
        }
    };

    const loadMoreResults = async () => {
        if (loadingMore || !hasMoreResults || keywords.length === 0) return;

        setLoadingMore(true);
        try {
            await handleSearch(false);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleResultsPerLoadChange = (value: number) => {
        setResultsPerLoad(value);
    };

    const states = [
        "AL",
        "AK",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "DC",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
    ];

    const filteredStates = states.filter(
        (state) =>
            !selectedStates.includes(state) &&
            state.toLowerCase().includes(stateSearch.toLowerCase())
    );

    const handleStateSelect = (state: string) => {
        if (!selectedStates.includes(state)) {
            setSelectedStates([...selectedStates, state]);
            setStateSearch("");
        }
    };

    const removeState = (state: string) => {
        setSelectedStates(selectedStates.filter((s) => s !== state));
    };

    const handleSelectAllStates = () => {
        setSelectedStates([...states]);
        setStateSearch("");
        setIsStateDropdownOpen(false);
    };

    const handleClearAllStates = () => {
        setSelectedStates([]);
        setStateSearch("");
        setIsStateDropdownOpen(false);
    };

    const filterKeywords = (input: string) => {
        const filtered = search_keys.filter(
            (keyword) =>
                keyword.toLowerCase().includes(input.toLowerCase()) &&
                !keywords.includes(keyword)
        );
        setFilteredKeywords(filtered);
    };

    const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCurrentKeyword(value);
        filterKeywords(value);
        setIsKeywordDropdownOpen(true);
    };

    const addKeyword = (keyword?: string) => {
        const keywordToAdd = keyword || currentKeyword.trim();
        if (keywordToAdd && !keywords.includes(keywordToAdd)) {
            setKeywords([...keywords, keywordToAdd]);
            setCurrentKeyword("");
            setFilteredKeywords([]);
            setIsKeywordDropdownOpen(false);
        }
    };

    const removeKeyword = (keyword: string) => {
        setKeywords(keywords.filter((k) => k !== keyword));
    };

    const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addKeyword();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <style>
                {`
                    .slider::-webkit-slider-thumb {
                        appearance: none;
                        height: 16px;
                        width: 16px;
                        border-radius: 50%;
                        background: #3b82f6;
                        cursor: pointer;
                        border: 2px solid #ffffff;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }

                    .slider::-moz-range-thumb {
                        height: 16px;
                        width: 16px;
                        border-radius: 50%;
                        background: #3b82f6;
                        cursor: pointer;
                        border: 2px solid #ffffff;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }

                    .slider:disabled::-webkit-slider-thumb {
                        background: #9ca3af;
                        cursor: not-allowed;
                    }

                    .slider:disabled::-moz-range-thumb {
                        background: #9ca3af;
                        cursor: not-allowed;
                    }
                `}
            </style>
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Legislative Database Search
                    </h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Search Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Keyword Search */}
                        <div className="space-y-2" ref={keywordDropdownRef}>
                            <label className="block text-sm font-medium text-gray-700">
                                Keywords
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    value={currentKeyword}
                                    onChange={handleKeywordChange}
                                    onKeyPress={handleKeywordKeyPress}
                                    onFocus={() =>
                                        setIsKeywordDropdownOpen(true)
                                    }
                                    className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Search keywords..."
                                />
                                <button
                                    onClick={() => addKeyword()}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>
                            {isKeywordDropdownOpen &&
                                filteredKeywords.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                                        <ul className="py-1">
                                            {filteredKeywords.map((keyword) => (
                                                <li
                                                    key={keyword}
                                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-gray-900"
                                                    onClick={() =>
                                                        addKeyword(keyword)
                                                    }
                                                >
                                                    {keyword}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                            {/* Semantic Expansion Toggle */}
                            <div className="flex items-center space-x-2 mt-3">
                                <div className="flex items-center">
                                    <input
                                        id="semantic-expansion"
                                        type="checkbox"
                                        checked={isSemanticExpansionEnabled}
                                        onChange={(e) =>
                                            setIsSemanticExpansionEnabled(
                                                e.target.checked
                                            )
                                        }
                                        disabled={false}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                                    />
                                    <label
                                        htmlFor="semantic-expansion"
                                        className="ml-2 text-sm text-gray-700"
                                    >
                                        <span className="flex items-center">
                                            <Brain className="h-4 w-4 mr-1" />
                                            Semantic expansion
                                        </span>
                                    </label>
                                    {isSemanticSearchPending &&
                                        isSemanticExpansionEnabled && (
                                            <Loader2 className="h-4 w-4 animate-spin text-blue-600 ml-2" />
                                        )}
                                </div>

                                <div className="group relative">
                                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                                    <div className="invisible group-hover:visible absolute z-20 w-64 p-2 mt-1 text-xs bg-gray-900 text-white rounded shadow-lg -translate-x-1/2 left-1/2">
                                        Automatically finds related keywords to
                                        expand your search
                                    </div>
                                </div>
                            </div>

                            {/* Similarity Threshold Slider */}
                            {isSemanticExpansionEnabled && (
                                <div className="mt-3 space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Similarity threshold:{" "}
                                            {semanticThreshold.toFixed(2)}
                                        </label>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xs text-gray-500">
                                                Broad
                                            </span>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="0.8"
                                                step="0.05"
                                                value={semanticThreshold}
                                                onChange={(e) =>
                                                    setSemanticThreshold(
                                                        parseFloat(
                                                            e.target.value
                                                        )
                                                    )
                                                }
                                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                                disabled={false}
                                            />
                                            <span className="text-xs text-gray-500">
                                                Strict
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Lower values = more but less similar
                                            keywords • Higher values = fewer but
                                            more similar keywords
                                        </div>
                                    </div>

                                    {/* Max Results Control */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Max similar keywords per term:
                                        </label>
                                        <div className="flex items-center space-x-3">
                                            <select
                                                value={maxResults}
                                                onChange={(e) =>
                                                    setMaxResults(
                                                        parseInt(e.target.value)
                                                    )
                                                }
                                                disabled={false}
                                                className="rounded-md border border-gray-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                            <div className="text-xs text-gray-500">
                                                Controls how many similar
                                                keywords to find for each search
                                                term
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Keywords Pills */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {keywords.map((keyword) => (
                                    <span
                                        key={keyword}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                    >
                                        {keyword}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeKeyword(keyword)
                                            }
                                            className="ml-1.5 inline-flex items-center justify-center"
                                        >
                                            <X
                                                className="h-4 w-4 hover:text-blue-900"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            {/* Expanded Keywords Display */}
                            {isSemanticExpansionEnabled &&
                                expandedKeywords.length > keywords.length && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                                        <div className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                                            <Brain className="h-4 w-4 mr-1" />
                                            Expanded search terms (
                                            {expandedKeywords.length -
                                                keywords.length}{" "}
                                            additional):
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {expandedKeywords
                                                .filter(
                                                    (keyword) =>
                                                        !keywords.includes(
                                                            keyword
                                                        )
                                                )
                                                .map((keyword) => (
                                                    <span
                                                        key={keyword}
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-200 text-blue-700"
                                                    >
                                                        {keyword}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* State Selection */}
                        <div className="space-y-2" ref={stateDropdownRef}>
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700">
                                    States
                                </label>
                                <span className="text-sm text-gray-500">
                                    {selectedStates.length} of {states.length}{" "}
                                    selected
                                </span>
                            </div>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    value={stateSearch}
                                    onChange={(e) => {
                                        setStateSearch(e.target.value);
                                        setIsStateDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsStateDropdownOpen(true)}
                                    className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Search states..."
                                />
                                {isStateDropdownOpen &&
                                    filteredStates.length > 0 && (
                                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                                            <ul className="py-1">
                                                {filteredStates.map((state) => (
                                                    <li
                                                        key={state}
                                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-gray-900"
                                                        onClick={() =>
                                                            handleStateSelect(
                                                                state
                                                            )
                                                        }
                                                    >
                                                        {state}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                            </div>
                            <div className="flex gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAllStates}
                                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <CheckSquare className="h-4 w-4 mr-1.5" />
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearAllStates}
                                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    <XSquare className="h-4 w-4 mr-1.5" />
                                    Clear All
                                </button>
                            </div>
                            {/* Selected States Pills */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedStates.map((state) => (
                                    <span
                                        key={state}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                    >
                                        {state}
                                        <button
                                            type="button"
                                            onClick={() => removeState(state)}
                                            className="ml-1.5 inline-flex items-center justify-center"
                                        >
                                            <X
                                                className="h-4 w-4 hover:text-blue-900"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Year Range */}
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Year Range
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="number"
                                        value={yearRange.min}
                                        onChange={(e) =>
                                            setYearRange({
                                                ...yearRange,
                                                min: parseInt(e.target.value),
                                            })
                                        }
                                        className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="From year"
                                    />
                                </div>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="number"
                                        value={yearRange.max}
                                        onChange={(e) =>
                                            setYearRange({
                                                ...yearRange,
                                                max: parseInt(e.target.value),
                                            })
                                        }
                                        className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="To year"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700">
                                Results per load:
                            </label>
                            <select
                                value={resultsPerLoad}
                                onChange={(e) =>
                                    handleResultsPerLoadChange(
                                        Number(e.target.value)
                                    )
                                }
                                className="rounded-md border border-gray-300 py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <button
                            onClick={() => handleSearch(true)}
                            disabled={keywords.length === 0 || isLoading}
                            className={`bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center space-x-2 ${
                                keywords.length === 0 || isLoading
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Searching...</span>
                                </>
                            ) : (
                                "Search"
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Search Results
                        </h2>
                        {results.length > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                                Showing {results.length} results
                                {hasMoreResults
                                    ? " (scroll down for more)"
                                    : ""}
                            </p>
                        )}
                    </div>
                    {isLoading ? (
                        <div className="p-12 flex justify-center items-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {results.map((result) => (
                                <div
                                    key={result.act_num}
                                    className="p-6 hover:bg-gray-50"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">
                                                <a
                                                    href={result.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-blue-600"
                                                >
                                                    {result.name}
                                                </a>
                                            </h3>
                                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <BookOpen className="h-4 w-4 mr-1" />
                                                    {result.act_num}
                                                </span>
                                                <span className="flex items-center">
                                                    <MapPin className="h-4 w-4 mr-1" />
                                                    {result.state}
                                                </span>
                                                <span className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    {result.year}
                                                </span>
                                                <span className="flex items-center">
                                                    <a
                                                        href={
                                                            result.backup_link
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                    >
                                                        PDF Backup
                                                    </a>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end space-y-2">
                                            {result.relevances.map(
                                                (relevance, index) => (
                                                    <span
                                                        key={index}
                                                        className="flex items-center text-sm text-gray-600"
                                                    >
                                                        <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                                        {relevance.score}
                                                        <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                                            {
                                                                relevance.search_key
                                                            }
                                                        </span>
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {results.length === 0 && !isLoading && (
                                <div className="p-6 text-center text-gray-500">
                                    No results found. Try adjusting your search
                                    criteria.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Loading More Indicator */}
                    {loadingMore && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex justify-center items-center space-x-2">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                <span className="text-sm text-gray-600">
                                    Loading more results...
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
