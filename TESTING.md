# Test Suite Reference

Last checked: 2026-05-01

The project currently has two automated test suites:

| Area | Runner | Location | Test files | Test cases | Current result |
| --- | --- | --- | ---: | ---: | --- |
| API | pytest | `apps/api/tests` | 5 | 47 | 47 passed |
| Web | Vitest | `apps/web/src/**/*.test.js` | 4 | 12 | 12 passed |
| Total |  |  | 9 | 59 | 59 passed |

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
| `test_list_products_collapses_ram_and_ssd_variants` | Listing laptop products collapses RAM/SSD variants into one representative per variant group and returns product IDs `[10, 12]`. |
| `test_product_variants_include_capacities_and_prices` | Fetching variants for product `10` returns products `[10, 11]`, exposes RAM/storage labels `16 GB`/`512 GB` and `32 GB`/`1 TB`, and preserves each variant price. |
| `test_hydroc_scraped_id_variants_collapse_and_expose_ram_options` | HYDROC variants with scraped numeric model IDs collapse by hardware configuration, expose RTX 5090 RAM options `[2813, 2816]`, and keep RTX 5080 variants separate as `[2812, 2911]`. |
| `test_structured_variant_fields_group_products_without_capacity_text` | Products with explicit `variant_group`, `ram_capacity_gb`, and `storage_capacity_gb` collapse to product `30` and expose variants `(30, "32 GB", "1 TB")` and `(31, "64 GB", "2 TB")`. |

### `apps/api/tests/test_product_variants_service.py`

| Test | Expected outcome |
| --- | --- |
| `test_format_capacity_gb` | Capacity values format as human-readable labels, including `32 GB`, `512 GB`, `1 TB`, `2 TB`, and `1536 GB`; missing and zero values return `None`. |
| `test_normalize_variant_group` | Variant group strings are trimmed, lowercased, and normalized by replacing separators with spaces; empty values return `None`. |
| `test_extracts_supported_text_formats` | RAM and storage capacities are extracted from supported product-name and description formats, including `RAM: 32GB SSD: 1TB`, `16GB/512GB`, and HYDROC-style descriptions. |
| `test_uses_largest_bare_capacity_as_storage_for_systems` | For system products with RAM and an unlabelled larger capacity, `32 GB` is treated as RAM and `2 TB` is treated as storage. |
| `test_does_not_treat_gpu_memory_as_laptop_variant_capacity` | GPU memory in component products is not exposed as RAM or storage variant capacity. |
| `test_capacity_fields_override_text_parsing` | Structured `ram_capacity_gb` and `storage_capacity_gb` values override capacities parsed from product text. |
| `test_partial_capacity_fields_are_supported_with_explicit_group` | A product with an explicit variant group and only RAM capacity still exposes that RAM label and receives a normalized variant group key. |
| `test_explicit_group_can_group_products_without_capacity_text` | Products without capacity text but with the same explicit variant group share the same variant group key. |
| `test_inferred_group_ignores_numeric_scraped_model_ids_and_capacities` | HYDROC products that differ only by scraped numeric model IDs and RAM capacity infer the same variant group. |
| `test_inferred_group_keeps_hardware_differences_separate` | Similar products with different GPU hardware, such as RTX 5080 versus RTX 5090, infer different variant groups. |
| `test_storage_generation_descriptors_do_not_split_same_group` | Storage generation wording like `Gen 5` does not split products that otherwise belong to the same variant group. |
| `test_explicit_variant_group_wins_over_inferred_identity` | Explicit variant groups override inferred identity and normalize to `variant:oem falcon rtx4070`. |
| `test_products_without_group_or_capacity_remain_standalone` | Products without a variant group or capacity data are treated as standalone products with a `product:<id>` key. |
| `test_collapse_chooses_lowest_price_representative` | Collapsing variant products chooses the lowest-priced representative for a group and leaves standalone products in the result. |
| `test_collapse_keeps_standalone_products_separate_even_when_names_match` | Standalone products remain separate even if they share the same display name. |
| `test_matching_variants_filters_group_and_sorts_by_configuration` | Matching variants filters candidates to the current product group and sorts them by RAM, storage, then price. |

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
