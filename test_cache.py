from feature_flag_client.cache import LocalCache


# Create a cache with a 60-second TTL
cache = LocalCache(ttl=60)


# Store a feature flag value in the cache
cache.set("Development:dark_mode:101", True)


# Retrieve the value from the cache
result = cache.get("Development:dark_mode:101")


# Display the result
print("Cached value:", result)