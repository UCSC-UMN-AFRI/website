import json
import logging
import os
import pickle
from typing import List, Dict, Tuple

import azure.functions as func
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Complete list of agricultural keywords (993 total)
AGRICULTURAL_KEYWORDS = [
    "agriculture", "oilseed", "agricultural", "oilseeds", "grain", "grains", "feed_grain", "feed_grains",
    "soymeal", "cotton", "soybean", "soyoil", "wheat", "corn", "farm", "cereal", "canadian_canola",
    "feedgrain", "sugar", "soybeans", "rapeseed_meal", "soy", "coarse_grain", "refined_sugar",
    "vegetable_oil", "argentine_corn", "feed_wheat", "livestock", "crop", "soybean_meal", "rapeseed",
    "barley", "rough_rice", "maize", "malting_barley", "cereals", "argentine_soy", "canola", "farming",
    "new-crop", "sunflowerseed", "cane_sugar", "raw_cotton", "durum_wheat", "old-crop", "durum",
    "crushers", "beet_sugar", "agribusiness", "edible_oil", "yellow_corn", "chickpeas", "ddgs",
    "soybean_export", "rapeseed_oil", "millers", "wheat_crops", "milling_wheat", "feed_barley",
    "new-crop_corn", "flour_millers", "bean", "cotton_growers", "sugarbeet", "feed_makers",
    "horticultural", "pigmeat", "sorghum", "wheat_crop", "soybean_imports", "agricultural_commodities",
    "beans", "forestry", "cottonseed", "coffee", "rice", "spring_wheat", "rapeseed_crop",
    "wheat_growers", "raw_sugar", "post-harvest", "agricultural_products", "soybean_processors",
    "rapeseed_harvest", "malting", "coarse_grains", "animal-feed", "paddy_rice", "drought-hit",
    "soymeal_exports", "sunflower_oil", "soybean_crop", "robusta", "sugar_producers", "beet",
    "soy_crop", "grain_crops", "arable", "wheat_flour", "sugarcane_crop", "crops", "wheat_exporter",
    "cotton_crop", "soybean_crushing", "pork", "poultry_producers", "harvest", "sugarcane", "farmers",
    "feedgrains", "livestock_feed", "erratic_weather", "grain_growers", "vietnamese_coffee", "growers",
    "corn_soybean", "thai_rice", "animal_feed", "yellow_maize", "citrus", "broiler", "high-protein",
    "feed_ingredient", "wheat-growing", "sunflower", "cotton_acreage", "sugar_beet", "edible_oils",
    "poultry", "oilseed_crops", "pork_producers", "planted_acreage", "winter_wheat", "sugar_beets",
    "grower", "wheats", "plantings", "sweetener", "citrus_fruit", "agronomic", "vegetable_oils",
    "soy_corn", "brazilian_ethanol", "wheat_plantings", "cocoa_bean", "coffee_beans", "cane-growing",
    "seed", "meat", "pre-harvest", "canola_crop", "milled_rice", "oilseed_crop", "farm_goods",
    "tapioca", "rice_crop", "arabica", "sugar_cane", "wheat_harvest", "agronomy", "wool",
    "winter_crops", "hard_red", "corn-growing", "cotton-growing", "sugar-producing", "cocoa_beans",
    "pork_exports", "agricultural_goods", "gmo-free", "canola_seed", "red_meat", "harvests",
    "beef_cattle", "soluble_coffee", "granary", "licht", "non-gmo", "cocoa", "upland_cotton",
    "cotton_plantings", "coconut_oil", "fertilizer", "unhusked_rice", "staple_food", "wheat_sowing",
    "wheat_planting", "grain_handlers", "drought-related", "wheat_harvested", "rye", "potato",
    "usda", "corn_soy", "feed_mills", "livestock_farmers", "animal_protein", "rice_exporters",
    "corn_acres", "millers_association", "wheat_acreage", "biodiesel_producers", "aquaculture",
    "beet_harvest", "peanut", "soybean_crush", "beef_exports", "soy_harvest", "citrus_crop",
    "cereal_crop", "vietnamese_rice", "all-wheat", "old-crop_corn", "cattle_producers",
    "cotton-producing", "corn_crop", "soy_crops", "livestock_producers", "robusta_beans", "kiwifruit",
    "biodiesel", "timber", "drought-affected", "pulses", "chicken_meat", "flax", "barley_crop",
    "top_grower", "sunflower_seeds", "feedmakers", "maize_harvest", "dairy", "grains_council",
    "fapri", "on-farm", "rubber", "vegetable", "coffee_crop", "cane", "copra", "soybean_exporter",
    "green_coffee", "agriculture_attache", "maize_crop", "intervention_rye", "grain_sorghum",
    "dairy_products", "summer-autumn_crop", "agricultural_sector", "beet_crop", "legumes", "cashew",
    "bioenergy", "farmers_incomes", "seeds", "cane_crop", "nutrient", "cotton_seed", "hog",
    "corn_gluten", "wheat_importer", "biofuel", "sugar_millers", "feed_ingredients", "olive_oil",
    "dry_weather", "almonds", "wheat_durum", "groundnut", "cereal_harvest", "starch",
    "small-scale_farmers", "swine", "palm_oil", "agriculture_department", "planted_area",
    "horticulture", "cattlemen", "soybean-growing", "breadmaking", "milling", "drought-ravaged",
    "oilmeal", "soybean_acreage", "poultry_feed", "animal_feeds", "palmoil", "end-of-season",
    "coffee_producing", "rice-producing", "white_maize", "seafood", "cane_growers", "sugar_mills",
    "ginning", "cattle", "ginners", "husbandry", "spring_crops", "gmo_corn", "lentils",
    "brazilian_beef", "ghana_cocoa", "armyworms", "pork_imports", "agriculture-related",
    "excessive_rains", "soybean_harvest", "ethanol_production", "pest", "fisheries", "grain_belt",
    "barley_harvest", "corn_seed", "spring_planting", "meat_processors", "corn_acreage",
    "hog_producers", "cereal_crops", "brazilian_cane", "soybean_seeds", "citrus_growers",
    "grain-growing", "natural_rubber", "vietnam_coffee", "wheat_corn", "wheat_barley",
    "grain-producing", "salmon", "conillon", "meat_processing", "broilers", "hoelgaard",
    "asparagus", "gm-free", "favourable_weather", "food", "corn_plantings", "catfish",
    "bread-making", "coffees", "hog_farmers", "orange_juice", "imported_beef", "area_planted",
    "sugars", "summer-autumn", "flue-cured", "apples", "drought-stricken", "beef",
    "oilseed_processing", "wheat_sowings", "florida_citrus", "bananas", "hog_herd",
    "vegetable_crops", "basmati_rice", "record-large", "grain-based", "planting_intentions",
    "weevil", "dryness", "beef_exporter", "soy-growing", "corn_harvest", "soybean_acres",
    "frozen_pork", "soya", "cultivation", "hogs", "crusher", "cane_harvest", "lemons",
    "soybean_crops", "seedlings", "fishmeal", "fertiliser", "granaries", "pistachio", "biofuels",
    "flour", "firs", "bioethanol", "ethanol_producers", "fungicides", "farm_equipment",
    "farm_incomes", "tomato", "frozen_beef", "breeders", "dairy_farmers", "cropland",
    "agriculture_minister", "drought-prone", "poultry_meat", "beets", "poultry_products", "mineral",
    "peas", "canegrowers", "non-irrigated", "avocado", "harvest_season", "paddy", "early-season",
    "gmo_crops", "crop_damage", "shrimp", "canola_meal", "cattle_herd", "soy_planting", "poppy",
    "non-gm", "wetness", "chicken", "isoglucose", "pig_farmers", "food_processors", "pig_meat",
    "ethanol", "fruits_vegetables", "drought", "feedmillers", "sowings", "bread_basket",
    "top-producing", "tea", "sunseeds", "gm_maize", "protein-rich", "gluten", "strawberries",
    "specialty_coffee", "grape", "fertilizers", "unfavourable_weather", "hemp", "oranges",
    "cotton_harvest", "farm_gate", "mustard", "malt", "corn_seedings", "arable_land",
    "phytosanitary", "water_resources", "specialty_crops", "irrigation_water", "vegoils", "banana",
    "agriculture_ministry", "grasshoppers", "corn_soybeans", "fungicide", "pesticide", "soy_rust",
    "farmer-owned", "oilseed_crushing", "seedings", "pesticides", "coffee_harvest", "varieties",
    "proagro", "agribusinesses", "garlic", "gmo_maize", "rain-fed", "meat_products", "meat_packers",
    "foodstuff", "irrigation", "long-grain", "processed_foods", "kharif", "farmer", "kansas_wheat",
    "crushing_capacity", "walnuts", "bio-energy", "centre-south_brazil", "smallholder",
    "genetically_modified", "maggi", "crop-growing", "opium_poppies", "veterinary", "vegoil",
    "orange_crop", "armyworm", "edible", "sugar-growing", "lamb", "vegetables", "soil_moisture",
    "wildlife_conservation", "groundnuts", "tillers", "harvesting", "sowing_campaign",
    "resource_economics", "soyabean", "rice_paddy", "aflatoxin", "pears", "opium", "pineapples",
    "fungus", "raisin", "planting", "ifad", "staple_maize", "beef_pork", "milk", "forage",
    "planters", "fruit", "unseasonal_rains", "winter-spring_crop", "cane_fields", "flour_mills",
    "excessive_moisture", "unharvested", "ryegrass", "crawfish", "washington_usda",
    "regulator_cocobod", "corn_planting", "infestations", "climatic_conditions", "meatpacking",
    "melons", "organic_farming", "corn-based_ethanol", "pea", "coffee_bean", "hectares_planted",
    "fao", "cauliflower", "biotech_crops", "food-for-work", "onion", "rice-growing", "aphids",
    "gm_crops", "agriculture_commissioner", "farm-gate", "nitrogen_fertilizer", "farmland",
    "farm_ministry", "harvesters", "forest_products", "avocados", "bags", "food-grade",
    "cotton_planting", "protein", "reseeded", "onions", "drought-resistant", "climatology",
    "lumber", "weed", "meatpackers", "guar", "fishery", "genetically-modified",
    "agriculture_secretary", "crop_nutrients", "archer_daniels", "sweet_potato", "replanting",
    "citrus_groves", "lint", "atlantic_salmon", "feedlot", "soybean_planting", "cassava",
    "soybean_plantings", "grain_sowing", "irrigated", "pig", "usda_monthly", "crushings", "pests",
    "favorable_weather", "dairy_farms", "sowing", "ngfa", "damaged_crops", "tomatoes", "gmo",
    "seedling", "ranchers", "devastating_drought", "subsidised_bread", "severe_drought", "potatoes",
    "farm_belt", "cane_agroindustry", "agrochemicals", "deforested", "dairy_cows",
    "harvesting_season", "flour_milling", "wine", "lygus", "almond", "drought-stressed", "farms",
    "stone_fruit", "processed_meat", "soluble", "breeding", "cargill_inc", "shrimps", "mangoes",
    "fishery_products", "animal_nutrition", "planted_corn", "manufactured_products", "steel",
    "borel", "pastureland", "fumigation", "apricots", "stallman", "weevils", "feltes",
    "naiknavare", "seeding", "sows", "dry_beans", "yarn", "poppies", "coffee_plantations",
    "haying", "biosecurity", "pear", "late-planted", "food_safety", "tuna", "u.s.-grown",
    "lentil", "foodstuffs"
]

