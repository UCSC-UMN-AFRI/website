const search_keys = [
    "agriculture",
    "oilseed",
    "agricultural",
    "oilseeds",
    "grain",
    "grains",
    "feed_grain",
    "feed_grains",
    "soymeal",
    "cotton",
    "soybean",
    "soyoil",
    "wheat",
    "corn",
    "farm",
    "cereal",
    "canadian_canola",
    "feedgrain",
    "sugar",
    "soybeans",
    "rapeseed_meal",
    "soy",
    "coarse_grain",
    "refined_sugar",
    "vegetable_oil",
    "argentine_corn",
    "feed_wheat",
    "livestock",
    "crop",
    "soybean_meal",
    "rapeseed",
    "barley",
    "rough_rice",
    "maize",
    "malting_barley",
    "cereals",
    "argentine_soy",
    "canola",
    "farming",
    "new-crop",
    "sunflowerseed",
    "cane_sugar",
    "raw_cotton",
    "durum_wheat",
    "old-crop",
    "durum",
    "crushers",
    "beet_sugar",
    "agribusiness",
    "edible_oil",
    "yellow_corn",
    "chickpeas",
    "ddgs",
    "soybean_export",
    "rapeseed_oil",
    "millers",
    "wheat_crops",
    "milling_wheat",
    "feed_barley",
    "new-crop_corn",
    "flour_millers",
    "bean",
    "cotton_growers",
    "sugarbeet",
    "feed_makers",
    "horticultural",
    "pigmeat",
    "sorghum",
    "wheat_crop",
    "soybean_imports",
    "agricultural_commodities",
    "beans",
    "forestry",
    "cottonseed",
    "coffee",
    "rice",
    "spring_wheat",
    "rapeseed_crop",
    "wheat_growers",
    "raw_sugar",
    "post-harvest",
    "agricultural_products",
    "soybean_processors",
    "rapeseed_harvest",
    "malting",
    "coarse_grains",
    "animal-feed",
    "paddy_rice",
    "drought-hit",
    "soymeal_exports",
    "sunflower_oil",
    "soybean_crop",
    "robusta",
    "sugar_producers",
    "beet",
    "soy_crop",
    "grain_crops",
    "arable",
    "wheat_flour",
    "sugarcane_crop",
    "crops",
    "wheat_exporter",
    "cotton_crop",
    "soybean_crushing",
    "pork",
    "poultry_producers",
    "harvest",
    "sugarcane",
    "farmers",
    "feedgrains",
    "livestock_feed",
    "erratic_weather",
    "grain_growers",
    "vietnamese_coffee",
    "growers",
    "corn_soybean",
    "thai_rice",
    "animal_feed",
    "yellow_maize",
    "citrus",
    "broiler",
    "high-protein",
    "feed_ingredient",
    "wheat-growing",
    "sunflower",
    "cotton_acreage",
    "sugar_beet",
    "edible_oils",
    "poultry",
    "oilseed_crops",
    "pork_producers",
    "planted_acreage",
    "winter_wheat",
    "sugar_beets",
    "grower",
    "wheats",
    "plantings",
    "sweetener",
    "citrus_fruit",
    "agronomic",
    "vegetable_oils",
    "soy_corn",
    "brazilian_ethanol",
    "wheat_plantings",
    "cocoa_bean",
    "coffee_beans",
    "cane-growing",
    "seed",
    "meat",
    "pre-harvest",
    "canola_crop",
    "milled_rice",
    "oilseed_crop",
    "farm_goods",
    "tapioca",
    "rice_crop",
    "arabica",
    "sugar_cane",
    "wheat_harvest",
    "agronomy",
    "wool",
    "winter_crops",
    "hard_red",
    "corn-growing",
    "cotton-growing",
    "sugar-producing",
    "cocoa_beans",
    "pork_exports",
    "agricultural_goods",
    "gmo-free",
    "canola_seed",
    "red_meat",
    "harvests",
    "beef_cattle",
    "soluble_coffee",
    "granary",
    "licht",
    "non-gmo",
    "cocoa",
    "upland_cotton",
    "cotton_plantings",
    "coconut_oil",
    "fertilizer",
    "unhusked_rice",
    "staple_food",
    "wheat_sowing",
    "wheat_planting",
    "grain_handlers",
    "drought-related",
    "wheat_harvested",
    "rye",
    "potato",
    "usda",
    "corn_soy",
    "feed_mills",
    "livestock_farmers",
    "animal_protein",
    "rice_exporters",
    "corn_acres",
    "millers_association",
    "wheat_acreage",
    "biodiesel_producers",
    "aquaculture",
    "beet_harvest",
    "peanut",
    "soybean_crush",
    "beef_exports",
    "soy_harvest",
    "citrus_crop",
    "cereal_crop",
    "vietnamese_rice",
    "all-wheat",
    "old-crop_corn",
    "cattle_producers",
    "cotton-producing",
    "corn_crop",
    "soy_crops",
    "livestock_producers",
    "robusta_beans",
    "kiwifruit",
    "biodiesel",
    "timber",
    "drought-affected",
    "pulses",
    "chicken_meat",
    "flax",
    "barley_crop",
    "top_grower",
    "sunflower_seeds",
    "feedmakers",
    "maize_harvest",
    "dairy",
    "grains_council",
    "fapri",
    "on-farm",
    "rubber",
    "vegetable",
    "coffee_crop",
    "cane",
    "copra",
    "soybean_exporter",
    "green_coffee",
    "agriculture_attache",
    "maize_crop",
    "intervention_rye",
    "grain_sorghum",
    "dairy_products",
    "summer-autumn_crop",
    "agricultural_sector",
    "beet_crop",
    "legumes",
    "cashew",
    "bioenergy",
    "farmers_incomes",
    "seeds",
    "cane_crop",
    "nutrient",
    "cotton_seed",
    "hog",
    "corn_gluten",
    "wheat_importer",
    "biofuel",
    "sugar_millers",
    "feed_ingredients",
    "olive_oil",
    "dry_weather",
    "almonds",
    "wheat_durum",
    "groundnut",
    "cereal_harvest",
    "starch",
    "small-scale_farmers",
    "swine",
    "palm_oil",
    "agriculture_department",
    "planted_area",
    "horticulture",
    "cattlemen",
    "soybean-growing",
    "breadmaking",
    "milling",
    "drought-ravaged",
    "oilmeal",
    "soybean_acreage",
    "poultry_feed",
    "animal_feeds",
    "palmoil",
    "end-of-season",
    "coffee_producing",
    "rice-producing",
    "white_maize",
    "seafood",
    "cane_growers",
    "sugar_mills",
    "ginning",
    "cattle",
    "ginners",
    "husbandry",
    "spring_crops",
    "gmo_corn",
    "lentils",
    "brazilian_beef",
    "ghana_cocoa",
    "armyworms",
    "pork_imports",
    "agriculture-related",
    "excessive_rains",
    "soybean_harvest",
    "ethanol_production",
    "pest",
    "fisheries",
    "grain_belt",
    "barley_harvest",
    "corn_seed",
    "spring_planting",
    "meat_processors",
    "corn_acreage",
    "hog_producers",
    "cereal_crops",
    "brazilian_cane",
    "soybean_seeds",
    "citrus_growers",
    "grain-growing",
    "natural_rubber",
    "vietnam_coffee",
    "wheat_corn",
    "wheat_barley",
    "grain-producing",
    "salmon",
    "conillon",
    "meat_processing",
    "broilers",
    "hoelgaard",
    "asparagus",
    "gm-free",
    "favourable_weather",
    "food",
    "corn_plantings",
    "catfish",
    "bread-making",
    "coffees",
    "hog_farmers",
    "orange_juice",
    "imported_beef",
    "area_planted",
    "sugars",
    "summer-autumn",
    "flue-cured",
    "apples",
    "drought-stricken",
    "beef",
    "oilseed_processing",
    "wheat_sowings",
    "florida_citrus",
    "bananas",
    "hog_herd",
    "vegetable_crops",
    "basmati_rice",
    "record-large",
    "grain-based",
    "planting_intentions",
    "weevil",
    "dryness",
    "beef_exporter",
    "soy-growing",
    "corn_harvest",
    "soybean_acres",
    "frozen_pork",
    "soya",
    "cultivation",
    "hogs",
    "crusher",
    "cane_harvest",
    "lemons",
    "soybean_crops",
    "seedlings",
    "fishmeal",
    "fertiliser",
    "granaries",
    "pistachio",
    "biofuels",
    "flour",
    "firs",
    "bioethanol",
    "ethanol_producers",
    "fungicides",
    "farm_equipment",
    "farm_incomes",
    "tomato",
    "frozen_beef",
    "breeders",
    "dairy_farmers",
    "cropland",
    "agriculture_minister",
    "drought-prone",
    "poultry_meat",
    "beets",
    "poultry_products",
    "mineral",
    "peas",
    "canegrowers",
    "non-irrigated",
    "avocado",
    "harvest_season",
    "paddy",
    "early-season",
    "gmo_crops",
    "crop_damage",
    "shrimp",
    "canola_meal",
    "cattle_herd",
    "soy_planting",
    "poppy",
    "non-gm",
    "wetness",
    "chicken",
    "isoglucose",
    "pig_farmers",
    "food_processors",
    "pig_meat",
    "ethanol",
    "fruits_vegetables",
    "drought",
    "feedmillers",
    "sowings",
    "bread_basket",
    "top-producing",
    "tea",
    "sunseeds",
    "gm_maize",
    "protein-rich",
    "gluten",
    "strawberries",
    "specialty_coffee",
    "grape",
    "fertilizers",
    "unfavourable_weather",
    "hemp",
    "oranges",
    "cotton_harvest",
    "farm_gate",
    "mustard",
    "malt",
    "corn_seedings",
    "arable_land",
    "phytosanitary",
    "water_resources",
    "specialty_crops",
    "irrigation_water",
    "vegoils",
    "banana",
    "agriculture_ministry",
    "grasshoppers",
    "corn_soybeans",
    "fungicide",
    "pesticide",
    "soy_rust",
    "farmer-owned",
    "oilseed_crushing",
    "seedings",
    "pesticides",
    "coffee_harvest",
    "varieties",
    "proagro",
    "agribusinesses",
    "garlic",
    "gmo_maize",
    "rain-fed",
    "meat_products",
    "meat_packers",
    "foodstuff",
    "irrigation",
    "long-grain",
    "processed_foods",
    "kharif",
    "farmer",
    "kansas_wheat",
    "crushing_capacity",
    "walnuts",
    "bio-energy",
    "centre-south_brazil",
    "smallholder",
    "genetically_modified",
    "maggi",
    "crop-growing",
    "opium_poppies",
    "veterinary",
    "vegoil",
    "orange_crop",
    "armyworm",
    "edible",
    "sugar-growing",
    "lamb",
    "vegetables",
    "soil_moisture",
    "wildlife_conservation",
    "groundnuts",
    "tillers",
    "harvesting",
    "sowing_campaign",
    "resource_economics",
    "soyabean",
    "rice_paddy",
    "aflatoxin",
    "pears",
    "opium",
    "pineapples",
    "fungus",
    "raisin",
    "planting",
    "ifad",
    "staple_maize",
    "beef_pork",
    "milk",
    "forage",
    "planters",
    "fruit",
    "unseasonal_rains",
    "winter-spring_crop",
    "cane_fields",
    "flour_mills",
    "excessive_moisture",
    "unharvested",
    "ryegrass",
    "crawfish",
    "washington_usda",
    "regulator_cocobod",
    "corn_planting",
    "infestations",
    "climatic_conditions",
    "meatpacking",
    "melons",
    "organic_farming",
    "corn-based_ethanol",
    "pea",
    "coffee_bean",
    "hectares_planted",
    "fao",
    "cauliflower",
    "biotech_crops",
    "food-for-work",
    "onion",
    "rice-growing",
    "aphids",
    "gm_crops",
    "agriculture_commissioner",
    "farm-gate",
    "nitrogen_fertilizer",
    "farmland",
    "farm_ministry",
    "harvesters",
    "forest_products",
    "avocados",
    "bags",
    "food-grade",
    "cotton_planting",
    "protein",
    "reseeded",
    "onions",
    "drought-resistant",
    "climatology",
    "lumber",
    "weed",
    "meatpackers",
    "guar",
    "fishery",
    "genetically-modified",
    "agriculture_secretary",
    "crop_nutrients",
    "archer_daniels",
    "sweet_potato",
    "replanting",
    "citrus_groves",
    "lint",
    "atlantic_salmon",
    "feedlot",
    "soybean_planting",
    "cassava",
    "soybean_plantings",
    "grain_sowing",
    "irrigated",
    "pig",
    "usda_monthly",
    "crushings",
    "pests",
    "favorable_weather",
    "dairy_farms",
    "sowing",
    "ngfa",
    "damaged_crops",
    "tomatoes",
    "gmo",
    "seedling",
    "ranchers",
    "devastating_drought",
    "subsidised_bread",
    "severe_drought",
    "potatoes",
    "farm_belt",
    "cane_agroindustry",
    "agrochemicals",
    "deforested",
    "dairy_cows",
    "harvesting_season",
    "flour_milling",
    "wine",
    "lygus",
    "almond",
    "drought-stressed",
    "farms",
    "stone_fruit",
    "processed_meat",
    "soluble",
    "breeding",
    "cargill_inc",
    "shrimps",
    "mangoes",
    "fishery_products",
    "animal_nutrition",
    "planted_corn",
    "manufactured_products",
    "steel",
    "borel",
    "pastureland",
    "fumigation",
    "apricots",
    "stallman",
    "weevils",
    "feltes",
    "naiknavare",
    "seeding",
    "sows",
    "dry_beans",
    "yarn",
    "poppies",
    "coffee_plantations",
    "haying",
    "biosecurity",
    "pear",
    "late-planted",
    "food_safety",
    "tuna",
    "u.s.-grown",
    "lentil",
    "foodstuffs",
];

