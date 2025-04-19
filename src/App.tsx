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
    ChevronLeft,
    ChevronRight,
    Star,
} from "lucide-react";

interface LegislativeAct {
    act_num: string;
    year: number;
    state: string;
    name: string;
    link: string;
    backup_link: string;
    relevance: number;
    search_key: string;
}

interface PaginationResponse {
    total: number;
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
    const [results, setResults] = useState<LegislativeAct[]>([]);
    // const [isExactMatch, setIsExactMatch] = useState(false);
    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
    const stateDropdownRef = useRef<HTMLDivElement>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                stateDropdownRef.current &&
                !stateDropdownRef.current.contains(event.target as Node)
            ) {
                setIsStateDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchTotalItems = async () => {
        try {
            const response = await fetch("api/pagination", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    states: selectedStates,
                    from_year: yearRange.min,
                    to_year: yearRange.max,
                    search_keys: keywords,
                }),
            });
            const data: PaginationResponse = await response.json();
            setTotalItems(data.total);
        } catch (error) {
            console.error("Error fetching total items:", error);
        }
    };

    const handleSearch = async (page = 1) => {
        setCurrentPage(page);
        // Fetch total items first
        if (page === 1) {
            await fetchTotalItems();
        }

        // Then fetch the actual results
        try {
            const response = await fetch("api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    states: selectedStates,
                    from_year: yearRange.min,
                    to_year: yearRange.max,
                    search_keys: keywords,
                    // exact_match: isExactMatch,
                    limit: itemsPerPage,
                    offset: (page - 1) * itemsPerPage,
                }),
            });
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error("Error fetching results:", error);
            setResults([]);
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            handleSearch(page);
        }
    };

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
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

    const addKeyword = () => {
        if (
            currentKeyword.trim() &&
            !keywords.includes(currentKeyword.trim())
        ) {
            setKeywords([...keywords, currentKeyword.trim()]);
            setCurrentKeyword("");
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

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;

        let startPage = Math.max(
            1,
            currentPage - Math.floor(maxPagesToShow / 2)
        );
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers;
    };

    return (
        <div className="min-h-screen bg-gray-50">
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
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Keywords
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    value={currentKeyword}
                                    onChange={(e) =>
                                        setCurrentKeyword(e.target.value)
                                    }
                                    onKeyPress={handleKeywordKeyPress}
                                    className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter keyword..."
                                />
                                <button
                                    onClick={addKeyword}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>
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
                            {/* <div className="flex items-center mt-2">
                                <input
                                    type="checkbox"
                                    id="exactMatch"
                                    checked={isExactMatch}
                                    onChange={(e) =>
                                        setIsExactMatch(e.target.checked)
                                    }
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="exactMatch"
                                    className="ml-2 text-sm text-gray-600"
                                >
                                    Exact match only
                                </label>
                            </div> */}
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
                                Results per page:
                            </label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) =>
                                    handleItemsPerPageChange(
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
                            onClick={() => handleSearch(1)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Search Results
                        </h2>
                        {totalItems > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                                Showing {(currentPage - 1) * itemsPerPage + 1}{" "}
                                to{" "}
                                {Math.min(
                                    currentPage * itemsPerPage,
                                    totalItems
                                )}{" "}
                                of {totalItems} results
                            </p>
                        )}
                    </div>
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
                                                    href={result.backup_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800"
                                                >
                                                    PDF Backup
                                                </a>
                                            </span>
                                        </div>
                                    </div>
                                    <span className="flex items-center text-sm text-gray-600 ml-4 flex-shrink-0">
                                        <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                        {result.relevance}
                                        <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                            {result.search_key}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        ))}
                        {results.length === 0 && (
                            <div className="p-6 text-center text-gray-500">
                                No results found. Try adjusting your search
                                criteria.
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() =>
                                        handlePageChange(currentPage - 1)
                                    }
                                    disabled={currentPage === 1}
                                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                                        currentPage === 1
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <ChevronLeft className="h-5 w-5 mr-1" />
                                    Previous
                                </button>
                                <div className="flex items-center space-x-2">
                                    {getPageNumbers().map((page) => (
                                        <button
                                            key={page}
                                            onClick={() =>
                                                handlePageChange(page)
                                            }
                                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                                currentPage === page
                                                    ? "bg-blue-600 text-white"
                                                    : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() =>
                                        handlePageChange(currentPage + 1)
                                    }
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                                        currentPage === totalPages
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    Next
                                    <ChevronRight className="h-5 w-5 ml-1" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
