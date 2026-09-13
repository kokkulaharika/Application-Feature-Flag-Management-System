from sqlalchemy.orm import Session
from App.Models.environment import Environment
from App.Models.flag import Flag
from App.Models.targeting_rule import TargetingRule
from App.Models.user_group_membership import UserGroupMembership
from App.Services.rollout_service import is_user_in_rollout
from App.Services.evaluation_analytics_service import track_flag_evaluation
from App.cache.redis_client import redis_client


def evaluate_flag(
    db: Session,
    flag_key: str,
    environment_name: str,
    user_context: dict | None = None
):
    # Find the environment
    environment = (
        db.query(Environment)
        .filter(Environment.name == environment_name)
        .first()
    )

    if environment is None:
        return {
            "success": False,
            "message": "Environment not found"
        }

    # Find the flag in that environment
    flag = (
        db.query(Flag)
        .filter(
            Flag.key == flag_key,
            Flag.environment_id == environment.environment_id
        )
        .first()
    )

    if flag is None:
        return {
            "success": False,
            "message": "Feature flag not found"
        }
    # Count this flag evaluation
    track_flag_evaluation(flag.flag_id)    
    user_id = str(user_context.get("user_id")) if user_context else "default"
    cache_key = f"{environment.name}:{flag.key}:{user_id}"    
    cached_value = redis_client.get(cache_key)
    if cached_value is not None:
      return {
        "success": True,
        "message": "Returned from redis cache",
        "environment": environment.name,
        "flag": flag.key,
        "enabled": cached_value == "true",
        "value": flag.default_value,
        "user_context": user_context
    }    
    
     

    # flag is enabled for specific user IDs listed in the targeting_rule table
    if user_context:
        user_id = str(user_context.get("user_id"))
        rule = (
             db.query(TargetingRule)
        .filter(
            TargetingRule.flag_id == flag.flag_id,
            TargetingRule.attribute == "user_id",
            TargetingRule.operator == "=",
            TargetingRule.value == user_id
        )
        .first()
        )

        if rule:
            redis_client.set(cache_key, str(flag.default_value).lower())
            return{
                "success": True,
                "message":"flag is enabled for this user",
                "environment": environment_name,
                "enabled": True,
                "value": flag.default_value,
                "user_context": user_context
            } 
    
    #Group targeting rules
    if user_context:
        user_id = str(user_context.get("user_id"))
        
        group_rule = (
            db.query(UserGroupMembership)
            .filter(UserGroupMembership.user_id == user_id).first()
        )
        
        if group_rule:
            rule = (
                db.query(TargetingRule)
                .filter( 
                    TargetingRule.flag_id == flag.flag_id,
                    TargetingRule.attribute == "group_name",
                    TargetingRule.operator == "=",
                    TargetingRule.value == group_rule.group_name
                )
                .first()
            )
            if rule:
              redis_client.set(cache_key, str(flag.default_value).lower())
              return{
                "success": True,
                "message": "Matched group targeting rules",
                "environment": environment_name,
                "flag": flag_key,
                "enabled": True,
                "value": flag.default_value,
                "user_context": user_context
            }

    # Implementing percentage Rollouts
    if user_context:
        user_id = user_context.get("user_id")
        rollout_rule = (
        db.query(TargetingRule)
        .filter(
            TargetingRule.flag_id == flag.flag_id,
            TargetingRule.attribute == "rollout_percentage"
        )
        .first())
        if rollout_rule:
           rollout_percentage = int(rollout_rule.value)
           if is_user_in_rollout(
            user_id=user_id,
            flag_key=flag.key,
            rollout_percentage=rollout_percentage
        ):
            redis_client.set(cache_key, str(flag.default_value).lower())
            return {
                "success": True,
                "message": "Matched Percentage Rollout",
                "environment": environment.name,
                "flag": flag.key,
                "enabled": True,
                "value": flag.default_value,
                "user_context": user_context
            }     
              
            
    # Return default flag state
    redis_client.set(cache_key, str(flag.default_value).lower())
    return {
        "success": True,
        "environment": environment.name,
        "flag": flag.key,
        "type": flag.type,
        "enabled": flag.enabled,
        "value": flag.default_value,
        "user_context": user_context
    }


