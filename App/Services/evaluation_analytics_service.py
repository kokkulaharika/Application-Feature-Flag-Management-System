from datetime import datetime
from App.cache.redis_client import redis_client


def track_flag_evaluation(flag_id: int):
    """
    Increment the evaluation count for a flag
    for the current hour.
    """

    current_hour = datetime.utcnow().strftime("%Y-%m-%d-%H")

    redis_key = f"flag_eval:{flag_id}:{current_hour}"

    redis_client.incr(redis_key)

    # Keep the counter for a little longer than one day
    redis_client.expire(redis_key, 60 * 60 * 26)