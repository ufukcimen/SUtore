from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
import re

from app.models.product import Product
from app.services.product_variants import extract_variant_specs, format_capacity_gb

_MULTIPLE_SPACES_PATTERN = re.compile(r"\s+")
_INTEL_MARK_PATTERN = re.compile(r"[\u00ae\u2122]", re.IGNORECASE)

_BRAND_ALIASES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("Western Digital", ("western digital", "wd")),
    ("Eluktronics", ("eluktronics",)),
    ("Microsoft", ("microsoft",)),
    ("Samsung", ("samsung",)),
    ("Kingston", ("kingston",)),
    ("Logitech", ("logitech",)),
    ("Corsair", ("corsair",)),
    ("Crucial", ("crucial",)),
    ("Seagate", ("seagate",)),
    ("Gigabyte", ("gigabyte",)),
    ("Lenovo", ("lenovo",)),
    ("Nvidia", ("nvidia", "geforce")),
    ("Intel", ("intel",)),
    ("Apple", ("apple",)),
    ("Razer", ("razer",)),
    ("ASUS", ("asus",)),
    ("Acer", ("acer",)),
    ("Dell", ("dell",)),
    ("MSI", ("msi",)),
    ("AMD", ("amd", "radeon")),
    ("HP", ("hp",)),
    ("LG", ("lg",)),
)

_GPU_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    (
        "nvidia_rtx_pro",
        re.compile(
            r"\b(?:nvidia\s+)?(?:rtx\s+)?pro\s+(?P<model>\d{4})"
            r"(?:\s+(?P<class>ada|blackwell))?\b",
            re.IGNORECASE,
        ),
    ),
    (
        "nvidia_rtx",
        re.compile(
            r"\b(?:nvidia\s+)?(?:geforce\s+)?rtx\s*(?P<model>\d{4})"
            r"\s*(?P<suffix>ti\s*super|ti|super)?\b",
            re.IGNORECASE,
        ),
    ),
    (
        "nvidia_gtx",
        re.compile(
            r"\b(?:nvidia\s+)?(?:geforce\s+)?gtx\s*(?P<model>\d{3,4})"
            r"\s*(?P<suffix>ti)?\b",
            re.IGNORECASE,
        ),
    ),
    (
        "amd_radeon",
        re.compile(
            r"\b(?:amd\s+)?radeon\s+rx\s*(?P<model>\d{4})\s*(?P<suffix>xtx|xt)?\b",
            re.IGNORECASE,
        ),
    ),
    (
        "intel_arc",
        re.compile(r"\bintel\s+arc\s+(?P<model>[a-z]\d{3,4})\b", re.IGNORECASE),
    ),
)

_CPU_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    (
        "intel_core_ultra",
        re.compile(
            r"\b(?:intel\s+)?core\s+ultra\s+(?P<tier>[579])"
            r"(?:\s*-?\s*(?P<model>\d{3,5}[a-z]{0,3}))?\b",
            re.IGNORECASE,
        ),
    ),
    (
        "intel_ultra_core",
        re.compile(
            r"\b(?:intel\s+)?ultra\s+core\s+(?P<tier>[579])"
            r"(?:\s*-?\s*(?P<model>\d{3,5}[a-z]{0,3}))?\b",
            re.IGNORECASE,
        ),
    ),
    (
        "intel_core_number",
        re.compile(
            r"\b(?:intel\s+)?core\s+(?P<tier>[3579])"
            r"(?:\s*-\s*|\s+)(?P<model>\d{3,5}[a-z]{0,3})\b",
            re.IGNORECASE,
        ),
    ),
    (
        "intel_core_i",
        re.compile(
            r"\b(?:intel\s+)?(?:core\s+)?i(?P<tier>[3579])"
            r"(?:(?:\s*-\s*|\s+)(?P<model>\d{3,5}[a-z]{0,3}))?\b",
            re.IGNORECASE,
        ),
    ),
    (
        "amd_ryzen",
        re.compile(
            r"\b(?:amd\s+)?ryzen\s+(?P<tier>[3579])"
            r"(?:\s*-\s*|\s+)?(?P<model>\d{3,5}[a-z0-9]{0,4})?\b",
            re.IGNORECASE,
        ),
    ),
    (
        "amd_ai",
        re.compile(
            r"\b(?:amd\s+)?(?:ryzen\s+)?ai\s+(?P<tier>[3579])"
            r"(?:\s*-\s*|\s+)?(?P<model>\d{3,5}[a-z0-9]{0,4})?\b",
            re.IGNORECASE,
        ),
    ),
    (
        "apple_m",
        re.compile(r"\bapple\s+m(?P<tier>[1-4])(?:\s+(?P<class>pro|max|ultra))?\b", re.IGNORECASE),
    ),
)
_LAPTOP_OEM_CATEGORY_TOKENS = {"laptop", "desktop", "oem", "oem pc", "oem-pc", "oem_pcs"}
_LAPTOP_OEM_TYPE_TOKENS = {"gaming_laptop", "business_laptop", "prebuilt_pc", "desktop"}


