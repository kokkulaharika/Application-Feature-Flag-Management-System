from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from App.Database.session import SessionLocal
from App.Models.flag import Flag
from App.Services.evalution_engine import evaluate_flag
from App.Schemas.evaluation import EvaluationRequest
from App.Schemas.feat_flag import FlagCreate, FlagUpdate
from App.Models.targeting_rule import TargetingRule
from App.Schemas.target import (
    TargetingRuleCreate,
    TargetingRuleUpdate
)
from App.Models.environment import Environment
from App.Models.evaluation_analytics import EvaluationAnalytics
from App.Schemas.environments import (
    EnvironmentCreate,
    EnvironmentUpdate
)
from App.cache.redis_client import redis_client
from App.Services.audit_service import create_audit_log
from App.Services.flag_cleanup_service import check_flag_cleanup_candidates


# =========================================================
# ROUTER
# =========================================================

# Create a router for all feature-flag related APIs.
router = APIRouter()


# =========================================================
# DATABASE SESSION
# =========================================================

# Each API request gets a database session through this function.
def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# =========================================================
# FEATURE FLAGS
# =========================================================


# GET /flags
# Returns all feature flags stored in the database.
@router.get("/flags")
def get_all_flags(
    db: Session = Depends(get_db)
):
    # Fetch all records from the Flag table.
    flags = db.query(Flag).all()

    return flags


# GET /flags/{flag_id}
# Returns a single feature flag using its ID.
@router.get("/flags/{flag_id}")
def get_flag_by_id(
    flag_id: int,
    db: Session = Depends(get_db)
):
    # Search for the flag with the given ID.
    flag = (
        db.query(Flag)
        .filter(Flag.flag_id == flag_id)
        .first()
    )

    # If no flag exists with that ID, return a 404 error.
    if flag is None:
        raise HTTPException(
            status_code=404,
            detail="Flag not found"
        )

    return flag


# =========================================================
# FEATURE FLAG EVALUATION
# =========================================================


# POST /evaluate
# Evaluates a feature flag for a given environment and user context.
@router.post("/evaluate")
def evaluate(
    request: EvaluationRequest,
    db: Session = Depends(get_db)
):
    # Call the existing evaluation engine.
    result = evaluate_flag(
        db=db,
        flag_key=request.flag_key,
        environment_name=request.environment_name,
        user_context=request.user_context
    )

    return result


# =========================================================
# EVALUATION ANALYTICS
# =========================================================


# GET /evaluation-analytics
# Returns evaluation counts for all feature flags.
@router.get("/evaluation-analytics")
def get_evaluation_analytics(
    db: Session = Depends(get_db)
):
    analytics = (
        db.query(EvaluationAnalytics)
        .order_by(
            EvaluationAnalytics.evaluation_date,
            EvaluationAnalytics.evaluation_hour
        )
        .all()
    )

    return analytics


# =========================================================
# CREATE FEATURE FLAG
# =========================================================


# POST /flags
# Creates a new feature flag and records an audit log.
@router.post("/flags")
def create_flag(
    request: FlagCreate,
    db: Session = Depends(get_db)
):
    # Create a new Feature Flag using the request data.
    new_flag = Flag(
        environment_id=request.environment_id,
        key=request.key,
        type=request.type,
        default_value=request.default_value,
        enabled=request.enabled,
        description=request.description,
        owner_team=request.owner_team
    )

    # Add the new flag to the database.
    db.add(new_flag)

    # Commit so the database generates the flag_id.
    db.commit()

    # Refresh to get the generated flag_id.
    db.refresh(new_flag)

    # Store the newly created flag state.
    new_state = {
        "key": new_flag.key,
        "type": new_flag.type,
        "default_value": new_flag.default_value,
        "enabled": new_flag.enabled,
        "description": new_flag.description,
        "owner_team": new_flag.owner_team
    }

    # Create an audit log for the flag creation.
    create_audit_log(
        db=db,
        flag_id=new_flag.flag_id,
        actor="system",
        action="CREATE",
        environment_id=new_flag.environment_id,
        previous_state=None,
        new_state=new_state
    )

    # Save the audit log.
    db.commit()

    return new_flag


