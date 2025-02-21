import { useState } from "react";
import { Search, Calendar, MapPin, BookOpen } from "lucide-react";

interface LegislativeAct {
    act_num: string;
    year: number;
    state: string;
    name: string;
    link: string;
}

function App() {
    const [yearRange, setYearRange] = useState({ min: 1975, max: new Date().getFullYear() });
    const [selectedState, setSelectedState] = useState<string>("");
    const [keyword, setKeyword] = useState("");
    const [results, setResults] = useState<LegislativeAct[]>([]);
    const [isExactMatch, setIsExactMatch] = useState(false);

    const handleSearch = async () => {
        // In a real application, this would make an API call with the filters
        const response = await fetch("api/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                states: [selectedState],
                from_year: yearRange.min,
                to_year: yearRange.max,
                search_keys: [keyword],
                limit: 25,
                offset: 0,
            }),
        });
        const data = await response.json();
        setResults(data);
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
                                Keyword Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter keywords..."
                                />
                            </div>
                            <div className="flex items-center mt-2">
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
                            </div>
                        </div>

                        {/* State Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                State
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <select
                                    value={selectedState}
                                    onChange={(e) =>
                                        setSelectedState(e.target.value)
                                    }
                                    className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                >
                                    <option value="">All States</option>
                                    {states.map((state) => (
                                        <option key={state} value={state}>
                                            {state}
                                        </option>
                                    ))}
                                </select>
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

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSearch}
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
                                        </div>
                                    </div>
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
                </div>
            </main>
        </div>
    );
}

export default App;
