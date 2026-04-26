# Test Suite Reference

Last checked: 2026-04-26

The project currently has two automated test suites:

| Area | Runner | Location | Test files | Test cases | Current result |
| --- | --- | --- | ---: | ---: | --- |
| API | pytest | `apps/api/tests` | 4 | 13 | 13 passed |
| Web | Vitest | `apps/web/src/**/*.test.js` | 4 | 12 | 12 passed |
| Total |  |  | 8 | 25 | 25 passed |

## How To Run

### API Tests

From the repository root on macOS/Linux:

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[test]'
python -m pytest
```

If the API virtualenv already exists:

```bash
cd apps/api
.venv/bin/python -m pytest
```

On Windows, use:

```powershell
cd apps/api
.\.venv\Scripts\python -m pytest
```

The API tests use an in-memory SQLite database through `apps/api/tests/conftest.py`, so they do not require the project Postgres database.

### Web Tests

From the repository root:

```bash
npm install
npm run test:web
```

Equivalent workspace command:

```bash
npm --workspace apps/web run test
```

Run Vitest in watch mode:

```bash
npm --workspace apps/web exec vitest
```

Run one Vitest file:

```bash
npm --workspace apps/web exec vitest -- src/features/cart/data/cartStorage.test.js
```

## API Pytest Coverage

Shared fixture:

| File | Purpose |
| --- | --- |
| `apps/api/tests/conftest.py` | Creates a fresh in-memory SQLite database for each test, creates all SQLAlchemy tables, yields a session, then drops all tables after the test. |

### `apps/api/tests/test_auth_endpoints.py`

| Test | Expected outcome |
| --- | --- |
| `test_signup_trims_name_and_hashes_the_password` | Signup returns `User created successfully.`, trims the stored/displayed name to `Ada Lovelace`, persists the user, stores a password hash instead of the raw password, and verifies the hash against the original password. |
| `test_login_rejects_an_invalid_password` | Login with a wrong password raises `HTTPException` with status `401` and detail `Invalid email or password.` |
| `test_signup_rejects_duplicate_email_addresses` | A second signup with an existing email raises `HTTPException` with status `409` and detail `A user with this email already exists.` |
| `test_update_and_delete_account_changes_persist` | Updating a user trims and persists the new name, deleting the user returns `Account deleted.`, and the user record is removed from the database. |

### `apps/api/tests/test_auth_schemas.py`

| Test | Expected outcome |
| --- | --- |
| `test_signup_rejects_passwords_that_fail_strength_rules` | `UserCreate` rejects a weak password and includes `PASSWORD_RULES_MESSAGE` in the validation error. |
| `test_login_rejects_blank_email_and_password_fields` | `UserLogin` rejects blank email and password values with validation messages for both fields. |

### `apps/api/tests/test_orders_endpoints.py`

| Test | Expected outcome |
| --- | --- |
| `test_create_order_reduces_stock_and_creates_a_delivery_record` | Creating an order for quantity `2` reduces stock from `5` to `3`, creates a delivery, calculates subtotal `999.98`, shipping `24.90`, tax `80.00`, total `1104.88`, and queues one invoice email background task. |
| `test_create_order_uses_free_shipping_at_or_above_the_threshold` | Creating a `1200.00` order applies free shipping, calculates tax `96.00`, and total `1296.00`. |
| `test_create_order_rejects_requests_above_available_stock` | Requesting quantity above stock raises `HTTPException` with status `409`, returns `Only 1 left in stock for GeForce RTX 5080.`, and leaves product stock unchanged. |

### `apps/api/tests/test_products_endpoints.py`

| Test | Expected outcome |
| --- | --- |
| `test_category_filter_is_case_insensitive_and_excludes_inactive_products` | Filtering category `gpu` returns only active GPU products with IDs `[1, 2]`; inactive products are excluded. |
| `test_search_matches_partial_keywords_case_insensitively_and_trims_whitespace` | Searching for `"  rtx  "` trims whitespace, matches case-insensitively, and returns product IDs `[1, 2]`. |
| `test_search_returns_an_empty_list_when_no_products_match` | Searching for unmatched terms returns an empty list. |
| `test_price_range_filter_returns_only_products_inside_the_bounds` | Filtering between `600.00` and `1600.00` returns product IDs `[2, 3]`. |

## Web Vitest Coverage

Shared helper:

| File | Purpose |
| --- | --- |
| `apps/web/src/test/browserMocks.js` | Provides a minimal mocked `window`, `localStorage`, `Event`, and `CustomEvent` for storage tests that run in Vitest's Node environment. |

### `apps/web/src/lib/authStorage.test.js`

| Test | Expected outcome |
| --- | --- |
| `writes and reads the stored user snapshot` | `writeStoredUser` serializes a user into mocked localStorage and `readStoredUser` returns the same user object. |
| `clears the stored user and notifies listeners` | `clearStoredUser` removes the stored user, `readStoredUser` returns `null`, and two `sutore-auth-change` events are recorded: one for write and one for clear. |

### `apps/web/src/features/cart/data/cartStorage.test.js`

| Test | Expected outcome |
| --- | --- |
| `merges repeated adds into one cart row and caps quantity at stock` | Adding the same product three times creates one cart row capped at stock quantity `2`, keeps the product name, and reports item count `2`. |
| `does not add out-of-stock products` | Adding a product with stock `0` returns an empty cart and leaves stored cart items empty. |
| `applies shipping only below the free-shipping threshold` | A `999.99` subtotal gets shipping `24.9`; a `1200` subtotal gets shipping `0`. |
| `stores discounted price details when a product is on sale` | A product priced `1000` with `25%` discount stores effective price `750`, original price `1000`, and discount percent `25`. |

### `apps/web/src/features/cart/utils/payment.test.js`

| Test | Expected outcome |
| --- | --- |
| `accepts a complete valid checkout form` | A complete valid form has a valid card number and returns no payment validation errors. |
| `reports validation errors for empty or malformed payment details` | Invalid checkout data reports errors for empty cart, first name, email, phone, card number, expired date, CVV, and missing terms acceptance. |
| `requires a four-digit CVV for American Express cards` | Amex digits are normalized correctly, a 4-digit CVV is valid, and a 3-digit CVV is invalid. |
| `detects and formats Mastercard numbers` | Mastercard is detected, formatted as `5555 5555 5555 4444`, and passes card validation. |

### `apps/web/src/features/storefront/hooks/useProductSearch.test.js`

| Test | Expected outcome |
| --- | --- |
| `trims leading and trailing whitespace from the search term` | `normalizeSearchQuery("   RTX 5090   ")` returns `RTX 5090`. |
| `returns an empty string for whitespace-only input` | `normalizeSearchQuery("   ")` returns an empty string. |