# =========================================================
# UPDATE FEATURE FLAG
# =========================================================


# PUT /flags/{flag_id}
# Updates an existing feature flag and records an audit log.
@router.put("/flags/{flag_id}")
def update_flag(
    flag_id: int,
    request: FlagUpdate,
    db: Session = Depends(get_db)
):
    # Find the flag using its ID.
    flag = (
        db.query(Flag)
        .filter(Flag.flag_id == flag_id)
        .first()
    )

    # If the flag does not exist, return a 404 error.
    if flag is None:
        raise HTTPException(
            status_code=404,
            detail="Flag not found"
        )

    # Get the environment using environment_id.
    environment = (
        db.query(Environment)
        .filter(
            Environment.environment_id == flag.environment_id
        )
        .first()
    )

    # Store the old flag state before updating.
    previous_state = {
        "key": flag.key,
        "type": flag.type,
        "default_value": flag.default_value,
        "enabled": flag.enabled,
        "description": flag.description,
        "owner_team": flag.owner_team
    }

    # Update the flag fields.
    flag.key = request.key
    flag.type = request.type
    flag.default_value = request.default_value
    flag.enabled = request.enabled
    flag.description = request.description
    flag.owner_team = request.owner_team

    # Save the updated flag.
    db.commit()

    # Clear cached values for this flag.
    if environment:
        cache_pattern = f"{environment.name}:{flag.key}:*"

        for key in redis_client.scan_iter(
            match=cache_pattern
        ):
            redis_client.delete(key)

    # Refresh the object with updated database values.
    db.refresh(flag)

    # Store the new flag state after updating.
    new_state = {
        "key": flag.key,
        "type": flag.type,
        "default_value": flag.default_value,
        "enabled": flag.enabled,
        "description": flag.description,
        "owner_team": flag.owner_team
    }

    # Create an audit log for the update.
    create_audit_log(
        db=db,
        flag_id=flag.flag_id,
        actor="system",
        action="UPDATE",
        environment_id=flag.environment_id,
        previous_state=previous_state,
        new_state=new_state
    )

    # Save the audit log.
    db.commit()

    return flag


# =========================================================
# DELETE FEATURE FLAG
# =========================================================


# DELETE /flags/{flag_id}
# Deletes an existing feature flag and records an audit log.
@router.delete("/flags/{flag_id}")
def delete_flag(
    flag_id: int,
    db: Session = Depends(get_db)
):
    # Find the flag using its ID.
    flag = (
        db.query(Flag)
        .filter(Flag.flag_id == flag_id)
        .first()
    )

    # If the flag does not exist, return a 404 error.
    if flag is None:
        raise HTTPException(
            status_code=404,
            detail="Flag not found"
        )

    # Get the environment using environment_id.
    environment = (
        db.query(Environment)
        .filter(
            Environment.environment_id == flag.environment_id
        )
        .first()
    )

    # Save the flag state before deleting it.
    previous_state = {
        "key": flag.key,
        "type": flag.type,
        "default_value": flag.default_value,
        "enabled": flag.enabled,
        "description": flag.description,
        "owner_team": flag.owner_team
    }

    # Create the Redis cache pattern before deleting the flag.
    cache_pattern = None

    if environment:
        cache_pattern = (
            f"{environment.name}:{flag.key}:*"
        )

    # Create the audit log before deleting the flag.
    create_audit_log(
        db=db,
        flag_id=flag.flag_id,
        actor="system",
        action="DELETE",
        environment_id=flag.environment_id,
        previous_state=previous_state,
        new_state=None
    )

    # Delete the flag.
    db.delete(flag)

    # Save both the deletion and audit log.
    db.commit()

    # Delete cached values for the flag.
    if cache_pattern:

        for key in redis_client.scan_iter(
            match=cache_pattern
        ):
            redis_client.delete(key)

    return {
        "success": True,
        "message": "Feature flag deleted successfully"
    }


