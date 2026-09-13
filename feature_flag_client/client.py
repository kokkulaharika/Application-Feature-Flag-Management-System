import requests


class FeatureFlagClient:
    """
    Client/helper class used by consuming applications
    to communicate with our Feature Flag API.
    """

    def __init__(self, base_url: str, environment: str):
        """
        Initialize the Feature Flag client.

        base_url:
            URL of our Feature Flag backend.
            Example: http://localhost:8000

        environment:
            Environment in which the flag should be evaluated.
            Example: Development, Staging, Production
        """

        # Remove a trailing "/" from the base URL.
        # This prevents URLs such as:
        # http://localhost:8000//evaluate
        self.base_url = base_url.rstrip("/")

        # Store the environment because every flag evaluation
        # needs to know which environment should be checked.
        self.environment = environment

    def is_enabled(
        self,
        flag_key: str,
        user_id: str | None = None,
        groups: list[str] | None = None,
        attributes: dict | None = None,
        default: bool = False
    ) -> bool:
        """
        Evaluate a feature flag for a specific user.

        flag_key:
            The key of the feature flag.
            Example: "payment_v2"

        user_id:
            ID of the user for user-based targeting.

        groups:
            Groups the user belongs to.
            Example: ["beta_users", "premium_plan"]

        attributes:
            Additional user attributes that may be used
            by targeting rules.

        default:
            Fallback value if the flag cannot be evaluated.
        """

        # Create the user context that will be sent
        # to our existing /evaluate endpoint.
        user_context = {
            "user_id": user_id,
            "groups": groups or [],
            "attributes": attributes or {}
        }

        # Create the request body expected by our
        # existing Feature Flag evaluation API.
        payload = {
            "flag_key": flag_key,
            "environment_name": self.environment,
            "user_context": user_context
        }

        # Send a POST request to the existing /evaluate endpoint.
        response = requests.post(
            f"{self.base_url}/evaluate",
            json=payload,
            timeout=5
        )

        # If the API returns an HTTP error such as
        # 400, 404, or 500, raise an exception.
        response.raise_for_status()

        # Convert the API's JSON response into a Python dictionary.
        result = response.json()

        # Return the evaluated flag value.
        # If "value" is not present in the response,
        # return the default value provided by the caller.
        return result.get("value", default)