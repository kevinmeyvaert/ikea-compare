# Firebase Library Testing Roadmap

## ✅ Completed (Phase 1)

### Infrastructure
- ✅ Jest configuration with coverage thresholds (85% lines, 70% branches)
- ✅ Test setup file with polyfills
- ✅ Firebase testing dependencies installed (@firebase/rules-unit-testing, firebase-mock)

### Test Helpers (~780 lines)
- ✅ `firebase-mocks.ts` (280 lines) - Mock Firestore, Auth, Batch, Snapshots
- ✅ `test-fixtures.ts` (220 lines) - Sample data for products, favorites, history, stores
- ✅ `performance-utils.ts` (80 lines) - Benchmarking utilities
- ✅ `snapshot-builders.ts` (Integrated in firebase-mocks.ts) - QuerySnapshot builders

### Store Manager Tests
- ✅ `store-manager.test.ts` (200 lines) - 20+ tests covering:
  - getStoresByCountry() for all countries
  - getAllStores() aggregation
  - Firestore preferences (get/save)
  - Selected store management with defaults
  - localStorage migration logic
  - Error handling

## 🔨 Remaining Work (Phase 2 & 3)

### User Data Manager Tests (~300-350 lines)
**File:** `libs/firebase/src/__tests__/user-data/user-data-manager.test.ts`

**Test Categories:**
1. **Authentication (5 tests)**
   - initializeAnonymousAuth() with existing user
   - initializeAnonymousAuth() creates new user
   - getCurrentUserId() returns correct ID
   - Handle auth errors
   - User state persistence

2. **Favorites Management (8 tests)**
   - addFavorite() creates document
   - addFavorite() prevents duplicates
   - removeFavorite() deletes document
   - isFavorite() checks existence
   - getFavorites() returns all with ordering
   - getFavorites() respects limit parameter
   - Handle unauthenticated user
   - Handle Firestore errors

3. **History Management - COMPLEX (10 tests)**
   - addToHistory() creates new entry
   - addToHistory() deduplication: same product within 24h updates timestamp
   - addToHistory() deduplication: same product after 24h creates new entry
   - addToHistory() deletes old entry when updating
   - addToHistory() handles timestamp edge case (exactly 24h)
   - getHistory() returns ordered by timestamp desc
   - getHistory() respects limit
   - clearHistory() batch deletes all entries
   - Handle empty history
   - Performance: deduplication query < 500ms

**Key Implementation Notes:**
```typescript
// The 24h deduplication logic in addToHistory():
const last24Hours = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
const q = query(
  historyRef,
  where('productId', '==', productData.productId),
  where('searchedAt', '>=', last24Hours)
);
// If exists, delete old and create new (updates timestamp)
// If not, just create new entry
```

### Analytics Service Tests (~400-500 lines)
**File:** `libs/firebase/src/__tests__/analytics/analytics-service.test.ts`

**Test Categories:**
1. **Product Comparison Tracking (12 tests)**
   - Track complete comparison with all countries
   - Calculate savings correctly (cheapest vs others)
   - Handle price ties (multiple cheapest countries)
   - Handle all unavailable products
   - Handle partial availability
   - Batch write operations
   - Deduplication within batch
   - Country code conversions (BE→belgium, NL→netherlands)
   - Snapshot test for calculation results
   - Handle missing product data
   - Handle invalid prices
   - Performance: batch write < 2s

2. **Shopping List Tracking (10 tests)**
   - Track list with multiple items
   - Calculate total savings across items
   - Aggregate totals by country
   - Handle quantities correctly
   - Multi-store optimization results
   - Edge case: all items unavailable
   - Edge case: single item list
   - Edge case: mixed availability
   - Large list performance (50+ items) < 3s
   - Snapshot test for shopping list event

3. **Global Stats (5 tests)**
   - Retrieve comparison statistics
   - Aggregate total comparisons
   - Format statistics correctly
   - Handle empty stats
   - Query performance < 1s

4. **Error Handling (5 tests)**
   - Firestore batch write failures
   - Invalid product data structure
   - Unauthenticated user errors
   - Missing required fields
   - Network/timeout errors

**Key Implementation Notes:**
```typescript
// Shopping list calculations need testing:
- Sum quantities × prices per country
- Find cheapest total country
- Calculate savings = other countries - cheapest
- Handle unavailable products (exclude from calculations)
- Batch write all comparison events
```

### Integration Tests (~100-150 lines total)
**Files:**
- `libs/firebase/src/__tests__/stores/integration.test.ts`
- `libs/firebase/src/__tests__/user-data/integration.test.ts`
- `libs/firebase/src/__tests__/analytics/integration.test.ts`

**Pattern for all integration tests:**
```typescript
const shouldRunIntegration = process.env.RUN_FIREBASE_INTEGRATION_TESTS === 'true';
const describeIntegration = shouldRunIntegration ? describe : describe.skip;

describeIntegration('Store Manager Integration Tests', () => {
  // Real Firestore emulator tests
  // Verify actual CRUD operations
  // Test batch operations with real Firestore
});
```

**Run with:** `RUN_FIREBASE_INTEGRATION_TESTS=true npx nx test firebase`

**Requirements:**
- Firebase emulator running on localhost:8080
- Real Firestore operations (slower but realistic)
- Tests verify end-to-end functionality

## Implementation Priority

### High Priority (Core Business Logic)
1. ✅ Store Manager Tests - DONE
2. User Data Manager Tests - Deduplication logic is critical
3. Analytics Service Tests - Complex calculations need verification

### Medium Priority (Integration)
4. Integration Tests - Verify real Firestore behavior

## Commands

```bash
# Run all Firebase tests
npx nx test firebase

# Run with coverage
npx nx test firebase --coverage

# Run specific test file
npx nx test firebase --testPathPattern="store-manager"

# Run integration tests (requires emulator)
RUN_FIREBASE_INTEGRATION_TESTS=true npx nx test firebase

# Watch mode
npx nx test firebase --watch
```

## Coverage Goals

**Current Status:** Store manager tests complete
**Target Coverage:**
- Lines: 85%
- Branches: 70%
- Functions: 85%
- Statements: 85%

**Expected Coverage After Full Implementation:**
- Store Manager: ~95% (simple hardcoded data + CRUD)
- User Data Manager: ~85% (complex deduplication logic)
- Analytics: ~80% (many calculation branches)
- Overall: ~85% target met

## Next Steps

1. **Implement User Data Manager Tests** (~2-3 hours)
   - Focus on 24h deduplication logic
   - Test all CRUD operations
   - Add performance benchmarks

2. **Implement Analytics Service Tests** (~3-4 hours)
   - Test calculation accuracy
   - Verify batch operations
   - Add snapshot tests for complex results

3. **Implement Integration Tests** (~1 hour)
   - One test per module
   - Verify real Firestore operations
   - Document emulator setup

4. **Run Full Suite & Fix Issues** (~1-2 hours)
   - Resolve any mock/import issues
   - Achieve coverage targets
   - Update this roadmap with results

## Total Estimated Effort

- ✅ Phase 1 (Infrastructure + Store Tests): **COMPLETE**
- Phase 2 (User Data + Analytics Tests): ~6-8 hours
- Phase 3 (Integration Tests): ~1 hour
- **Total Remaining:** ~7-9 hours of focused development

## Notes

- All test helpers are reusable across modules
- Firebase mocks follow same patterns as scrapers tests
- Integration tests can be expanded as needed
- Consider adding E2E tests with real Firebase project later
