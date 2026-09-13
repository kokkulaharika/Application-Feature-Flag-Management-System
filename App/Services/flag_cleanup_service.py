from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session

from App.Models.flag import Flag
from App.Models.targeting_rule import TargetingRule


def check_flag_cleanup_candidates(
    db: Session,
    days: int = 30
):
    """
    Identify feature flags that are safe cleanup candidates.

    A flag is a cleanup candidate when it is:

    1. Fully disabled across all environments
       OR
    2. Fully rolled out (100%) across all environments

    The flag must remain in that state for the
    configured number of days.
    """

    now = datetime.now(timezone.utc)

    cutoff_date = now - timedelta(days=days)

    flags = (
        db.query(Flag)
        .order_by(Flag.key)
        .all()
    )

    candidates = []

    # =====================================================
    # GROUP FLAGS BY FEATURE FLAG KEY
    # =====================================================

    flags_by_key = {}

    for flag in flags:

        flags_by_key.setdefault(
            flag.key,
            []
        ).append(flag)

    # =====================================================
    # CHECK EACH FEATURE FLAG
    # =====================================================

    for flag_key, environment_flags in flags_by_key.items():

        # =================================================
        # CHECK FULLY DISABLED
        # =================================================

        all_disabled = all(
            flag.enabled is False
            for flag in environment_flags
        )

        # =================================================
        # CHECK 100% ROLLOUT
        # =================================================

        all_rolled_out = True

        for flag in environment_flags:

            rollout_rule = (
                db.query(TargetingRule)
                .filter(
                    TargetingRule.flag_id == flag.flag_id,
                    TargetingRule.attribute == "rollout_percentage"
                )
                .first()
            )

            if rollout_rule is None:

                all_rolled_out = False
                break

            try:

                rollout_percentage = int(
                    rollout_rule.value
                )

            except (TypeError, ValueError):

                all_rolled_out = False
                break

            if rollout_percentage != 100:

                all_rolled_out = False
                break

        # =================================================
        # DETERMINE CURRENT CLEANUP STATE
        # =================================================

        if all_disabled:

            current_state = "fully_disabled"

        elif all_rolled_out:

            current_state = "fully_rolled_out"

        else:

            current_state = None

        # =================================================
        # NOT A CLEANUP STATE
        # =================================================

        if current_state is None:

            for flag in environment_flags:

                flag.cleanup_state = None
                flag.cleanup_state_since = None

            continue

        # =================================================
        # TRACK WHEN CLEANUP STATE STARTED
        # =================================================

        for flag in environment_flags:

            # State changed
            if flag.cleanup_state != current_state:

                flag.cleanup_state = current_state
                flag.cleanup_state_since = now

            # State is already the same
            else:

                if flag.cleanup_state_since is None:

                    flag.cleanup_state_since = now

        # =================================================
        # CHECK WHETHER ALL ENVIRONMENTS PASSED N DAYS
        # =================================================

        all_old_enough = all(
            flag.cleanup_state_since is not None
            and flag.cleanup_state_since <= cutoff_date
            for flag in environment_flags
        )

        # =================================================
        # CREATE CLEANUP CANDIDATE
        # =================================================

        if all_old_enough:

            candidates.append({

                "flag_id": environment_flags[0].flag_id,

                "flag_key": flag_key,

                "cleanup_state": current_state,

                "environments": sorted(
                    set(
                        flag.environment_id
                        for flag in environment_flags
                    )
                ),

                "eligible_since": min(
                    flag.cleanup_state_since
                    for flag in environment_flags
                    if flag.cleanup_state_since is not None
                )
            })

    # =====================================================
    # SAVE CLEANUP STATE CHANGES
    # =====================================================

    db.commit()

    return candidates