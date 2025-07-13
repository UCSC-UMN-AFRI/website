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
    Moon,
    Sun,
} from "lucide-react";
import search_keys, {
    initializeLocalSemanticSearch,
    getExpandedKeywords,
} from "./keywords";
import { motion, AnimatePresence } from "framer-motion";

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
    const [debouncedYearRange, setDebouncedYearRange] = useState(yearRange);

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

    // Debounce year range changes
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedYearRange(yearRange);
        }, 750);

        return () => clearTimeout(timer);
    }, [yearRange]);

    // Auto-search effect
    useEffect(() => {
        if (keywords.length > 0) {
            handleSearch(true);
        } else {
            setResults([]);
            setOffset(0);
            setHasMoreResults(true);
        }
    }, [
        expandedKeywords,
        selectedStates,
        debouncedYearRange.min,
        debouncedYearRange.max,
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

    // Dark mode state - simplified to just light/dark toggle
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("darkMode");
            return saved ? JSON.parse(saved) : false;
        }
        return false;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("darkMode", JSON.stringify(darkMode));
    }, [darkMode]);

    return (
        <div
            className={`min-h-screen transition-colors duration-200 ${
                darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
            }`}
        >
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

                    .dark-mode .slider::-webkit-slider-thumb {
                        background: #60a5fa;
                        border: 2px solid #374151;
                    }

                    .dark-mode .slider::-moz-range-thumb {
                        background: #60a5fa;
                        border: 2px solid #374151;
                    }
                `}
            </style>
            {/* Header */}
            <header
                className={`shadow-sm transition-colors duration-200 ${
                    darkMode ? "bg-gray-800" : "bg-white"
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
                    <h1
                        className={`text-3xl font-bold ${
                            darkMode ? "text-white" : "text-gray-900"
                        }`}
                    >
                        Legislative Database Search
                    </h1>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`p-2 rounded-full transition-colors duration-200 ${
                            darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                        }`}
                        aria-label="Toggle dark mode"
                    >
                        {darkMode ? (
                            <Sun className="h-5 w-5 text-gray-300" />
                        ) : (
                            <Moon className="h-5 w-5 text-gray-700" />
                        )}
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Search Filters */}
                <div
                    className={`rounded-lg shadow-md p-6 mb-8 transition-colors duration-200 ${
                        darkMode ? "bg-gray-800" : "bg-white"
                    }`}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Keyword Search */}
                        <div className="space-y-2" ref={keywordDropdownRef}>
                            <label
                                className={`block text-sm font-medium ${
                                    darkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                            >
                                Keywords
                            </label>
                            <div className="relative">
                                <Search
                                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                                        darkMode
                                            ? "text-gray-500"
                                            : "text-gray-400"
                                    }`}
                                />
                                <input
                                    type="text"
                                    value={currentKeyword}
                                    onChange={handleKeywordChange}
                                    onKeyPress={handleKeywordKeyPress}
                                    onFocus={() =>
                                        setIsKeywordDropdownOpen(true)
                                    }
                                    className={`pl-10 w-full rounded-md border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                                        darkMode
                                            ? "border-gray-600 bg-gray-700 text-white"
                                            : "border-gray-300 bg-white text-gray-900"
                                    }`}
                                    placeholder="Search keywords..."
                                />
                                <button
                                    onClick={() => addKeyword()}
                                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                                        darkMode
                                            ? "text-gray-500 hover:text-gray-300"
                                            : "text-gray-400 hover:text-gray-600"
                                    }`}
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>
                            {isKeywordDropdownOpen &&
                                filteredKeywords.length > 0 && (
                                    <div
                                        className={`absolute z-10 mt-1 w-full border rounded-md shadow-lg max-h-60 overflow-auto ${
                                            darkMode
                                                ? "bg-gray-800 border-gray-700"
                                                : "bg-white border-gray-200"
                                        }`}
                                    >
                                        <ul className="py-1">
                                            {filteredKeywords.map((keyword) => (
                                                <li
                                                    key={keyword}
                                                    className={`px-3 py-2 cursor-pointer transition-colors duration-200 ${
                                                        darkMode
                                                            ? "text-white hover:bg-gray-700"
                                                            : "text-gray-900 hover:bg-blue-50"
                                                    }`}
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
                                        className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded disabled:opacity-50 ${
                                            darkMode
                                                ? "border-gray-600"
                                                : "border-gray-300"
                                        }`}
                                    />
                                    <label
                                        htmlFor="semantic-expansion"
                                        className={`ml-2 text-sm ${
                                            darkMode
                                                ? "text-gray-300"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        <span className="flex items-center">
                                            <Brain className="h-4 w-4 mr-1" />
                                            Semantic expansion
                                        </span>
                                    </label>
                                    {isSemanticSearchPending &&
                                        isSemanticExpansionEnabled && (
                                            <Loader2
                                                className={`h-4 w-4 animate-spin ml-2 ${
                                                    darkMode
                                                        ? "text-blue-400"
                                                        : "text-blue-600"
                                                }`}
                                            />
                                        )}
                                </div>

                                <div className="group relative">
                                    <Info
                                        className={`h-4 w-4 cursor-help transition-colors duration-200 ${
                                            darkMode
                                                ? "text-gray-500 hover:text-gray-300"
                                                : "text-gray-400 hover:text-gray-600"
                                        }`}
                                    />
                                    <div
                                        className={`invisible group-hover:visible absolute z-20 w-64 p-2 mt-1 text-xs text-white rounded shadow-lg -translate-x-1/2 left-1/2 ${
                                            darkMode
                                                ? "bg-gray-700"
                                                : "bg-gray-900"
                                        }`}
                                    >
                                        Automatically finds related keywords to
                                        expand your search
                                    </div>
                                </div>
                            </div>

                            {/* Similarity Threshold Slider */}
                            {isSemanticExpansionEnabled && (
                                <div className="mt-3 space-y-4">
                                    <div className="space-y-2">
                                        <label
                                            className={`block text-sm font-medium ${
                                                darkMode
                                                    ? "text-gray-300"
                                                    : "text-gray-700"
                                            }`}
                                        >
                                            Similarity threshold:{" "}
                                            {semanticThreshold.toFixed(2)}
                                        </label>
                                        <div className="flex items-center space-x-3">
                                            <span
                                                className={`text-xs ${
                                                    darkMode
                                                        ? "text-gray-400"
                                                        : "text-gray-500"
                                                }`}
                                            >
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
                                                className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer slider ${
                                                    darkMode
                                                        ? "bg-gray-600"
                                                        : "bg-gray-200"
                                                }`}
                                                disabled={false}
                                            />
                                            <span
                                                className={`text-xs ${
                                                    darkMode
                                                        ? "text-gray-400"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                Strict
                                            </span>
                                        </div>
                                        <div
                                            className={`text-xs ${
                                                darkMode
                                                    ? "text-gray-400"
                                                    : "text-gray-500"
                                            }`}
                                        >
                                            Lower values = more but less similar
                                            keywords • Higher values = fewer but
                                            more similar keywords
                                        </div>
                                    </div>

                                    {/* Max Results Control */}
                                    <div className="space-y-2">
                                        <label
                                            className={`block text-sm font-medium ${
                                                darkMode
                                                    ? "text-gray-300"
                                                    : "text-gray-700"
                                            }`}
                                        >
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
                                                className={`rounded-md border py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                                                    darkMode
                                                        ? "border-gray-600 bg-gray-700 text-white"
                                                        : "border-gray-300 bg-white text-gray-900"
                                                }`}
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                            <div
                                                className={`text-xs ${
                                                    darkMode
                                                        ? "text-gray-400"
                                                        : "text-gray-500"
                                                }`}
                                            >
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
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                            darkMode
                                                ? "bg-blue-900 text-blue-200"
                                                : "bg-blue-100 text-blue-800"
                                        }`}
                                    >
                                        {keyword}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeKeyword(keyword)
                                            }
                                            className={`ml-1.5 inline-flex items-center justify-center transition-colors duration-200 ${
                                                darkMode
                                                    ? "hover:text-blue-400"
                                                    : "hover:text-blue-600"
                                            }`}
                                        >
                                            <X
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            {/* Expanded Keywords Display */}
                            {isSemanticExpansionEnabled &&
                                expandedKeywords.length > keywords.length && (
                                    <div
                                        className={`mt-3 p-3 rounded-md ${
                                            darkMode
                                                ? "bg-blue-900/30"
                                                : "bg-blue-50"
                                        }`}
                                    >
                                        <div
                                            className={`text-sm font-medium mb-2 flex items-center ${
                                                darkMode
                                                    ? "text-blue-200"
                                                    : "text-blue-800"
                                            }`}
                                        >
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
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                                                            darkMode
                                                                ? "bg-blue-800 text-blue-200"
                                                                : "bg-blue-200 text-blue-700"
                                                        }`}
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
                                <label
                                    className={`block text-sm font-medium ${
                                        darkMode
                                            ? "text-gray-300"
                                            : "text-gray-700"
                                    }`}
                                >
                                    States
                                </label>
                                <span
                                    className={`text-sm ${
                                        darkMode
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                    }`}
                                >
                                    {selectedStates.length} of {states.length}{" "}
                                    selected
                                </span>
                            </div>
                            <div className="relative">
                                <MapPin
                                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                                        darkMode
                                            ? "text-gray-500"
                                            : "text-gray-400"
                                    }`}
                                />
                                <input
                                    type="text"
                                    value={stateSearch}
                                    onChange={(e) => {
                                        setStateSearch(e.target.value);
                                        setIsStateDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsStateDropdownOpen(true)}
                                    className={`pl-10 w-full rounded-md border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                                        darkMode
                                            ? "border-gray-600 bg-gray-700 text-white"
                                            : "border-gray-300 bg-white text-gray-900"
                                    }`}
                                    placeholder="Search states..."
                                />
                                {isStateDropdownOpen &&
                                    filteredStates.length > 0 && (
                                        <div
                                            className={`absolute z-10 mt-1 w-full border rounded-md shadow-lg max-h-60 overflow-auto ${
                                                darkMode
                                                    ? "bg-gray-800 border-gray-700"
                                                    : "bg-white border-gray-200"
                                            }`}
                                        >
                                            <ul className="py-1">
                                                {filteredStates.map((state) => (
                                                    <li
                                                        key={state}
                                                        className={`px-3 py-2 cursor-pointer transition-colors duration-200 ${
                                                            darkMode
                                                                ? "text-white hover:bg-gray-700"
                                                                : "text-gray-900 hover:bg-blue-50"
                                                        }`}
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
                                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                                        darkMode
                                            ? "text-blue-300 bg-blue-900/30 hover:bg-blue-800/30"
                                            : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                                    }`}
                                >
                                    <CheckSquare className="h-4 w-4 mr-1.5" />
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearAllStates}
                                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 ${
                                        darkMode
                                            ? "text-gray-300 bg-gray-700 hover:bg-gray-600"
                                            : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                                    }`}
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
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                            darkMode
                                                ? "bg-blue-900 text-blue-200"
                                                : "bg-blue-100 text-blue-800"
                                        }`}
                                    >
                                        {state}
                                        <button
                                            type="button"
                                            onClick={() => removeState(state)}
                                            className={`ml-1.5 inline-flex items-center justify-center transition-colors duration-200 ${
                                                darkMode
                                                    ? "hover:text-blue-400"
                                                    : "hover:text-blue-600"
                                            }`}
                                        >
                                            <X
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Year Range */}
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label
                                className={`block text-sm font-medium ${
                                    darkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                            >
                                Year Range
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <Calendar
                                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                                            darkMode
                                                ? "text-gray-500"
                                                : "text-gray-400"
                                        }`}
                                    />
                                    <input
                                        type="number"
                                        value={yearRange.min}
                                        onChange={(e) =>
                                            setYearRange({
                                                ...yearRange,
                                                min: parseInt(e.target.value),
                                            })
                                        }
                                        className={`pl-10 w-full rounded-md border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                                            darkMode
                                                ? "border-gray-600 bg-gray-700 text-white"
                                                : "border-gray-300 bg-white text-gray-900"
                                        }`}
                                        placeholder="From year"
                                    />
                                </div>
                                <div className="relative">
                                    <Calendar
                                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                                            darkMode
                                                ? "text-gray-500"
                                                : "text-gray-400"
                                        }`}
                                    />
                                    <input
                                        type="number"
                                        value={yearRange.max}
                                        onChange={(e) =>
                                            setYearRange({
                                                ...yearRange,
                                                max: parseInt(e.target.value),
                                            })
                                        }
                                        className={`pl-10 w-full rounded-md border py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                                            darkMode
                                                ? "border-gray-600 bg-gray-700 text-white"
                                                : "border-gray-300 bg-white text-gray-900"
                                        }`}
                                        placeholder="To year"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <label
                                className={`text-sm font-medium ${
                                    darkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                            >
                                Results per load:
                            </label>
                            <select
                                value={resultsPerLoad}
                                onChange={(e) =>
                                    handleResultsPerLoadChange(
                                        Number(e.target.value)
                                    )
                                }
                                className={`rounded-md border py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                                    darkMode
                                        ? "border-gray-600 bg-gray-700 text-white"
                                        : "border-gray-300 bg-white text-gray-900"
                                }`}
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
                            className={`text-white px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center space-x-2 ${
                                darkMode
                                    ? "bg-blue-500 hover:bg-blue-600"
                                    : "bg-blue-600 hover:bg-blue-700"
                            } ${
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
                <div
                    className={`rounded-lg shadow-md transition-colors duration-200 ${
                        darkMode ? "bg-gray-800" : "bg-white"
                    }`}
                >
                    <div
                        className={`px-6 py-4 border-b ${
                            darkMode ? "border-gray-700" : "border-gray-200"
                        }`}
                    >
                        <h2
                            className={`text-lg font-semibold ${
                                darkMode ? "text-white" : "text-gray-900"
                            }`}
                        >
                            Search Results
                        </h2>
                        {results.length > 0 && (
                            <p
                                className={`text-sm mt-1 ${
                                    darkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                            >
                                Showing {results.length} results{" "}
                                {hasMoreResults ? "(scroll down for more)" : ""}
                            </p>
                        )}
                    </div>
                    {isLoading ? (
                        <div className="space-y-4 p-6">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="animate-pulse flex space-x-4"
                                >
                                    <div className="flex-1 space-y-6 py-1">
                                        <div
                                            className={`h-4 rounded w-3/4 ${
                                                darkMode
                                                    ? "bg-gray-600"
                                                    : "bg-gray-300"
                                            }`}
                                        ></div>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div
                                                    className={`h-3 rounded col-span-2 ${
                                                        darkMode
                                                            ? "bg-gray-600"
                                                            : "bg-gray-300"
                                                    }`}
                                                ></div>
                                                <div
                                                    className={`h-3 rounded col-span-1 ${
                                                        darkMode
                                                            ? "bg-gray-600"
                                                            : "bg-gray-300"
                                                    }`}
                                                ></div>
                                            </div>
                                            <div
                                                className={`h-3 rounded ${
                                                    darkMode
                                                        ? "bg-gray-600"
                                                        : "bg-gray-300"
                                                }`}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            className={`divide-y ${
                                darkMode ? "divide-gray-700" : "divide-gray-200"
                            }`}
                        >
                            <AnimatePresence>
                                {results.map((result) => (
                                    <motion.div
                                        key={result.act_num}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`p-6 transition-colors duration-200 ${
                                            darkMode
                                                ? "hover:bg-gray-700"
                                                : "hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3
                                                    className={`text-lg font-medium ${
                                                        darkMode
                                                            ? "text-white"
                                                            : "text-gray-900"
                                                    }`}
                                                >
                                                    <a
                                                        href={result.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`transition-colors duration-200 ${
                                                            darkMode
                                                                ? "hover:text-blue-400"
                                                                : "hover:text-blue-600"
                                                        }`}
                                                    >
                                                        {result.name}
                                                    </a>
                                                </h3>
                                                <div
                                                    className={`mt-2 flex items-center space-x-4 text-sm ${
                                                        darkMode
                                                            ? "text-gray-400"
                                                            : "text-gray-500"
                                                    }`}
                                                >
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
                                                            className={`text-sm transition-colors duration-200 ${
                                                                darkMode
                                                                    ? "text-blue-400 hover:text-blue-300"
                                                                    : "text-blue-600 hover:text-blue-800"
                                                            }`}
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
                                                            className={`flex items-center text-sm ${
                                                                darkMode
                                                                    ? "text-gray-300"
                                                                    : "text-gray-600"
                                                            }`}
                                                        >
                                                            <Star
                                                                className={`h-4 w-4 mr-1 ${
                                                                    darkMode
                                                                        ? "text-yellow-400"
                                                                        : "text-yellow-500"
                                                                }`}
                                                            />
                                                            {relevance.score}
                                                            <span
                                                                className={`ml-2 px-2 py-0.5 rounded ${
                                                                    darkMode
                                                                        ? "bg-gray-700 text-gray-300"
                                                                        : "bg-gray-100 text-gray-700"
                                                                }`}
                                                            >
                                                                {
                                                                    relevance.search_key
                                                                }
                                                            </span>
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {results.length === 0 && !isLoading && (
                                <div
                                    className={`p-6 text-center ${
                                        darkMode
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                    }`}
                                >
                                    No results found. Try adjusting your search
                                    criteria.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Loading More Indicator */}
                    {loadingMore && (
                        <div
                            className={`px-6 py-4 border-t ${
                                darkMode ? "border-gray-700" : "border-gray-200"
                            }`}
                        >
                            <div className="flex justify-center items-center space-x-2">
                                <Loader2
                                    className={`h-5 w-5 animate-spin ${
                                        darkMode
                                            ? "text-blue-400"
                                            : "text-blue-600"
                                    }`}
                                />
                                <span
                                    className={`text-sm ${
                                        darkMode
                                            ? "text-gray-400"
                                            : "text-gray-600"
                                    }`}
                                >
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
