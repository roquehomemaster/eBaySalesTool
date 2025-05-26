# Test Debugging Notes

## Findings

### 1. `RolePageAccess.create` Errors
- Some tests are failing due to issues with creating `RolePageAccess` entries.
- Validation for `role_id`, `page_id`, and `access` fields is insufficient.
- Debugging logs indicate that some roles or pages might not be seeded correctly.

### 2. `401 Unauthorized` Errors
- Tests are failing because `req.user` is undefined in some cases.
- The `x-mock-user` header is either missing or improperly set in certain test cases.

### 3. `403 Forbidden` Errors
- Access level mismatches in the `authorizePage` middleware are causing these failures.
- The required access level is not being met for some roles and pages.

### 4. Pagination and CRUD Test Failures
- Tests in `itemApi.test.js` and `customerApi.test.js` are failing due to improper seeding or validation.
- Pagination logic and CRUD operations need further investigation.

## Attempts

### 1. Enhanced Seeding Logic
- Updated the seeding logic in `authApi.test.js` to validate roles and pages before creating `RolePageAccess` entries.
- Added error handling for `RolePageAccess.create` calls.

### 2. Mocked `req.user`
- Ensured that `req.user` is properly mocked in `authApi.test.js` and `customerApi.test.js`.
- Added helper functions like `userHeader` and `mockUserHeader` to generate valid `x-mock-user` headers.

### 3. Debugged `authorizePage` Middleware
- Added detailed debugging logs to trace access level comparisons and user-role validations.
- Verified that the middleware correctly handles `req.user` and access levels.

### 4. Ran Test Suites
- Re-ran the test suite multiple times to verify fixes.
- Observed that 24 tests are still failing due to the issues mentioned above.

## Updates

### Recent Actions

1. **Enhanced Seeding Logic**:
   - Improved validation and error handling for `RolePageAccess.create` in `authApi.test.js`, `customerApi.test.js`, and `itemApi.test.js`.
   - Added detailed debugging logs to capture `role_id`, `page_id`, and `access` values during seeding.

2. **Ran Test Suites**:
   - Re-ran the test suite to verify fixes.
   - Observed that 24 tests are still failing due to the following issues:
     - `RolePageAccess.create` errors.
     - `401 Unauthorized` errors caused by undefined `req.user`.
     - `403 Forbidden` errors due to access level mismatches.
     - Pagination and CRUD test failures in `itemApi.test.js` and `customerApi.test.js`.

### Pending Tasks

1. **Fix `RolePageAccess.create` Errors**:
   - Investigate why some `RolePageAccess.create` calls are still failing despite validation.
   - Ensure all required fields (`role_id`, `page_id`, `access`) are correctly seeded.

2. **Resolve `401 Unauthorized` Errors**:
   - Ensure `req.user` is properly mocked in all test cases.
   - Verify that the `x-mock-user` header is consistently set.

3. **Resolve `403 Forbidden` Errors**:
   - Debug and fix access level mismatches in the `authorizePage` middleware.
   - Verify that required access levels are correctly defined and enforced.

4. **Address Pagination and CRUD Test Failures**:
   - Investigate and resolve issues in `itemApi.test.js` and `customerApi.test.js` related to pagination and CRUD operations.

5. **Re-run Tests**:
   - Re-run the test suite with `--detectOpenHandles` to identify and fix open handles.

### Next Steps

- Focus on resolving `RolePageAccess.create` errors by adding stricter validation and debugging logs.
- Ensure consistent mocking of `req.user` across all test files.
- Debug and fix access level mismatches in the `authorizePage` middleware.
- Revisit pagination and CRUD logic in `itemApi.test.js` and `customerApi.test.js`.