@dataclass(frozen=True)
class ProductFilterSpecs:
    brand: str | None
    cpu: str | None
    gpu: str | None
    ram_capacity_gb: int | None
    storage_capacity_gb: int | None
    discounted: bool


def _product_text(product: Product) -> str:
    return " ".join(
        part.strip()
        for part in [
            product.distributor or "",
            product.name or "",
            product.model or "",
            product.description or "",
            product.category or "",
            product.item_type or "",
        ]
        if part and part.strip()
    )


def _brand_priority_text(product: Product) -> str:
    return " ".join(
        part.strip()
        for part in [
            product.distributor or "",
            product.name or "",
            product.model or "",
        ]
        if part and part.strip()
    )


def normalize_filter_value(value: str | int | None) -> str:
    return _MULTIPLE_SPACES_PATTERN.sub(" ", str(value or "").strip().lower())


def _clean_product_text(value: str) -> str:
    value = _INTEL_MARK_PATTERN.sub(" ", value)
    return _MULTIPLE_SPACES_PATTERN.sub(" ", value).strip()


def _uppercase_model(value: str | None) -> str | None:
    normalized = normalize_filter_value(value)
    return normalized.upper() if normalized else None


def _format_suffix(value: str | None) -> str:
    normalized = normalize_filter_value(value)
    if not normalized:
        return ""
    if normalized == "ti super":
        return " Ti Super"
    if normalized == "ti":
        return " Ti"
    if normalized == "super":
        return " Super"
    if normalized == "xt":
        return " XT"
    if normalized == "xtx":
        return " XTX"
    return f" {normalized.upper()}"


def _supports_laptop_oem_facets(product: Product) -> bool:
    category = normalize_filter_value(product.category)
    item_type = normalize_filter_value(product.item_type)
    text = normalize_filter_value(_product_text(product))

    return (
        category in _LAPTOP_OEM_CATEGORY_TOKENS
        or item_type in _LAPTOP_OEM_TYPE_TOKENS
        or "laptop" in text
        or "oem paket" in text
        or "oem package" in text
    )


def extract_gpu(product: Product) -> str | None:
    if not _supports_laptop_oem_facets(product):
        return None

    text = _clean_product_text(_product_text(product))
    for gpu_type, pattern in _GPU_PATTERNS:
        match = pattern.search(text)
        if not match:
            continue

        groups = match.groupdict()
        model = _uppercase_model(groups.get("model"))
        if not model:
            continue

        if gpu_type == "nvidia_rtx_pro":
            gpu_class = normalize_filter_value(groups.get("class"))
            suffix = f" {gpu_class.capitalize()}" if gpu_class else ""
            return f"Nvidia RTX Pro {model}{suffix}"
        if gpu_type == "nvidia_rtx":
            return f"Nvidia GeForce RTX {model}{_format_suffix(groups.get('suffix'))}"
        if gpu_type == "nvidia_gtx":
            return f"Nvidia GeForce GTX {model}{_format_suffix(groups.get('suffix'))}"
        if gpu_type == "amd_radeon":
            return f"AMD Radeon RX {model}{_format_suffix(groups.get('suffix'))}"
        if gpu_type == "intel_arc":
            return f"Intel Arc {model}"

    return None


