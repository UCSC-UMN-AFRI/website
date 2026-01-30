import { useState, useRef, useEffect, useCallback } from "react";
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
    ChevronUp,
    ListFilter,
    FileText,
    Gavel
} from "lucide-react";
import search_keys, {
    initializeLocalSemanticSearch,
    getExpandedKeywords,
} from "./keywords";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchResults } from "./hooks/useSearchResults";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";

// Sort Types
type SortOption = 'relevance' | 'recent' | 'oldest';

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
    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
    const stateDropdownRef = useRef<HTMLDivElement>(null);
    
    // Sort State
    const [sortBy, setSortBy] = useState<SortOption>('relevance');

    const [isSemanticExpansionEnabled, setIsSemanticExpansionEnabled] = useState(false);
    const [expandedKeywords, setExpandedKeywords] = useState<string[]>([]);
    const [semanticThreshold, setSemanticThreshold] = useState(0.65);
    const [debouncedSemanticThreshold, setDebouncedSemanticThreshold] = useState(0.65);
    const [maxResults, setMaxResults] = useState(10);
    const [debouncedMaxResults, setDebouncedMaxResults] = useState(10);
    const [isSemanticSearchPending, setIsSemanticSearchPending] = useState(false);

    const [resultsPerLoad, setResultsPerLoad] = useState(20);
    const [debouncedYearRange, setDebouncedYearRange] = useState(yearRange);

    const {
        results,
        isLoading,
        hasMoreResults,
        performSearch,
        loadMore,
        clearResults,
    } = useSearchResults();

    const lastSearchRef = useRef<string>("");

    const createSearchParams = useCallback(
        () => ({
            states: selectedStates,
            fromYear: debouncedYearRange.min,
            toYear: debouncedYearRange.max,
            // ADD THIS LINE:
            sort: sortBy,
            // -------------
            searchKeys:
                isSemanticExpansionEnabled && expandedKeywords.length > 0
                    ? expandedKeywords
                    : keywords,
            limit: resultsPerLoad,
        }),
        // ADD sortBy to dependency array
        [
            selectedStates,
            debouncedYearRange,
            isSemanticExpansionEnabled,
            expandedKeywords,
            keywords,
            resultsPerLoad,
            sortBy 
        ]
    );

    const { sentinelRef, isFetchingNextPage } = useInfiniteScroll({
        hasNextPage: hasMoreResults,
        fetchNextPage: async () => {
            const searchParams = createSearchParams();
            await loadMore(searchParams);
        },
        isLoading,
    });

    useEffect(() => {
        initializeLocalSemanticSearch();
    }, []);

    useEffect(() => {
        if (semanticThreshold !== debouncedSemanticThreshold) {
            setIsSemanticSearchPending(true);
        }
        const timer = setTimeout(() => {
            setDebouncedSemanticThreshold(semanticThreshold);
            setIsSemanticSearchPending(false);
        }, 750);
        return () => clearTimeout(timer);
    }, [semanticThreshold, debouncedSemanticThreshold]);

    useEffect(() => {
        if (maxResults !== debouncedMaxResults) {
            setIsSemanticSearchPending(true);
        }
        const timer = setTimeout(() => {
            setDebouncedMaxResults(maxResults);
            setIsSemanticSearchPending(false);
        }, 750);
        return () => clearTimeout(timer);
    }, [maxResults, debouncedMaxResults]);

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
    }, [keywords, isSemanticExpansionEnabled, debouncedSemanticThreshold, debouncedMaxResults]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedYearRange(yearRange);
        }, 750);
        return () => clearTimeout(timer);
    }, [yearRange]);

    useEffect(() => {
        const searchParams = createSearchParams();
        const searchKey = JSON.stringify({
            keywords: searchParams.searchKeys,
            states: searchParams.states,
            fromYear: searchParams.fromYear,
            toYear: searchParams.toYear,
        });

        if (searchKey !== lastSearchRef.current) {
            lastSearchRef.current = searchKey;
            if (keywords.length > 0) {
                performSearch(searchParams);
            } else {
                clearResults();
            }
        }
    }, [keywords, selectedStates, debouncedYearRange, expandedKeywords, isSemanticExpansionEnabled]);

    // --- SORTING LOGIC ---
    // --- SIMPLIFIED SORTING LOGIC ---
    const getSortedResults = () => {

         return results || [];
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
                setIsStateDropdownOpen(false);
            }
            if (keywordDropdownRef.current && !keywordDropdownRef.current.contains(event.target as Node)) {
                setIsKeywordDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async () => {
        const searchParams = createSearchParams();
        await performSearch(searchParams);
    };

    const handleResultsPerLoadChange = (value: number) => setResultsPerLoad(value);

    const states = [
        "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
        "MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
        "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
    ];

    const filteredStates = states.filter(state => 
        !selectedStates.includes(state) && state.toLowerCase().includes(stateSearch.toLowerCase())
    );

    const handleStateSelect = (state: string) => {
        if (!selectedStates.includes(state)) {
            setSelectedStates([...selectedStates, state]);
            setStateSearch("");
        }
    };

    const removeState = (state: string) => setSelectedStates(selectedStates.filter(s => s !== state));

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
            keyword => keyword.toLowerCase().includes(input.toLowerCase()) && !keywords.includes(keyword)
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

    const removeKeyword = (keyword: string) => setKeywords(keywords.filter(k => k !== keyword));

    const handleClearAllKeywords = () => {
        setKeywords([]);
        setCurrentKeyword("");
        setFilteredKeywords([]);
        setExpandedKeywords([]);
        setIsKeywordDropdownOpen(false);
    };

    const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addKeyword();
        }
    };

    const [darkMode, setDarkMode] = useState(() => {
        try {
            const saved = localStorage.getItem("darkMode");
            return saved !== null ? JSON.parse(saved) : false;
        } catch (error) {
            console.error("Error reading darkMode from localStorage:", error);
            return false;
        }
    });
    
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        try {
            localStorage.setItem("darkMode", JSON.stringify(darkMode));
        } catch (error) { console.error(error); }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode((prev: boolean) => !prev);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            setShowBackToTop(scrollTop > 300);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
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
                    .dark .slider::-webkit-slider-thumb { background: #60a5fa; border: 2px solid #374151; }
                `}
            </style>
            <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Legislative Database Search</h1>
                    <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        {darkMode ? <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" /> : <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 transition-colors duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        {/* Keyword Search */}
                        <div className="space-y-2 relative" ref={keywordDropdownRef}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Keywords</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                                <input type="text" value={currentKeyword} onChange={handleKeywordChange} onKeyPress={handleKeywordKeyPress} onFocus={() => setIsKeywordDropdownOpen(true)} className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search keywords..." />
                                <button onClick={() => addKeyword()} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><Plus className="h-5 w-5" /></button>
                            </div>
                            {isKeywordDropdownOpen && filteredKeywords.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full min-w-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                                    <ul className="py-1">{filteredKeywords.map(k => <li key={k} className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer dark:text-white text-sm" onClick={() => addKeyword(k)}>{k}</li>)}</ul>
                                </div>
                            )}

                             {/* Semantic Search Controls */}
                            <div className="flex items-center space-x-2 mt-3">
                                <input id="semantic-expansion" type="checkbox" checked={isSemanticExpansionEnabled} onChange={(e) => setIsSemanticExpansionEnabled(e.target.checked)} className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"/>
                                <label htmlFor="semantic-expansion" className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center"><Brain className="h-4 w-4 mr-1" /> Semantic expansion</label>
                                {isSemanticSearchPending && isSemanticExpansionEnabled && <Loader2 className="h-4 w-4 animate-spin ml-2 text-blue-600" />}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                                {keywords.map(k => <span key={k} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">{k}<button onClick={() => removeKeyword(k)} className="ml-1.5"><X className="h-4 w-4"/></button></span>)}
                                {keywords.length > 0 && <button onClick={handleClearAllKeywords} className="text-sm bg-gray-100 rounded-full px-2 hover:bg-gray-200">Clear</button>}
                            </div>
                        </div>

                         {/* States Dropdown */}
                        <div className="space-y-2 relative" ref={stateDropdownRef}>
                            <div className="flex justify-between"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">States</label></div>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input type="text" value={stateSearch} onChange={(e) => { setStateSearch(e.target.value); setIsStateDropdownOpen(true); }} onFocus={() => setIsStateDropdownOpen(true)} className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3" placeholder="Search states..." maxLength={2}/>
                                {isStateDropdownOpen && filteredStates.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                        <ul className="py-1">{filteredStates.map(s => <li key={s} onClick={() => handleStateSelect(s)} className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer dark:text-white text-sm">{s}</li>)}</ul>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">{selectedStates.map(s => <span key={s} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">{s}<button onClick={() => removeState(s)} className="ml-1.5"><X className="h-4 w-4" /></button></span>)}</div>
                        </div>

                        {/* Date Inputs */}
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year Range</label>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" value={yearRange.min} onChange={(e) => setYearRange({ ...yearRange, min: parseInt(e.target.value) })} className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3" />
                                <input type="number" value={yearRange.max} onChange={(e) => setYearRange({ ...yearRange, max: parseInt(e.target.value) })} className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-4 justify-between items-center border-t pt-4 dark:border-gray-700">
                         <div className="flex items-center space-x-4">
                            {/* SORT DROPDOWN */}
                            <div className="flex items-center space-x-2">
                                <ListFilter className="h-4 w-4 text-gray-500" />
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</label>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-1 px-2 focus:outline-none text-sm">
                                <option value="relevance">Most Relevant</option>
                                <option value="recent">Most Recent</option>
                                <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                        </div>
                        
                        <button onClick={handleSearch} disabled={keywords.length === 0 || isLoading} className={`bg-blue-600 text-white px-6 py-2 rounded-md transition-colors ${keywords.length === 0 ? "opacity-50" : ""}`}>Search</button>
                    </div>
                </div>

                {/* Results List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-200">
                     {isLoading ? <div className="p-6"><Loader2 className="animate-spin" /></div> : 
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            <AnimatePresence>
                                {getSortedResults().map((result) => (
                                    <motion.div key={result.act_num} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                                    <a href={result.link} target="_blank" className="hover:text-blue-600">{result.name}</a>
                                                </h3>
                                                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center"><BookOpen className="h-4 w-4 mr-1"/>{result.act_num}</span>
                                                    <span className="flex items-center"><MapPin className="h-4 w-4 mr-1"/>{result.state}</span>
                                                    <span className="flex items-center"><Calendar className="h-4 w-4 mr-1"/>{result.year}</span>
                                                    {/* NEW VISUAL BADGES */}
                                                    {result.word_count && result.word_count > 0 ? (
                                                        <span className="flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs">
                                                            <FileText className="h-3 w-3 mr-1"/>{result.word_count} words
                                                        </span>
                                                    ) : null}
                                                    {result.stage ? (
                                                        <span className={`flex items-center px-2 py-0.5 rounded text-xs ${
                                                            result.stage === "Resolution" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                                                        }`}>
                                                            <Gavel className="h-3 w-3 mr-1"/>{result.stage}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    }
                    {hasMoreResults && <div ref={sentinelRef} className="h-1"/>}
                </div>
            </main>
            <AnimatePresence>{showBackToTop && <button onClick={scrollToTop} className="fixed bottom-6 right-6 bg-blue-600 p-3 rounded-full text-white"><ChevronUp/></button>}</AnimatePresence>
        </div>
    );
}

export default App;