# =========================================================
# FLAG CLEANUP CANDIDATES
# =========================================================


# GET /flag-cleanup/candidates
#
# Identifies feature flags that are safe candidates
# for cleanup from the codebase.
#
# A flag becomes a candidate when it has been:
#
# 1. Fully disabled across all environments
# OR
# 2. Fully rolled out to 100% across all environments
#
# for the configured number of days.
@router.get("/flag-cleanup/candidates")
def get_flag_cleanup_candidates(
    # Number of days the flag must remain fully disabled
    # or fully rolled out before becoming a cleanup candidate.
    days: int = Query(
        30,
        ge=1
    ),

    # Database session.
    db: Session = Depends(get_db)
):
    # Find flags that are eligible for cleanup.
    candidates = check_flag_cleanup_candidates(
        db=db,
        days=days
    )

    # Return cleanup candidates.
    return {
        "success": True,

        # Number of days used for cleanup evaluation.
        "days": days,

        # Total number of candidates.
        "count": len(candidates),

        # Candidate flag information.
        "candidates": candidates
    }


# =========================================================
# TARGETING RULES
# =========================================================


# GET /targeting-rules
# Returns all targeting rules.
@router.get("/targeting-rules")
def get_all_targeting_rules(
    db: Session = Depends(get_db)
):
    # Fetch all targeting rules from the database.
    rules = db.query(TargetingRule).all()

    return rules


# GET /targeting-rules/{rule_id}
# Returns one targeting rule using its ID.
@router.get("/targeting-rules/{rule_id}")
def get_targeting_rule_by_id(
    rule_id: int,
    db: Session = Depends(get_db)
):
    # Find the targeting rule by its ID.
    rule = (
        db.query(TargetingRule)
        .filter(
            TargetingRule.rule_id == rule_id
        )
        .first()
    )

    # If the rule doesn't exist, return an error.
    if rule is None:
        raise HTTPException(
            status_code=404,
            detail="Targeting rule not found"
        )

    return rule


# =========================================================
# UPDATE TARGETING RULE
# =========================================================


# PUT /targeting-rules/{rule_id}
# Updates an existing targeting rule and records an audit log.
@router.put("/targeting-rules/{rule_id}")
def update_targeting_rule(
    rule_id: int,
    request: TargetingRuleUpdate,
    db: Session = Depends(get_db)
):
    # =====================================================
    # FIND EXISTING RULE
    # =====================================================

    rule = (
        db.query(TargetingRule)
        .filter(
            TargetingRule.rule_id == rule_id
        )
        .first()
    )

    if rule is None:
        raise HTTPException(
            status_code=404,
            detail="Targeting rule not found"
        )

    # =====================================================
    # FIND OLD FLAG
    # =====================================================

    old_flag = (
        db.query(Flag)
        .filter(
            Flag.flag_id == rule.flag_id
        )
        .first()
    )

    if old_flag is None:
        raise HTTPException(
            status_code=404,
            detail="Existing feature flag not found"
        )

    # =====================================================
    # FIND NEW FLAG
    # =====================================================

    new_flag = (
        db.query(Flag)
        .filter(
            Flag.flag_id == request.flag_id
        )
        .first()
    )

    if new_flag is None:
        raise HTTPException(
            status_code=404,
            detail="Selected feature flag not found"
        )

    # =====================================================
    # PREVIOUS STATE
    # =====================================================

    previous_state = {
        "rule_id": rule.rule_id,
        "flag_id": rule.flag_id,
        "attribute": rule.attribute,
        "operator": rule.operator,
        "value": rule.value
    }

    # =====================================================
    # UPDATE RULE
    # =====================================================

    rule.flag_id = request.flag_id
    rule.attribute = request.attribute
    rule.operator = request.operator
    rule.value = request.value

    # =====================================================
    # SAVE CHANGES
    # =====================================================

    db.commit()

    # Refresh updated database object.
    db.refresh(rule)

    # =====================================================
    # NEW STATE
    # =====================================================

    new_state = {
        "rule_id": rule.rule_id,
        "flag_id": rule.flag_id,
        "attribute": rule.attribute,
        "operator": rule.operator,
        "value": rule.value
    }

    # =====================================================
    # AUDIT LOG
    # =====================================================

    create_audit_log(
        db=db,
        flag_id=rule.flag_id,
        actor="system",
        action="TARGETING_RULE_UPDATE",
        environment_id=new_flag.environment_id,
        previous_state=previous_state,
        new_state=new_state
    )

    # Save audit log.
    db.commit()

    return rule


