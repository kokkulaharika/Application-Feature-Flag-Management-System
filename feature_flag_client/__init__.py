# Import the FeatureFlagClient class from client.py
# The "." means the current package (feature_flag_client).
from .client import FeatureFlagClient

# Define the main class that this package exposes.
__all__ = ["FeatureFlagClient"]