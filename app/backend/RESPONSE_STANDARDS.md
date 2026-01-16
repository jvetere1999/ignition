# RESPONSE WRAPPER STANDARDS

**Version**: 1.0  
**Last Updated**: January 15, 2026  
**Status**: Active Standard  
**Authority**: Backend Response Serialization  

---

## OVERVIEW

This document defines standardized response wrapper patterns for the Passion OS backend API. All endpoint responses follow these standards to ensure consistency, predictability, and ease of client integration.

---

## GENERIC RESPONSE TYPES

All responses use generic types from `crate::shared::http::response`. Never create custom wrapper structs.

### ApiResponse<T> - Standard OK (200)

```rust
use crate::shared::http::response::ApiResponse;

// Usage: Single resource response
let habit = HabitResponse { ... };
Ok(Json(ApiResponse::ok(habit)))

// JSON Output:
// {
//   "success": true,
//   "data": { habit_data }
// }
```

**When to use**: Single resource GET endpoints (get user, get habit, etc.)

### Created<T> - Resource Created (201)

```rust
use crate::shared::http::response::Created;

// Usage: POST endpoints that create resources
let habit = HabitsRepo::create(...).await?;
Ok((StatusCode::CREATED, Json(Created::new(habit))))

// JSON Output:
// {
//   "data": { created_resource }
// }
```

**When to use**: POST endpoints that create new resources (POST /habits, POST /goals, etc.)

### PaginatedResponse<T> - List with Pagination (200)

```rust
use crate::shared::http::response::PaginatedResponse;

// Usage: List endpoints with pagination
let items = HabitsRepo::list(...).await?;
let total = HabitsRepo::count(...).await?;
let response = PaginatedResponse::new(
    items,      // Vec<T>
    total,      // i64 total count
    page,       // i64 page number (1-indexed)
    page_size,  // i64 items per page
);
Ok(Json(response))

// JSON Output:
// {
//   "items": [ {...}, {...} ],
//   "total": 42,
//   "page": 1,
//   "page_size": 20,
//   "total_pages": 3,
//   "has_next": true,
//   "has_previous": false
// }
```

**When to use**: Any list endpoint with pagination support (GET /habits, GET /quests, etc.)

### Deleted - Deletion Success (200)

```rust
use crate::shared::http::response::Deleted;

// Usage: DELETE endpoints
HabitsRepo::delete(&state.db, user_id, habit_id).await?;
Ok(Json(Deleted::ok()))

// JSON Output:
// {
//   "deleted": true
// }
```

**When to use**: DELETE endpoints that remove resources

### Helper Functions - Direct JSON (200)

```rust
use crate::shared::http::response::{ok, created};

// Direct response wrapping (no extra wrapper struct)
ok(habit_data)           // Returns (StatusCode::OK, Json(habit_data))
created(habit_data)      // Returns (StatusCode::CREATED, Json(habit_data))
```

**When to use**: Simple responses that don't need wrapper structure

### NoContent - No Response Body (204)

```rust
use crate::shared::http::response::NoContent;

// Usage: Operations with no response body
NoContent
```

**When to use**: PATCH operations that succeed silently (rare)

---

## MIGRATION GUIDE

### Before (Custom Wrappers)

```rust
// habits.rs
#[derive(Serialize)]
struct HabitResponseWrapper {
    habit: HabitResponse,
}

#[derive(Serialize)]
struct HabitsListWrapper {
    habits: Vec<HabitResponse>,
    total: i64,
}

// In handlers:
async fn get_habit(...) -> Result<Json<HabitResponseWrapper>, AppError> {
    let habit = HabitsRepo::get(...).await?;
    Ok(Json(HabitResponseWrapper { habit }))
}

async fn list_habits(...) -> Result<Json<HabitsListWrapper>, AppError> {
    let habits = HabitsRepo::list(...).await?;
    let total = HabitsRepo::count(...).await?;
    Ok(Json(HabitsListWrapper { habits, total }))
}

async fn create_habit(...) -> Result<(StatusCode, Json<HabitResponseWrapper>), AppError> {
    let habit = HabitsRepo::create(...).await?;
    Ok((StatusCode::CREATED, Json(HabitResponseWrapper { habit })))
}
```

