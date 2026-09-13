from feature_flag_client import FeatureFlagClient


# Create the Feature Flag client
client = FeatureFlagClient(
    base_url="http://localhost:8000",
    environment="Development"
)


# Evaluate a feature flag
result = client.is_enabled(
    flag_key="dark_mode",
    user_id="101"
)


# Display the result
print("Flag result:", result)