# Global variables for caching
_model = None
_keyword_embeddings = None

def get_model():
    """Get or initialize the sentence transformer model"""
    global _model
    if _model is None:
        logging.info("Loading sentence transformer model...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        logging.info("Model loaded successfully!")
    return _model

def get_keyword_embeddings():
    """Get or compute embeddings for all agricultural keywords"""
    global _keyword_embeddings
    if _keyword_embeddings is None:
        logging.info("Computing embeddings for agricultural keywords...")
        model = get_model()

        # Clean keywords for better embeddings
        cleaned_keywords = [keyword.replace('_', ' ').replace('-', ' ') for keyword in AGRICULTURAL_KEYWORDS]

        # Compute embeddings in batches for memory efficiency
        batch_size = 50
        embeddings = []

        for i in range(0, len(cleaned_keywords), batch_size):
            batch = cleaned_keywords[i:i + batch_size]
            batch_embeddings = model.encode(batch, convert_to_numpy=True)
            embeddings.extend(batch_embeddings)
            logging.info(f"Processed batch {i//batch_size + 1}/{(len(cleaned_keywords) + batch_size - 1)//batch_size}")

        _keyword_embeddings = np.array(embeddings)
        logging.info(f"All {len(AGRICULTURAL_KEYWORDS)} keyword embeddings computed!")

    return _keyword_embeddings

def find_similar_keywords(query: str, threshold: float = 0.4, max_results: int = 10) -> List[Dict]:
    """Find similar keywords using semantic similarity"""
    try:
        model = get_model()
        keyword_embeddings = get_keyword_embeddings()

        # Clean and encode the query
        cleaned_query = query.replace('_', ' ').replace('-', ' ')
        query_embedding = model.encode([cleaned_query], convert_to_numpy=True)

        # Compute similarities
        similarities = cosine_similarity(query_embedding, keyword_embeddings)[0]

        # Find matches above threshold
        results = []
        for i, similarity in enumerate(similarities):
            if similarity >= threshold:
                results.append({
                    "keyword": AGRICULTURAL_KEYWORDS[i],
                    "similarity": float(similarity)
                })

        # Sort by similarity (descending) and limit results
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return results[:max_results]

    except Exception as e:
        logging.error(f"Error in semantic similarity search: {str(e)}")
        return []

def expand_keywords(keywords: List[str], threshold: float = 0.4, max_results: int = 10) -> List[str]:
    """Expand a list of keywords with semantically similar terms"""
    try:
        expanded_set = set()

        for keyword in keywords:
            # Add the original keyword
            expanded_set.add(keyword)

            # Find similar keywords
            similar = find_similar_keywords(keyword, threshold, max_results)
            for result in similar:
                expanded_set.add(result['keyword'])

        return list(expanded_set)

    except Exception as e:
        logging.error(f"Error expanding keywords: {str(e)}")
        return keywords

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        logging.info('Semantic search API called')

        # Parse request body
        try:
            body = req.get_json()
        except ValueError:
            return func.HttpResponse(
                json.dumps({"error": "Invalid JSON in request body"}),
                mimetype="application/json",
                status_code=400
            )

        # Extract parameters
        keywords = body.get('keywords', [])
        threshold = body.get('threshold', 0.4)
        max_results = body.get('max_results', 10)
        operation = body.get('operation', 'expand')  # 'expand' or 'similar'

        # Validate inputs
        if not keywords or not isinstance(keywords, list):
            return func.HttpResponse(
                json.dumps({"error": "Keywords array is required"}),
                mimetype="application/json",
                status_code=400
            )

        if not (0.1 <= threshold <= 1.0):
            return func.HttpResponse(
                json.dumps({"error": "Threshold must be between 0.1 and 1.0"}),
                mimetype="application/json",
                status_code=400
            )

        if not (1 <= max_results <= 100):
            return func.HttpResponse(
                json.dumps({"error": "Max results must be between 1 and 100"}),
                mimetype="application/json",
                status_code=400
            )

        # Process based on operation
        if operation == 'expand':
            # Expand keywords with similar terms
            result = expand_keywords(keywords, threshold, max_results)
            response = {
                "expanded_keywords": result,
                "original_count": len(keywords),
                "expanded_count": len(result),
                "threshold": threshold
            }

        elif operation == 'similar':
            # Find similar keywords for a single query
            if len(keywords) != 1:
                return func.HttpResponse(
                    json.dumps({"error": "Similar operation requires exactly one keyword"}),
                    mimetype="application/json",
                    status_code=400
                )

            similar_results = find_similar_keywords(keywords[0], threshold, max_results)
            response = {
                "query": keywords[0],
                "similar_keywords": similar_results,
                "threshold": threshold
            }

        else:
            return func.HttpResponse(
                json.dumps({"error": "Operation must be 'expand' or 'similar'"}),
                mimetype="application/json",
                status_code=400
            )

        return func.HttpResponse(
            json.dumps(response),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logging.error(f"Error in semantic search: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": f"Internal server error: {str(e)}"}),
            mimetype="application/json",
            status_code=500
        )