# =========================================================
# DELETE TARGETING RULE
# =========================================================


# DELETE /targeting-rules/{rule_id}
# Deletes an existing targeting rule.
@router.delete("/targeting-rules/{rule_id}")
def delete_targeting_rule(
    rule_id: int,
    db: Session = Depends(get_db)
):
    # Find the targeting rule using its ID.
    rule = (
        db.query(TargetingRule)
        .filter(
            TargetingRule.rule_id == rule_id
        )
        .first()
    )

    # If the rule does not exist, return an error.
    if rule is None:
        raise HTTPException(
            status_code=404,
            detail="Targeting rule not found"
        )

    # Delete the targeting rule.
    db.delete(rule)

    # Save the deletion.
    db.commit()

    # Return a success message.
    return {
        "success": True,
        "message": "Targeting rule deleted successfully"
    }


# =========================================================
# ENVIRONMENTS
# =========================================================


# GET /environments
# Returns all environments stored in the database.
@router.get("/environments")
def get_all_environments(
    db: Session = Depends(get_db)
):
    # Fetch all environments from the database.
    environments = db.query(Environment).all()

    return environments


# GET /environments/{environment_id}
# Returns one environment using its ID.
@router.get("/environments/{environment_id}")
def get_environment_by_id(
    environment_id: int,
    db: Session = Depends(get_db)
):
    # Find the environment using the ID.
    environment = (
        db.query(Environment)
        .filter(
            Environment.environment_id == environment_id
        )
        .first()
    )

    # If the environment does not exist, return an error.
    if environment is None:
        raise HTTPException(
            status_code=404,
            detail="Environment not found"
        )

    return environment


# POST /environments
# Creates a new environment.
@router.post("/environments")
def create_environment(
    request: EnvironmentCreate,
    db: Session = Depends(get_db)
):
    # Create a new Environment object.
    new_environment = Environment(
        name=request.name,
        description=request.description
    )

    # Add the environment to the database.
    db.add(new_environment)

    # Save the new environment.
    db.commit()

    # Get generated ID and timestamps.
    db.refresh(new_environment)

    return new_environment


# PUT /environments/{environment_id}
# Updates an existing environment.
@router.put("/environments/{environment_id}")
def update_environment(
    environment_id: int,
    request: EnvironmentUpdate,
    db: Session = Depends(get_db)
):
    # Find the environment.
    environment = (
        db.query(Environment)
        .filter(
            Environment.environment_id == environment_id
        )
        .first()
    )

    # If the environment does not exist, return an error.
    if environment is None:
        raise HTTPException(
            status_code=404,
            detail="Environment not found"
        )

    # Update environment fields.
    environment.name = request.name
    environment.description = request.description

    # Save changes.
    db.commit()

    # Refresh updated object.
    db.refresh(environment)

    return environment


# DELETE /environments/{environment_id}
# Deletes an existing environment.
@router.delete("/environments/{environment_id}")
def delete_environment(
    environment_id: int,
    db: Session = Depends(get_db)
):
    # Find the environment.
    environment = (
        db.query(Environment)
        .filter(
            Environment.environment_id == environment_id
        )
        .first()
    )

    # If the environment does not exist, return an error.
    if environment is None:
        raise HTTPException(
            status_code=404,
            detail="Environment not found"
        )

    # Delete the environment.
    db.delete(environment)

    # Save the deletion.
    db.commit()

    # Return a success message.
    return {
        "success": True,
        "message": "Environment deleted successfully"
    }