### After (Generic Types)

```rust
// No custom wrappers needed!

// In handlers:
use crate::shared::http::response::{ApiResponse, Created, PaginatedResponse};

async fn get_habit(...) -> Result<Json<ApiResponse<HabitResponse>>, AppError> {
    let habit = HabitsRepo::get(...).await?;
    Ok(Json(ApiResponse::ok(habit)))
}

async fn list_habits(...) -> Result<Json<PaginatedResponse<HabitResponse>>, AppError> {
    let habits = HabitsRepo::list(...).await?;
    let total = HabitsRepo::count(...).await?;
    Ok(Json(PaginatedResponse::new(habits, total, page, page_size)))
}

async fn create_habit(...) -> Result<(StatusCode, Json<Created<HabitResponse>>), AppError> {
    let habit = HabitsRepo::create(...).await?;
    Ok((StatusCode::CREATED, Json(Created::new(habit))))
}
```

**Benefits**:
- ❌ No custom wrapper structs (eliminated)
- ✅ Consistent field names across all endpoints
- ✅ Consistent JSON structure
- ✅ Reusable generic types
- ✅ Type-safe constructors with validation

---

## COMMON PATTERNS

### Pattern 1: Single Resource GET

```rust
// GET /habits/:id
async fn get_habit(...) -> Result<Json<ApiResponse<HabitResponse>>, AppError> {
    let habit = HabitsRepo::get(&state.db, user_id, habit_id)
        .await?
        .ok_or_else(|| AppError::not_found("Habit not found"))?;
    
    Ok(Json(ApiResponse::ok(habit)))
}
```

**Response**:
```json
{
  "success": true,
  "data": { "id": "...", "name": "..." }
}
```

### Pattern 2: List with Pagination

```rust
// GET /habits?page=1&page_size=20
async fn list_habits(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(pagination): Query<PaginationParams>,
) -> Result<Json<PaginatedResponse<HabitResponse>>, AppError> {
    let habits = HabitsRepo::list_paginated(
        &state.db,
        user.id,
        pagination.page,
        pagination.page_size,
    ).await?;
    
    let total = HabitsRepo::count(&state.db, user.id).await?;
    
    Ok(Json(PaginatedResponse::new(
        habits,
        total,
        pagination.page,
        pagination.page_size,
    )))
}
```

**Response**:
```json
{
  "items": [
    { "id": "...", "name": "..." },
    { "id": "...", "name": "..." }
  ],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "total_pages": 3,
  "has_next": true,
  "has_previous": false
}
```

### Pattern 3: Create Resource

```rust
// POST /habits
async fn create_habit(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Json(req): Json<CreateHabitRequest>,
) -> Result<(StatusCode, Json<Created<HabitResponse>>), AppError> {
    let habit = HabitsRepo::create(&state.db, user.id, &req).await?;
    let response = HabitResponse::from(habit);
    Ok((StatusCode::CREATED, Json(Created::new(response))))
}
```

**Response** (Status 201):
```json
{
  "data": { "id": "...", "name": "...", ... }
}
```

### Pattern 4: Delete Resource

```rust
// DELETE /habits/:id
async fn delete_habit(...) -> Result<Json<Deleted>, AppError> {
    HabitsRepo::delete(&state.db, user_id, habit_id).await?;
    Ok(Json(Deleted::ok()))
}
```

**Response**:
```json
{
  "deleted": true
}
```

### Pattern 5: Update Resource (Success Message)

```rust
// PUT /habits/:id
async fn update_habit(...) -> Result<Json<ApiResponse<HabitResponse>>, AppError> {
    let updated = HabitsRepo::update(&state.db, user_id, habit_id, &req).await?;
    Ok(Json(ApiResponse::ok(updated)))
}
```

**Response**:
```json
{
  "success": true,
  "data": { "id": "...", "updated_field": "..." }
}
```

