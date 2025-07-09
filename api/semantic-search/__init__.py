import json
import logging
import os
from typing import List, Dict

import azure.functions as func
import numpy as np

# Global variables for caching
_embeddings_data = None

def load_embeddings():
    """Load pre-computed embeddings from JSON file"""
    global _embeddings_data
    if _embeddings_data is None:
        try:
            # Load from the precomputed embeddings file
            script_dir = os.path.dirname(os.path.abspath(__file__))
            embeddings_path = os.path.join(script_dir, 'precomputed_embeddings.json')

            logging.info(f"Loading embeddings from {embeddings_path}")
            with open(embeddings_path, 'r') as f:
                _embeddings_data = json.load(f)

            # Convert embeddings list back to numpy array for efficiency
            _embeddings_data['embeddings'] = np.array(_embeddings_data['embeddings'])

            logging.info(f"Loaded {_embeddings_data['total_keywords']} embeddings")

        except Exception as e:
            logging.error(f"Failed to load embeddings: {str(e)}")
            # Fallback to empty data
            _embeddings_data = {
                "keywords": [],
                "embeddings": np.array([]),
                "total_keywords": 0
            }

    return _embeddings_data

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate cosine similarity between two vectors"""
    if len(a.shape) == 1:
        a = a.reshape(1, -1)
    if len(b.shape) == 1:
        b = b.reshape(1, -1)

    # Compute dot product
    dot_product = np.dot(a, b.T)

    # Compute norms
    norm_a = np.linalg.norm(a, axis=1, keepdims=True)
    norm_b = np.linalg.norm(b, axis=1, keepdims=True)

    # Avoid division by zero
    norm_a = np.maximum(norm_a, 1e-10)
    norm_b = np.maximum(norm_b, 1e-10)

    # Compute cosine similarity
    similarity = dot_product / (norm_a * norm_b.T)

    return float(similarity[0, 0])

def simple_text_embedding(text: str, dim: int = 384) -> np.ndarray:
    """
    Simple fallback embedding based on character/word features.
    Used when user searches for terms not in the pre-computed keywords.
    """
    # Convert to lowercase and clean
    text = text.lower().replace('_', ' ').replace('-', ' ').strip()

    # Initialize embedding vector
    embedding = np.zeros(dim)

    # Character-based features (first 128 dimensions)
    for i, char in enumerate(text[:128]):
        if i < 128:
            embedding[i] = ord(char) / 255.0

    # Word-based features (next 128 dimensions)
    words = text.split()
    for i, word in enumerate(words[:32]):  # Max 32 words
        for j, char in enumerate(word[:4]):  # Max 4 chars per word
            idx = 128 + i * 4 + j
            if idx < 256:
                embedding[idx] = ord(char) / 255.0

    # Length and structure features (next 64 dimensions)
    if len(text) > 0:
        embedding[256] = len(text) / 100.0  # Text length
        embedding[257] = len(words) / 20.0  # Word count
        embedding[258] = text.count(' ') / 50.0  # Space count
        embedding[259] = text.count('_') / 10.0  # Underscore count

    # N-gram features (remaining dimensions)
    ngrams = [text[i:i+2] for i in range(len(text)-1)]  # Bigrams
    for i, ngram in enumerate(ngrams[:60]):  # Use up remaining dimensions
        idx = 260 + i
        if idx < dim:
            embedding[idx] = sum(ord(c) for c in ngram) / (255.0 * len(ngram))

    # Normalize the embedding
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm

    return embedding

def find_similar_keywords(query: str, threshold: float = 0.4, max_results: int = 10) -> List[Dict]:
    """Find similar keywords using pre-computed embeddings"""
    try:
        embeddings_data = load_embeddings()

        if embeddings_data['total_keywords'] == 0:
            return []

        keywords = embeddings_data['keywords']
        keyword_embeddings = embeddings_data['embeddings']

        # Check if query is in our keyword list
        query_lower = query.lower()
        cleaned_query = query_lower.replace('_', ' ').replace('-', ' ')

        query_embedding = None
        query_idx = None

        # Try to find exact match first
        for i, keyword in enumerate(keywords):
            if keyword.lower() == query_lower:
                query_embedding = keyword_embeddings[i]
                query_idx = i
                break

        # Try cleaned version match
        if query_embedding is None:
            cleaned_keywords = embeddings_data.get('cleaned_keywords', [])
            for i, cleaned_keyword in enumerate(cleaned_keywords):
                if cleaned_keyword.lower() == cleaned_query:
                    query_embedding = keyword_embeddings[i]
                    query_idx = i
                    break

        # If not found, try to find a keyword that contains the query as substring
        if query_embedding is None:
            for i, keyword in enumerate(keywords):
                if query_lower in keyword.lower() or keyword.lower().startswith(query_lower):
                    query_embedding = keyword_embeddings[i]
                    query_idx = i
                    logging.info(f"Using embedding from similar keyword '{keyword}' for query '{query}'")
                    break

        # If still not found, use simple text embedding as fallback
        if query_embedding is None:
            query_embedding = simple_text_embedding(query, keyword_embeddings.shape[1])

        # Compute similarities with all keywords
        similarities = []
        for i, keyword_embedding in enumerate(keyword_embeddings):
            if i == query_idx:  # Skip exact match
                continue

            similarity = cosine_similarity(query_embedding, keyword_embedding)

            if similarity >= threshold:
                similarities.append({
                    "keyword": keywords[i],
                    "similarity": float(similarity)
                })

        # Sort by similarity (descending) and limit results
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        return similarities[:max_results]

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
