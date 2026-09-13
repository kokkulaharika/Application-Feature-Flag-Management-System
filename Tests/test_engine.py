from App.Database.session import SessionLocal
from App.Services.evalution_engine import evaluate_flag

# Test 1: Verify that the evaluation engine returns the default value
# when no targeting rules are applied.
def test_default_value_fallback():
    db = SessionLocal()
    # Evaluate the 'dark_mode' feature in the Development environment
    result = evaluate_flag(
        db=db,
        flag_key="dark_mode",
        environment_name="Development",
        user_context=None
    )
    # Verify that the evaluation was successful
    assert result["success"] is True
    # Verify that the default value of the feature is returned
    assert result["value"] == "true"
    db.close()

#Test2: Disabled state of a feature flag
def test_disabled_flag():
    db = SessionLocal()
    result = evaluate_flag(
        db=db,
        flag_key="dark_mode",
        environment_name="Production",
        user_context=None
    )
    assert result["success"] is True
    assert result["enabled"] is False
    db.close()

#Test3: feature configuration for the selected environment
def test_environment_override():
    db = SessionLocal()
    result = evaluate_flag(
        db=db,
        flag_key="dark_mode",
        environment_name="Production",
        user_context=None
    )
    assert result["success"] is True
    assert result["environment"] == "Production"
    assert result["enabled"] is False
    db.close()   

#Test4: when an only one user context is provided.(user targeting rules)
def test_empty_user_context():
    db = SessionLocal()
    result = evaluate_flag(
        db=db,
        flag_key="dark_mode",
        environment_name="Development",
        user_context= {"user_id":101}
    )
    print(result)
    assert result["success"] is True
    assert result["user_context"] == {"user_id":101}
    db.close()      
    
# Test5: when group targeting rules are provided (group targeting rules)
def test_group_context():
    db = SessionLocal()
    result = evaluate_flag(
        db = db,
        flag_key="dark_mode",
        environment_name="Development",
        user_context={"user_id":101}
    )
    print(result)
    assert result["success"] is True
    assert result["enabled"] is True
    assert result["user_context"] == {"user_id": 101}
    db.close()

#Test6: percentage rollouts
def test_rollout():
    db = SessionLocal()
    result = evaluate_flag(
        db=db,
        flag_key="dark_mode",
        environment_name="Production",
        user_context={"user_id": 102}
    )
    print(result)
    assert result["success"] is True
    assert result["user_context"] == {"user_id": 102}
    db.close()