---

## CUSTOM SERIALIZATION (Advanced)

For special cases where field names don't match, use `serde` attributes:

```rust
use serde::Serialize;
use crate::shared::http::response::ApiResponse;

#[derive(Serialize)]
pub struct CustomHabitResponse {
    #[serde(rename = "habit_id")]
    pub id: Uuid,
    #[serde(rename = "habit_name")]
    pub name: String,
}

// Usage:
Ok(Json(ApiResponse::ok(CustomHabitResponse {
    id: habit.id,
    name: habit.name,
})))
```

**Output**:
```json
{
  "success": true,
  "data": {
    "habit_id": "...",
    "habit_name": "..."
  }
}
```

---

## CODE REVIEW CHECKLIST

When reviewing response handling:

- [ ] **No Custom Wrappers**: Uses ApiResponse<T>, Created<T>, PaginatedResponse<T>, Deleted, or helper functions
- [ ] **Correct Type**: Chooses appropriate generic type for use case (single vs list, created vs updated)
- [ ] **Status Codes**: Uses correct HTTP status (200, 201, 204, etc.)
- [ ] **Field Names**: Uses consistent names (data, items, deleted, success)
- [ ] **No Hardcoded Serialization**: Uses serde derive, not manual serialization
- [ ] **Error Handling**: Returns proper AppError for failures
- [ ] **Type Safety**: Response type matches actual response structure
- [ ] **Testing**: Response format tested in unit/integration tests

---

## EXAMPLES BY ROUTE TYPE

### Habits Routes
- GET /habits → `Json<PaginatedResponse<HabitResponse>>`
- GET /habits/:id → `Json<ApiResponse<HabitResponse>>`
- POST /habits → `(StatusCode::CREATED, Json<Created<HabitResponse>>)`
- PUT /habits/:id → `Json<ApiResponse<HabitResponse>>`
- DELETE /habits/:id → `Json<Deleted>`

### Quests Routes
- GET /quests → `Json<PaginatedResponse<QuestResponse>>`
- POST /quests → `(StatusCode::CREATED, Json<Created<QuestResponse>>)`
- PATCH /quests/:id/complete → `Json<ApiResponse<CompleteQuestResult>>`

### Authentication Routes
- POST /auth/signin → `(StatusCode::OK, Json<ApiResponse<AuthTokenResponse>>)`
- POST /auth/refresh → `Json<ApiResponse<AuthTokenResponse>>`
- POST /auth/signout → `Json<Deleted>`

---

## FREQUENTLY ASKED QUESTIONS

**Q: Should I create a custom wrapper struct?**  
A: No. Use one of the generic types (ApiResponse, Created, PaginatedResponse, Deleted) or helper functions (ok, created).

**Q: How do I handle responses with multiple different fields?**  
A: Create a response struct that combines all needed fields, then wrap it in ApiResponse<T>:
```rust
#[derive(Serialize)]
pub struct ComplexResponse {
    pub habit: HabitResponse,
    pub streak: StreakInfo,
    pub achievements: Vec<AchievementResult>,
}

Ok(Json(ApiResponse::ok(ComplexResponse { ... })))
```

**Q: What if my response doesn't fit the standard patterns?**  
A: Create a response struct first, then use ApiResponse<T> to wrap it. This ensures consistent outer structure.

**Q: How do I customize field names in the JSON output?**  
A: Use serde attributes:
```rust
#[derive(Serialize)]
pub struct MyResponse {
    #[serde(rename = "custom_name")]
    pub field: String,
}
```

**Q: Should list responses always use PaginatedResponse?**  
A: Prefer PaginatedResponse for large lists. For small, fixed-size lists, use ApiResponse<Vec<T>>.

---

## RELATED DOCUMENTATION

- [ERROR_HANDLING_STANDARDS.md](ERROR_HANDLING_STANDARDS.md) - Error response format
- `crate::shared::http::response` - Generic response types implementation
- Backend Response Wrapper tests - In `shared/http/response.rs`

