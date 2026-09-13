import re
from datetime import datetime

from App.cache.redis_client import redis_client
from App.Database.session import SessionLocal
from App.Models.evaluation_analytics import EvaluationAnalytics


def flush_evaluation_analytics():
    """
    Flush completed hourly flag evaluation counters
    from Redis to PostgreSQL.
    """

    db = SessionLocal()

    try:
        keys = redis_client.keys("flag_eval:*")

        current_hour = datetime.utcnow().replace(
            minute=0,
            second=0,
            microsecond=0
        )

        for redis_key in keys:

            match = re.match(
                r"flag_eval:(\d+):(\d{4}-\d{2}-\d{2})-(\d{2})",
                redis_key
            )

            if not match:
                continue

            flag_id = int(match.group(1))

            evaluation_date = datetime.strptime(
                match.group(2),
                "%Y-%m-%d"
            ).date()

            evaluation_hour = int(match.group(3))

            evaluation_datetime = datetime(
                evaluation_date.year,
                evaluation_date.month,
                evaluation_date.day,
                evaluation_hour
            )

            # Do not flush the currently active hour
            if evaluation_datetime >= current_hour:
                continue

            evaluation_count = int(
                redis_client.get(redis_key) or 0
            )

            if evaluation_count == 0:
                continue

            existing_record = (
                db.query(EvaluationAnalytics)
                .filter(
                    EvaluationAnalytics.flag_id == flag_id,
                    EvaluationAnalytics.evaluation_date == evaluation_date,
                    EvaluationAnalytics.evaluation_hour == evaluation_hour
                )
                .first()
            )

            if existing_record:
                existing_record.evaluation_count = evaluation_count
            else:
                analytics = EvaluationAnalytics(
                    flag_id=flag_id,
                    evaluation_date=evaluation_date,
                    evaluation_hour=evaluation_hour,
                    evaluation_count=evaluation_count
                )

                db.add(analytics)

            db.commit()

            # Delete Redis key only after successful DB save
            redis_client.delete(redis_key)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()