from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
import re

from app.models.product import Product

_CAPACITY_PATTERN = r"(?P<amount>\d+(?:[\.,]\d+)?)\s*(?P<unit>GB|TB)"
_CAPACITY_UNNAMED_PATTERN = r"\d+(?:[\.,]\d+)?\s*(?:GB|TB)"
_MEMORY_LABEL_PATTERN = r"ram|memory|sistem\s+belle.?i|bellek"

_RAM_PATTERNS = [
    re.compile(
        rf"\b(?:{_MEMORY_LABEL_PATTERN})\s*[:\-]\s*{_CAPACITY_PATTERN}\b",
        re.IGNORECASE,
    ),
    re.compile(
        rf"\b{_CAPACITY_PATTERN}"
        rf"(?:\s+(?:ddr\d|lpddr\d))?"
        rf"(?:\s+\d+(?:[\.,]\d+)?\s*(?:mhz|mt/s))?"
        rf"\s*(?:{_MEMORY_LABEL_PATTERN}|ddr\d|lpddr\d)\b",
        re.IGNORECASE,
    ),
]

_STORAGE_PATTERNS = [
    re.compile(
        rf"\b(?:ssd|nvme|storage|disk|drive|depolama)\s*[:\-]?\s*{_CAPACITY_PATTERN}\b",
        re.IGNORECASE,
    ),
    re.compile(
        rf"\b{_CAPACITY_PATTERN}"
        rf"(?:\s+(?:gen\s*\d+|pcie\s*\d+(?:[\.,]\d+)?|m\.?2))*"
        rf"\s*(?:ssd|nvme|storage|disk|drive|depolama)\b",
        re.IGNORECASE,
    ),
]

_BARE_CAPACITY_PATTERN = re.compile(rf"\b{_CAPACITY_PATTERN}\b", re.IGNORECASE)
_COMBINED_CAPACITY_PATTERN = re.compile(
    rf"\b{_CAPACITY_UNNAMED_PATTERN}\s*/\s*{_CAPACITY_UNNAMED_PATTERN}\b",
    re.IGNORECASE,
)
_COMBINED_VARIANT_PATTERN = re.compile(
    r"\b(?P<ram_amount>\d+(?:[\.,]\d+)?)\s*(?P<ram_unit>GB|TB)\s*/\s*"
    r"(?P<storage_amount>\d+(?:[\.,]\d+)?)\s*(?P<storage_unit>GB|TB)\b",
    re.IGNORECASE,
)
_CAPACITY_TOKEN_PATTERN = re.compile(rf"\b{_CAPACITY_UNNAMED_PATTERN}\b", re.IGNORECASE)
_STORAGE_DESCRIPTOR_PATTERN = re.compile(
    r"\b(?:gen\s*\d+|pcie\s*\d+(?:[\.,]\d+)?|m\.?2|nvme)\s+(?=ssd\b)",
    re.IGNORECASE,
)
_NON_WORD_PATTERN = re.compile(r"[^a-z0-9]+")
_MULTIPLE_SPACES_PATTERN = re.compile(r"\s+")
_VARIANT_ELIGIBLE_TYPES = {
    "laptop",
    "desktop",
    "gaming_laptop",
    "prebuilt_pc",
    "storage",
    "ssd",
}


@dataclass(frozen=True)
class ProductVariantSpecs:
    ram_capacity: str | None = None
    ram_capacity_gb: int | None = None
    storage_capacity: str | None = None
    storage_capacity_gb: int | None = None

    @property
    def has_variant_capacity(self) -> bool:
        return bool(self.ram_capacity or self.storage_capacity)


def _product_text(product: Product) -> str:
    return " ".join(
        part.strip()
        for part in [
            product.name or "",
            product.model or "",
            product.description or "",
        ]
        if part and part.strip()
    )


def _identity_text(product: Product) -> str:
    model = (product.model or "").strip()
    model_identity = "" if model.isdigit() else model

    return " ".join(
        part.strip()
        for part in [
            product.distributor or "",
            product.name or "",
            model_identity,
        ]
        if part and part.strip()
    )


def _format_amount(value: Decimal) -> str:
    normalized = value.normalize()
    if normalized == normalized.to_integral():
        return str(int(normalized))
    return format(normalized, "f").rstrip("0").rstrip(".")


def format_capacity_gb(capacity_gb: int | None) -> str | None:
    if capacity_gb is None or capacity_gb <= 0:
        return None

    if capacity_gb >= 1024 and capacity_gb % 1024 == 0:
        return f"{capacity_gb // 1024} TB"

    return f"{capacity_gb} GB"


def normalize_variant_group(value: str | None) -> str | None:
    normalized = (value or "").strip().lower()
    if not normalized:
        return None

    normalized = _NON_WORD_PATTERN.sub(" ", normalized)
    normalized = _MULTIPLE_SPACES_PATTERN.sub(" ", normalized).strip()
    return normalized[:160] or None


def _capacity_from_parts(amount_value: str, unit_value: str) -> tuple[str, int]:
    amount = Decimal(amount_value.replace(",", "."))
    unit = unit_value.upper()
    capacity_gb = int(amount * 1024) if unit == "TB" else int(amount)
    return f"{_format_amount(amount)} {unit}", capacity_gb


