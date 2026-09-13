import time


class LocalCache:
    """
    Simple in-memory cache for storing feature flag results.
    """

    def __init__(self, ttl: int = 60):
        """
        Create the local cache.

        ttl: time to live
            Number of seconds a cached value remains valid.
            Default is 60 seconds.
        """

        # Store the TTL value.
        self.ttl = ttl

        # Dictionary used to store cached values.
        #
        # Example:
        # {
        #     "Development:dark_mode:101": {
        #         "value": True,
        #         "expires_at": 1755940000
        #     }
        # }
        self.cache = {}

    def get(self, key):
        """
        Get a value from the cache.

        Returns:
            Cached value if it exists and has not expired.
            None if the value does not exist or has expired.
        """

        # Check whether the key exists in the cache.
        if key not in self.cache:
            return None

        # Get the stored cache entry.
        entry = self.cache[key]

        # Check whether the cached value has expired.
        if time.time() >= entry["expires_at"]:

            # Remove the expired entry.
            del self.cache[key]

            return None

        # Return the cached value.
        return entry["value"]

    def set(self, key, value):
        """
        Store a value in the cache.
        """

        # Calculate when this cache entry should expire.
        expires_at = time.time() + self.ttl

        # Store the value and its expiration time.
        self.cache[key] = {
            "value": value,
            "expires_at": expires_at
        }

    def clear(self):
        """
        Remove all values from the local cache.
        """
        self.cache.clear()