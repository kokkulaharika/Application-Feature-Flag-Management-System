# Application Feature Management and Release Control System

## Project Overview

The Application Feature Management and Release Control System is a backend system designed to manage feature flags across multiple environments and control feature releases using user targeting, group targeting, percentage rollouts, and environment-specific configurations.

The system provides REST APIs for managing feature flags, environments, targeting rules, and feature flag evaluation.

---

## Technology Stack

- **Backend:** Python, FastAPI
- **Frontend:** Reactjs,css3
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Caching:** Redis
- **API Documentation:** Swagger 
- **Testing:** Pytest
- **Database Migration:** Alembic
- **Server:** Uvicorn
- **Version Control:** Git, GitHub

---

# Milestones

## Milestone 1 — Flag Schema, Database Models & Core Flag Evaluation Engine

### Weeks 1–2

- Designed the PostgreSQL schema for environments, feature flags, flag versions, targeting rules, user-group memberships, and audit logs with indexing on `flag_key` and `environment_id`.
- Implemented the feature flag data model with:
  - Flag key
  - Flag type
  - Default value
  - Enabled state
  - Description
  - Owner team
  - Environment association
- Built the core feature flag evaluation engine using flag key, environment, and user context.
- Implemented boolean flag evaluation with enabled/disabled state and environment-specific configuration.
- Added unit tests covering:
  - Default value fallback
  - Environment-specific evaluation
  - Disabled flag state
  - Empty user context

---

## Milestone 2 — User/Group Targeting, Percentage Rollouts & REST API

### Weeks 3–4

- Implemented **user targeting rules** to enable feature flags for specific users.
- Implemented **group targeting rules** for groups such as:
  - `beta_users`
  - `premium_plan`
  - `internal_team`
- Implemented **percentage-based rollouts** using deterministic user assignment based on `user_id` and `flag_key`.
- Built REST APIs for:
  - Feature flag CRUD
  - Targeting rule management
  - Environment management
  - Feature flag evaluation
- Added **Redis caching** for feature flag evaluation results.
- Implemented **Redis cache invalidation** when feature flags are updated or deleted to prevent stale evaluation results.
- Added and updated unit tests for the evaluation engine and Milestone 2 functionality.

---

## Current API Endpoints

### Feature Flags

- `GET /flags`
- `POST /flags`
- `GET /flags/{flag_id}`
- `PUT /flags/{flag_id}`
- `DELETE /flags/{flag_id}`

### Feature Flag Evaluation

- `POST /evaluate`

### Targeting Rules

- `GET /targeting-rules`
- `POST /targeting-rules`
- `GET /targeting-rules/{rule_id}`
- `PUT /targeting-rules/{rule_id}`
- `DELETE /targeting-rules/{rule_id}`

### Environments

- `GET /environments`
- `POST /environments`
- `GET /environments/{environment_id}`
- `PUT /environments/{environment_id}`
- `DELETE /environments/{environment_id}`

  # Milestone 3 – Middleware Integration, Audit Logs & Admin Dashboard

## Weeks 5–6

### Overview

Milestone 3 focuses on integrating feature flags with consuming applications, improving system traceability through audit logging, adding evaluation analytics, developing the React.js admin dashboard, and providing automated flag cleanup capabilities.

## 1. Python Middleware Integration

* Developed a Python middleware/helper client for consuming applications.
* Enables applications to query feature flags through the flag API.
* Supports local caching of flag states to reduce repeated API requests.
* Helps reduce per-request latency and improves evaluation efficiency.

## 2. Audit Logging

* Implemented comprehensive audit logging for feature flag operations.
* Records actions such as:

  * Flag creation
  * Flag updates
  * Flag enable/disable
  * Targeting rule changes
* Stores:

  * Actor/user
  * Timestamp
  * Environment
  * Previous state
  * New state
  * JSON state differences
* Added API support to retrieve and view audit logs.

## 3. Flag Evaluation Analytics

* Implemented evaluation tracking for feature flags.
* Tracks the number of evaluations performed for each flag per hour.
* Uses Redis for temporary hourly counters.
* Aggregated evaluation data is flushed to PostgreSQL daily.
* Added analytics API and dashboard visualization to monitor actively evaluated flags.

### Evaluation Flow

```text
Feature Flag Evaluation
        ↓
Redis Hourly Counter
        ↓
Daily Aggregation
        ↓
PostgreSQL
        ↓
Evaluation Analytics API
        ↓
React Dashboard / Recharts
```

## 4. React.js Admin Dashboard

Developed an admin dashboard for managing and monitoring feature flags.

### Dashboard Features

* Feature flag management
* Environment management 
* Targeting rule configuration
* Percentage rollout slider
* Evaluation count metrics
* Recharts-based analytics visualization
* Audit log viewer
* User and flag-based audit log filtering
* Add/Edit functionality for flags, environments, and targeting rules

## 5. Flag Cleanup Tooling

* Implemented backend tooling to identify feature flags that may be safely removed.
* Detects flags that are:

  * Fully rolled out at 100%, or
  * Fully disabled
* Checks whether the flag has remained in that state for more than the configured number of days.
* Returns eligible flags as cleanup candidates.
* Helps teams identify stale flags and reduce unnecessary feature-flag code.

### Cleanup Flow

```text
Feature Flags
      ↓
Check Rollout / Disabled State
      ↓
Check Duration (N Days)
      ↓
Identify Cleanup Candidates
      ↓
Safe Removal Review
```

## Milestone 3 Outcome

Milestone 3 delivers middleware integration, complete audit tracking, hourly evaluation analytics, a React-based administration dashboard, and automated flag cleanup identification, providing improved performance, observability, management, and maintainability of the feature flag system.