def _capacity_from_match(match: re.Match[str]) -> tuple[str, int]:
    return _capacity_from_parts(match.group("amount"), match.group("unit"))


def _find_capacity(patterns: list[re.Pattern[str]], text: str) -> tuple[str, int] | None:
    for pattern in patterns:
        match = pattern.search(text)
        if match:
            return _capacity_from_match(match)

    return None


def _is_storage_like_product(product: Product, text: str) -> bool:
    searchable_type = " ".join(
        part.lower()
        for part in [
            product.category or "",
            product.item_type or "",
            product.name or "",
            product.model or "",
        ]
    )
    return (
        any(token in searchable_type for token in _VARIANT_ELIGIBLE_TYPES)
        or "ssd" in text.lower()
        or "nvme" in text.lower()
    )


def extract_variant_specs(product: Product) -> ProductVariantSpecs:
    structured_ram = product.ram_capacity_gb if product.ram_capacity_gb is not None else None
    structured_storage = (
        product.storage_capacity_gb if product.storage_capacity_gb is not None else None
    )
    if structured_ram or structured_storage:
        return ProductVariantSpecs(
            ram_capacity=format_capacity_gb(structured_ram),
            ram_capacity_gb=structured_ram if structured_ram and structured_ram > 0 else None,
            storage_capacity=format_capacity_gb(structured_storage),
            storage_capacity_gb=(
                structured_storage if structured_storage and structured_storage > 0 else None
            ),
        )

    text = _product_text(product)
    ram = _find_capacity(_RAM_PATTERNS, text)
    storage = _find_capacity(_STORAGE_PATTERNS, text)

    if _is_storage_like_product(product, text):
        combined_match = _COMBINED_VARIANT_PATTERN.search(text)
        if combined_match:
            if not ram:
                ram = _capacity_from_parts(
                    combined_match.group("ram_amount"),
                    combined_match.group("ram_unit"),
                )
            if not storage:
                storage = _capacity_from_parts(
                    combined_match.group("storage_amount"),
                    combined_match.group("storage_unit"),
                )

    if not storage and _is_storage_like_product(product, text):
        matches = [_capacity_from_match(match) for match in _BARE_CAPACITY_PATTERN.finditer(text)]
        if ram:
            matches = [match for match in matches if match[1] != ram[1]]
        if matches:
            storage = max(matches, key=lambda match: match[1])

    return ProductVariantSpecs(
        ram_capacity=ram[0] if ram else None,
        ram_capacity_gb=ram[1] if ram else None,
        storage_capacity=storage[0] if storage else None,
        storage_capacity_gb=storage[1] if storage else None,
    )


def infer_variant_group(product: Product) -> str | None:
    specs = extract_variant_specs(product)
    if not specs.has_variant_capacity:
        return None

    normalized_identity = _identity_text(product).lower()
    normalized_identity = _COMBINED_CAPACITY_PATTERN.sub(" ", normalized_identity)
    normalized_identity = _CAPACITY_TOKEN_PATTERN.sub(" ", normalized_identity)
    normalized_identity = _STORAGE_DESCRIPTOR_PATTERN.sub(" ", normalized_identity)
    normalized_identity = _NON_WORD_PATTERN.sub(" ", normalized_identity)
    normalized_identity = _MULTIPLE_SPACES_PATTERN.sub(" ", normalized_identity).strip()

    if len(normalized_identity) < 4:
        return None

    category = (product.category or "").strip().lower()
    item_type = (product.item_type or "").strip().lower()
    inferred = f"{category}|{item_type}|{normalized_identity}".strip("|")
    return inferred[:160] or None


def variant_group_key(product: Product) -> str:
    explicit_group = normalize_variant_group(product.variant_group)
    if explicit_group:
        return f"variant:{explicit_group}"

    inferred_group = infer_variant_group(product)
    if inferred_group:
        return f"variant:{inferred_group}"

    return f"product:{product.product_id}"


def collapse_variant_products(products: list[Product]) -> list[Product]:
    representatives: dict[str, Product] = {}
    ordered_keys: list[str] = []

    for product in products:
        key = variant_group_key(product)
        if key not in representatives:
            representatives[key] = product
            ordered_keys.append(key)
            continue

        current = representatives[key]
        product_price = product.price if product.price is not None else Decimal("999999999")
        current_price = current.price if current.price is not None else Decimal("999999999")
        if (product_price, product.product_id) < (current_price, current.product_id):
            representatives[key] = product

    return [representatives[key] for key in ordered_keys]


def matching_variant_products(product: Product, candidates: list[Product]) -> list[Product]:
    key = variant_group_key(product)
    variants = [candidate for candidate in candidates if variant_group_key(candidate) == key]

    return sorted(
        variants,
        key=lambda candidate: (
            extract_variant_specs(candidate).ram_capacity_gb or -1,
            extract_variant_specs(candidate).storage_capacity_gb or -1,
            candidate.price if candidate.price is not None else Decimal("999999999"),
            candidate.product_id,
        ),
    )