// Local semantic similarity search interface
export interface SimilaritySearchResult {
    keyword: string;
    similarity: number;
}

// Local semantic similarity search using TensorFlow.js Universal Sentence Encoder
class LocalSemanticSimilaritySearch {
    private keywordEmbeddings: Map<string, number[]> = new Map();
    private model: any = null;
    private isModelLoaded = false;
    private embeddingCache: Map<string, number[]> = new Map();

    constructor(keywords: string[]) {
        this.initializeModel().then(() => {
            this.initializeEmbeddings(keywords);
        });
    }

    private async initializeModel(): Promise<void> {
        try {
            // Dynamic import for browser compatibility
            const use = await import(
                "@tensorflow-models/universal-sentence-encoder"
            );

            console.log("Loading Universal Sentence Encoder model...");
            this.model = await use.load();
            this.isModelLoaded = true;
            console.log("Model loaded successfully!");
        } catch (error) {
            console.error("Error loading TensorFlow.js model:", error);
            console.log("Falling back to simple text similarity...");
            this.isModelLoaded = false;
        }
    }

    private async initializeEmbeddings(keywords: string[]): Promise<void> {
        if (!this.isModelLoaded) {
            console.log("Model not loaded, using fallback similarity...");
            return;
        }

        console.log("Generating embeddings for keywords...");

        // Process keywords in batches to avoid memory issues
        const batchSize = 50;
        for (let i = 0; i < keywords.length; i += batchSize) {
            const batch = keywords.slice(i, i + batchSize);

            try {
                const cleanedTexts = batch.map((keyword) =>
                    keyword.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim()
                );

                const embeddings = await this.model.embed(cleanedTexts);
                const embeddingArray = await embeddings.array();

                batch.forEach((keyword, index) => {
                    this.keywordEmbeddings.set(keyword, embeddingArray[index]);
                });

                embeddings.dispose(); // Clean up tensors
                console.log(
                    `Processed batch ${
                        Math.floor(i / batchSize) + 1
                    }/${Math.ceil(keywords.length / batchSize)}`
                );
            } catch (error) {
                console.error(
                    `Error processing batch ${i}-${i + batchSize}:`,
                    error
                );
                // Add fallback embeddings for failed batch
                batch.forEach((keyword) => {
                    this.keywordEmbeddings.set(
                        keyword,
                        this.createFallbackEmbedding(keyword)
                    );
                });
            }
        }

        console.log("All embeddings generated successfully!");
    }