def extract_cpu(product: Product) -> str | None:
    if not _supports_laptop_oem_facets(product):
        return None

    text = _clean_product_text(_product_text(product))
    for cpu_type, pattern in _CPU_PATTERNS:
        match = pattern.search(text)
        if not match:
            continue

        groups = match.groupdict()
        tier = groups.get("tier")

        if cpu_type in {"intel_core_ultra", "intel_ultra_core"}:
            return f"Intel Core Ultra {tier}"
        if cpu_type == "intel_core_number":
            return f"Intel Core {tier}"
        if cpu_type == "intel_core_i":
            return f"Intel Core i{tier}"
        if cpu_type == "amd_ryzen":
            return f"AMD Ryzen {tier}"
        if cpu_type == "amd_ai":
            return f"AMD AI {tier}"
        if cpu_type == "apple_m":
            cpu_class = normalize_filter_value(groups.get("class"))
            suffix = f" {cpu_class.capitalize()}" if cpu_class else ""
            return f"Apple M{tier}{suffix}"

    return None


def extract_brand(product: Product, gpu: str | None = None) -> str | None:
    brand_priority_text = f" {normalize_filter_value(_brand_priority_text(product))} "
    for label, aliases in _BRAND_ALIASES:
        for alias in aliases:
            normalized_alias = normalize_filter_value(alias)
            if re.search(rf"(?<![a-z0-9]){re.escape(normalized_alias)}(?![a-z0-9])", brand_priority_text):
                return label

    normalized_text = f" {normalize_filter_value(_product_text(product))} "
    for label, aliases in _BRAND_ALIASES:
        for alias in aliases:
            normalized_alias = normalize_filter_value(alias)
            if re.search(rf"(?<![a-z0-9]){re.escape(normalized_alias)}(?![a-z0-9])", normalized_text):
                return label

    distributor = (product.distributor or "").strip()
    if distributor:
        return distributor

    if gpu and gpu.startswith("Nvidia "):
        return "Nvidia"
    if gpu and gpu.startswith("AMD "):
        return "AMD"
    if gpu and gpu.startswith("Intel "):
        return "Intel"

    return None


def extract_product_filter_specs(product: Product) -> ProductFilterSpecs:
    variant_specs = extract_variant_specs(product)
    gpu = extract_gpu(product)

    return ProductFilterSpecs(
        brand=extract_brand(product, gpu),
        cpu=extract_cpu(product),
        gpu=gpu,
        ram_capacity_gb=variant_specs.ram_capacity_gb,
        storage_capacity_gb=variant_specs.storage_capacity_gb,
        discounted=(product.discount_percent or 0) > 0,
    )


def build_filter_options(products: list[Product]) -> dict[str, object]:
    brand_counts: Counter[str] = Counter()
    cpu_counts: Counter[str] = Counter()
    gpu_counts: Counter[str] = Counter()
    ram_counts: Counter[int] = Counter()
    storage_counts: Counter[int] = Counter()
    discounted_count = 0

    for product in products:
        specs = extract_product_filter_specs(product)
        if specs.brand:
            brand_counts[specs.brand] += 1
        if specs.cpu:
            cpu_counts[specs.cpu] += 1
        if specs.gpu:
            gpu_counts[specs.gpu] += 1
        if specs.ram_capacity_gb:
            ram_counts[specs.ram_capacity_gb] += 1
        if specs.storage_capacity_gb:
            storage_counts[specs.storage_capacity_gb] += 1
        if specs.discounted:
            discounted_count += 1

    return {
        "brands": _text_options(brand_counts),
        "cpus": _text_options(cpu_counts),
        "gpus": _text_options(gpu_counts),
        "ram_capacities": _capacity_options(ram_counts),
        "storage_capacities": _capacity_options(storage_counts),
        "discounted_count": discounted_count,
    }


def _text_options(counts: Counter[str]) -> list[dict[str, str | int]]:
    return [
        {"value": value, "label": value, "count": count}
        for value, count in sorted(counts.items(), key=lambda item: item[0].lower())
    ]


def _capacity_options(counts: Counter[int]) -> list[dict[str, str | int]]:
    return [
        {
            "value": value,
            "label": format_capacity_gb(value) or f"{value} GB",
            "count": count,
        }
        for value, count in sorted(counts.items())
    ]
