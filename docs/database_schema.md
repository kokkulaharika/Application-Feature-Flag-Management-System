# Database Schema Documentation

## Project: Application Feature Management and Release Control System

# 1. Overview

The **Application Feature Management and Release Control System** is a backend application that allows software teams to safely release new features without redeploying the application.

Instead of enabling a feature for all users at once, the system allows features to be released gradually by using **Feature Flags**.

Examples:
- Enable a feature only in Development.
- Enable a feature only for Beta Users.
- Enable a feature for 20% of users.
- Disable a feature instantly if any issue occurs.

To support these functionalities, the application uses a PostgreSQL database consisting of six main tables.

# 2. Database Information

| Property | Value |
|----------|-------|
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Migration Tool | Alembic |
| Backend | FastAPI |

# 3. Database Tables

The database contains the following six application tables:

1. Environments
2. Flags
3. Flag Versions
4. Targeting Rules
5. User Group Memberships
6. Audit Logs

Alembic also creates one additional table:

- alembic_version (used internally for database version tracking)

# 4. Table Details

# 4.1 Environments Table

## Purpose

The **Environments** table stores all deployment environments.

Applications usually have multiple environments during development.

Examples:

- Development
- Staging
- Production

A feature may be enabled in Development but disabled in Production.

## Fields

| Field | Type | Description |
|--------|------|-------------|
| environment_id | Integer | Unique ID of the environment (Primary Key) |
| name | String | Environment name |
| description | Text | Description of the environment |
| created_at | DateTime | Record creation time |
| updated_at | DateTime | Last updated time |

# 4.2 Flags Table

## Purpose

The Flags table stores all Feature Flags used by the application.

Each feature is represented by one flag.

Example:

- dark_mode
- new_dashboard
- ai_search

The application checks this table before enabling a feature.

---

## Fields

| Field | Type | Description |
|--------|------|-------------|
| flag_id | Integer | Primary Key |
| environment_id | Integer | Environment where the flag belongs |
| flag_key | String | Unique feature flag name |
| flag_type | String | Data type (Boolean, String, Number) |
| default_value | String | Default value if no rule matches |
| enabled | Boolean | Indicates whether the flag is enabled |
| description | Text | Description of the feature |
| owner_team | String | Team responsible for the flag |
| created_at | DateTime | Record creation time |
| updated_at | DateTime | Last updated time |

# 4.3 Flag Versions Table

## Purpose

Every modification made to a feature flag is stored as a new version.

This allows the team to:

- Track changes
- Restore old configurations
- Maintain version history

## Fields

| Field | Type | Description |
|--------|------|-------------|
| version_id | Integer | Primary Key |
| flag_id | Integer | Reference to Flags table |
| version_number | Integer | Version number |
| flag_data | JSON | Complete flag configuration |
| changed_by | String | User who modified the flag |
| created_at | DateTime | Version creation time |

# 4.4 Targeting Rules Table

## Purpose

Targeting Rules determine which users receive a feature.

The system supports:

- User targeting
- Group targeting
- Percentage rollout

Examples:

- Enable only for User 101
- Enable for Premium Users
- Enable for 20% of users

---

## Fields

| Field | Type | Description |
|--------|------|-------------|
| rule_id | Integer | Primary Key |
| flag_id | Integer | Related Feature Flag |
| rule_type | String | User, Group or Percentage |
| target_value | String | User ID, Group Name or Percentage |
| enabled | Boolean | Rule status |
| priority | Integer | Rule evaluation order |
| created_at | DateTime | Creation time |

---

# 4.5 User Group Memberships Table

## Purpose

Stores information about which users belong to which groups.
These groups are used while evaluating feature flags.

Example groups:

- beta_users
- premium_plan
- internal_team

---

## Fields

| Field | Type | Description |
|--------|------|-------------|
| membership_id | Integer | Primary Key |
| user_id | Integer | User ID |
| group_name | String | Group name |
| created_at | DateTime | Creation time |

---

# 4.6 Audit Logs Table

## Purpose

Stores every action performed in the Feature Flag System.
It provides complete history for tracking changes.

Examples:

- Flag Created
- Flag Updated
- Flag Enabled
- Flag Disabled

---

## Fields

| Field | Type | Description |
|--------|------|-------------|
| audit_id | Integer | Primary Key |
| flag_id | Integer | Related Flag |
| actor | String | Person who performed the action |
| action | String | CREATE, UPDATE, DELETE, ENABLE, DISABLE |
| previous_state | JSON | Previous flag configuration |
| new_state | JSON | Updated flag configuration |
| timestamp | DateTime | Action time |


# 5. Alembic Version Table

The **alembic_version** table is automatically created by Alembic.
It is **not** part of the application database.

Purpose:

- Tracks the current database schema version.
- Keeps a record of which migrations have been applied.
- Prevents duplicate migrations.
- Supports database upgrades and rollbacks.