    private createFallbackEmbedding(text: string): number[] {
        // Simple character-based embedding as fallback
        const embedding = new Array(512).fill(0);
        const normalizedText = text.toLowerCase().replace(/[_-]/g, " ");

        // Character frequency features
        for (let i = 0; i < normalizedText.length && i < 100; i++) {
            const charCode = normalizedText.charCodeAt(i);
            embedding[charCode % 512] += 1;
        }

        // Word features
        const words = normalizedText.split(/\s+/);
        words.forEach((word, index) => {
            if (index < 50) {
                for (let i = 0; i < word.length; i++) {
                    embedding[(word.charCodeAt(i) + index * 10) % 512] += 0.5;
                }
            }
        });

        // Normalize
        const magnitude = Math.sqrt(
            embedding.reduce((sum, val) => sum + val * val, 0)
        );
        if (magnitude > 0) {
            for (let i = 0; i < embedding.length; i++) {
                embedding[i] /= magnitude;
            }
        }

        return embedding;
    }

    private async getEmbedding(text: string): Promise<number[]> {
        // Check cache first
        if (this.embeddingCache.has(text)) {
            return this.embeddingCache.get(text)!;
        }

        if (!this.isModelLoaded || !this.model) {
            // Use fallback embedding
            const embedding = this.createFallbackEmbedding(text);
            this.embeddingCache.set(text, embedding);
            return embedding;
        }

        try {
            const cleanText = text
                .replace(/[_-]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            const embeddings = await this.model.embed([cleanText]);
            const embeddingArray = await embeddings.array();
            const embedding = embeddingArray[0];

            embeddings.dispose(); // Clean up tensors

            // Cache the embedding
            this.embeddingCache.set(text, embedding);

            return embedding;
        } catch (error) {
            console.error("Error getting embedding:", error);
            // Fallback to simple embedding
            const embedding = this.createFallbackEmbedding(text);
            this.embeddingCache.set(text, embedding);
            return embedding;
        }
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public async findSimilarKeywords(
        keyword: string,
        threshold: number = 0.5,
        maxResults: number = 10
    ): Promise<SimilaritySearchResult[]> {
        try {
            const queryEmbedding = await this.getEmbedding(keyword);
            const similarities: SimilaritySearchResult[] = [];

            for (const [candidateKeyword, candidateEmbedding] of this
                .keywordEmbeddings) {
                if (candidateKeyword === keyword) continue; // Skip exact match

                const similarity = this.cosineSimilarity(
                    queryEmbedding,
                    candidateEmbedding
                );

                if (similarity >= threshold) {
                    similarities.push({
                        keyword: candidateKeyword,
                        similarity: similarity,
                    });
                }
            }

            // Sort by similarity score (descending) and limit results
            return similarities
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, maxResults);
        } catch (error) {
            console.error("Error in semantic similarity search:", error);
            return [];
        }
    }

    public async findRelatedKeywords(
        keyword: string,
        threshold: number = 0.4
    ): Promise<string[]> {
        const similar = await this.findSimilarKeywords(keyword, threshold);
        return [keyword, ...similar.map((result) => result.keyword)];
    }

    public isInitialized(): boolean {
        return this.keywordEmbeddings.size > 0;
    }

    public getModelStatus(): { loaded: boolean; embeddingsCount: number } {
        return {
            loaded: this.isModelLoaded,
            embeddingsCount: this.keywordEmbeddings.size,
        };
    }
}

// Global instance
let similaritySearch: LocalSemanticSimilaritySearch | null = null;

/**
 * Initialize the local semantic similarity search
 * This automatically loads the TensorFlow.js Universal Sentence Encoder model
 */
export async function initializeLocalSemanticSearch(): Promise<void> {
    if (similaritySearch) {
        console.log("Semantic search already initialized");
        return;
    }

    console.log("Initializing local semantic search...");
    similaritySearch = new LocalSemanticSimilaritySearch(search_keys);

    // Wait for initialization to complete
    while (!similaritySearch.isInitialized()) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("Local semantic search initialized successfully!");
}

/**
 * Get related keywords including the original keyword and semantically similar ones
 * @param keyword - The input keyword
 * @param threshold - Minimum similarity score (default: 0.4)
 * @returns Array of related keywords
 */
export async function getRelatedKeywords(
    keyword: string,
    threshold: number = 0.4
): Promise<string[]> {
    if (!similaritySearch) {
        throw new Error(
            "Local semantic search not initialized. Call initializeLocalSemanticSearch() first."
        );
    }

    return similaritySearch.findRelatedKeywords(keyword, threshold);
}

/**
 * Expand multiple keywords to include semantically similar terms
 * @param keywords - Array of input keywords
 * @param threshold - Minimum similarity score (default: 0.4)
 * @returns Deduplicated array of all related keywords
 */
export async function getExpandedKeywords(
    keywords: string[],
    threshold: number = 0.4
): Promise<string[]> {
    if (!similaritySearch) {
        throw new Error(
            "Local semantic search not initialized. Call initializeLocalSemanticSearch() first."
        );
    }

    const expandedSet = new Set<string>();

    for (const keyword of keywords) {
        const related = await getRelatedKeywords(keyword, threshold);
        for (const relatedKeyword of related) {
            expandedSet.add(relatedKeyword);
        }
    }

    return Array.from(expandedSet);
}

/**
 * Get status of the local model
 */
export function getModelStatus(): {
    loaded: boolean;
    embeddingsCount: number;
} | null {
    return similaritySearch ? similaritySearch.getModelStatus() : null;
}

export default search_keys;
