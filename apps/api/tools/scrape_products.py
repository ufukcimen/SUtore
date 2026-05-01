from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import time
import unicodedata
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib import robotparser
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urljoin, urlparse
from urllib.request import Request, urlopen

API_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API_DIR))

USER_AGENT = "SUtoreProductImporter/0.1"
SCRAPED_DISTRIBUTOR_PREFIX = "Scraped:"
DEFAULT_TIMEOUT_SECONDS = 20
USD_CURRENCY = "USD"
RATE_API_URL = "https://api.frankfurter.app/latest"
PRICE_ROUNDING_INCREMENT = Decimal("10")
RETAIL_PRICE_OFFSET = Decimal("0.01")
MIN_RETAIL_PRICE = Decimal("0.99")
IMPORT_RUN_MANIFESTS_DIR = Path(__file__).resolve().parent / "import_runs"

SOURCE_DOMAINS = {
    "bestbuy": {"bestbuy.com", "www.bestbuy.com"},
    "eluktronics": {"eluktronics.com", "www.eluktronics.com"},
    "itopya": {"itopya.com", "www.itopya.com"},
    "laptopwithlinux": {"laptopwithlinux.com", "www.laptopwithlinux.com"},
    "scrapingcourse": {"scrapingcourse.com", "www.scrapingcourse.com"},
    "system76": {"system76.com", "www.system76.com"},
    "webscraper": {"webscraper.io", "www.webscraper.io"},
}


SOURCE_BRAND_FALLBACKS = {
    "bestbuy": "Best Buy",
    "eluktronics": "Eluktronics",
    "itopya": "Itopya",
    "laptopwithlinux": "Laptop With Linux",
    "scrapingcourse": "ScrapingCourse",
    "system76": "System76",
    "webscraper": "WebScraper",
}

KNOWN_BRANDS = (
    "Cooler Master",
    "Western Digital",
    "Bitty Boomers",
    "TeamGroup",
    "Thermaltake",
    "SteelSeries",
    "Eluktronics",
    "SilverStone",
    "Laptop With Linux",
    "Crucial",
    "CORSAIR",
    "Gigabyte",
    "Kingston",
    "Logitech",
    "Samsung",
    "Seagate",
    "System76",
    "TongFang",
    "Toshiba",
    "ASRock",
    "Canon",
    "Clevo",
    "Intel",
    "Lenovo",
    "Lexar",
    "NVIDIA",
    "Razer",
    "Acer",
    "AOHI",
    "ASUS",
    "Dell",
    "MSI",
    "AOC",
    "AMD",
    "HP",
    "WD",
)


PRODUCT_LINK_PATTERNS = {
    "bestbuy": re.compile(r"/site/[^\"'#?]+/\d+\.p(?:\?skuId=\d+)?", re.IGNORECASE),
    "eluktronics": re.compile(r"/[a-z0-9][a-z0-9-]*(?:[A-Z0-9][a-z0-9-]*)*", re.IGNORECASE),
    "itopya": re.compile(r"/[^\"'#?]+_[uh]\d+", re.IGNORECASE),
    "laptopwithlinux": re.compile(r"/product/[a-z0-9-]+/?", re.IGNORECASE),
    "system76": re.compile(r"/laptops/[a-z0-9-]+", re.IGNORECASE),
    "webscraper": re.compile(r"/test-sites/e-commerce/allinone/product/\d+", re.IGNORECASE),
}

CATEGORY_KEYWORDS = [
    (
        "laptop",
        (
            "laptop",
            "notebook",
            "dizustu",
            "vivobook",
            "smartbook",
            "thinkpad",
            "inspiron",
            "aspire",
            "probook",
            "elitebook",
            "vostro",
            "latitude",
            "macbook",
            "zenbook",
            "ultrabook",
        ),
    ),
    ("desktop", ("desktop", "masaustu", "workstation", "oem", "gaming pc")),
    ("monitor", ("monitor", "display")),
    ("storage", ("ssd", "hdd", "hard disk", "harici disk", "usb bellek", "storage")),
    ("network", ("router", "modem", "switch", "access point", "mesh", "ethernet", "network")),
    ("audio", ("kulaklik", "headset", "headphone", "headphones", "speaker", "hoparlor", "microphone", "mikrofon")),
    ("peripheral", ("keyboard", "klavye", "mouse", "fare", "webcam")),
    (
        "component",
        (
            "gpu",
            "ekran kart",
            "cpu",
            "islemci",
            "anakart",
            "ram",
            "psu",
            "power supply",
            "kasa",
            "cooler",
            "sogutucu",
        ),
    ),
]
SUPPORTED_PRODUCT_CATEGORIES = {
    "audio",
    "component",
    "desktop",
    "laptop",
    "monitor",
    "network",
    "peripheral",
    "storage",
}

EXCLUDED_PRODUCT_PATTERNS = (
    re.compile(r"\bsmart\s*phones?\b"),
    re.compile(r"\bsmart\s*watch(?:es)?\b"),
    re.compile(r"\bsmartwatch(?:es)?\b"),
    re.compile(r"\b(?:iphone|galaxy|nexus|lumia|phone|tablet|ipad)\b"),
    re.compile(r"\b(?:cable|kablo|data\s*kablo|sarj|charger|adapter|adaptor)\b"),
    re.compile(r"\b(?:printer|yazici|scanner|tarayici|fotokopi|murekkep)\b"),
    re.compile(r"\b(?:camera|kamera|aksiyon\s*kamera|action\s*camera)\b"),
    re.compile(r"\b(?:gamepad|controller|console|konsol)\b"),
    re.compile(r"\b(?:bag|backpack|canta|sirt\s*cantasi)\b"),
    re.compile(r"\b(?:mouse\s*pad|mousepad|stand|holder|mount|bracket|aski|chair)\b"),
)

IMAGE_REQUIRED_SOURCES = {"bestbuy", "eluktronics", "itopya", "laptopwithlinux", "system76"}
PRICE_REQUIRED_SOURCES = {"bestbuy", "eluktronics", "itopya", "laptopwithlinux", "system76"}

SOURCE_DEFAULT_CURRENCIES = {
    "bestbuy": "USD",
    "itopya": "TRY",
    "laptopwithlinux": "USD",
    "scrapingcourse": "USD",
    "system76": "USD",
    "webscraper": "USD",
}

SPEC_TEXT_PATTERN = re.compile(
    r"\b(?:intel|amd|ryzen|core|ultra|nvidia|geforce|rtx|radeon|ddr\d?|ram|ssd|hdd|"
    r"pcie|m\.2|qhd|fhd|uhd|full hd|display|screen|hz|wifi|wi-fi|bluetooth|usb|"
    r"hdmi|keyboard|processor|cpu|gpu|graphics|memory|storage|tb|gb|kg|inch|"
    r"inches)\b|\b\d+(?:\.\d+)?\s*(?:gb|tb|hz|kg|inch|inches|w|ms)\b|\d+\""
)
MARKETING_COPY_PATTERNS = (
    re.compile(r"\ball at an? [^.]+\.?$", re.IGNORECASE),
    re.compile(r"\bit is ideal for [^.]+\.?", re.IGNORECASE),
    re.compile(r"\bthis is an? [^.]+\.?", re.IGNORECASE),
)
MARKETING_WORD_PATTERN = re.compile(
    r"\b(?:latest|cutting-edge|unmatched|exceptional|powerful|affordable|"
    r"excellent|ideal|sleek|premium|ultimate performance|just)\b\s*",
    re.IGNORECASE,
)
RETAILER_TAIL_PATTERN = re.compile(
    r"\s+(?:en\s+(?:iyi|uygun)\s+fiyat|best\s+price|itopya(?:['\u2019]?da)?|best\s+buy)\b.*$",
    re.IGNORECASE,
)
TURKISH_ASCII_TRANSLATION = str.maketrans(
    {
        "\u00c7": "C",
        "\u00d6": "O",
        "\u00dc": "U",
        "\u011e": "G",
        "\u0130": "I",
        "\u015e": "S",
        "\u00e7": "c",
        "\u00f6": "o",
        "\u00fc": "u",
        "\u011f": "g",
        "\u0131": "i",
        "\u015f": "s",
    }
)


@dataclass
class ScrapedProduct:
    source_name: str
    source_product_id: str
    source_url: str
    name: str
    price: Decimal | None
    currency: str | None
    original_price: Decimal | None
    original_currency: str | None
    usd_conversion_rate: Decimal | None
    category: str | None
    item_type: str | None
    image_url: str | None
    description: str | None
    stock_quantity: int | None
    model: str | None


class ProductPageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_title = False
        self.in_json_ld = False
        self.current_script_chunks: list[str] = []
        self.title_chunks: list[str] = []
        self.json_ld_chunks: list[str] = []
        self.meta: dict[str, str] = {}
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {key.lower(): value or "" for key, value in attrs}

        if tag == "title":
            self.in_title = True
        elif tag == "script" and "ld+json" in attr_map.get("type", "").lower():
            self.in_json_ld = True
            self.current_script_chunks = []
        elif tag == "meta":
            key = (
                attr_map.get("property")
                or attr_map.get("name")
                or attr_map.get("itemprop")
                or ""
            ).lower()
            content = attr_map.get("content")
            if key and content:
                self.meta[key] = content
        elif tag == "a" and attr_map.get("href"):
            self.links.append(attr_map["href"])

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False
        elif tag == "script" and self.in_json_ld:
            self.in_json_ld = False
            script_content = "".join(self.current_script_chunks).strip()
            if script_content:
                self.json_ld_chunks.append(script_content)
            self.current_script_chunks = []

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_chunks.append(data)
        elif self.in_json_ld:
            self.current_script_chunks.append(data)

    @property
    def title(self) -> str:
        return clean_text(" ".join(self.title_chunks))


class WebScraperCatalogParser(HTMLParser):
    def __init__(self, base_url: str) -> None:
        super().__init__()
        self.base_url = base_url
        self.cards: list[dict[str, str]] = []
        self.current_card: dict[str, str] | None = None
        self.thumbnail_depth = 0
        self.capture_field: str | None = None
        self.capture_tag: str | None = None
        self.capture_chunks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {key.lower(): value or "" for key, value in attrs}
        classes = set(attr_map.get("class", "").lower().split())

        if tag == "div" and "thumbnail" in classes and self.current_card is None:
            self.current_card = {"source_url": self.base_url}
            self.thumbnail_depth = 1
            return

        if self.current_card is None:
            return

        if tag == "div":
            self.thumbnail_depth += 1
        elif tag == "img" and attr_map.get("src") and not self.current_card.get("image_url"):
            self.current_card["image_url"] = urljoin(self.base_url, attr_map["src"])
        elif tag == "a" and "title" in classes:
            href = attr_map.get("href")
            title = attr_map.get("title")
            if href:
                self.current_card["source_url"] = urljoin(self.base_url, href)
            if title:
                self.current_card["name"] = clean_text(title)
            self.start_capture("name", tag)
        elif tag == "h4" and "price" in classes:
            self.start_capture("price", tag)
        elif tag == "h4" and "title" in classes:
            self.start_capture("name", tag)
        elif tag == "h4" and not classes and not self.current_card.get("name"):
            self.start_capture("name", tag)
        elif tag == "p" and "description" in classes:
            self.start_capture("description", tag)

    def handle_endtag(self, tag: str) -> None:
        if self.current_card is None:
            return

        if self.capture_tag == tag and self.capture_field:
            value = clean_text(" ".join(self.capture_chunks))
            if value and (self.capture_field != "name" or not self.current_card.get("name")):
                self.current_card[self.capture_field] = value
            self.capture_field = None
            self.capture_tag = None
            self.capture_chunks = []

        if tag == "div":
            self.thumbnail_depth -= 1
            if self.thumbnail_depth <= 0:
                if self.current_card.get("name") and self.current_card.get("price"):
                    self.cards.append(self.current_card)
                self.current_card = None
                self.thumbnail_depth = 0

    def handle_data(self, data: str) -> None:
        if self.capture_field:
            self.capture_chunks.append(data)

    def start_capture(self, field: str, tag: str) -> None:
        self.capture_field = field
        self.capture_tag = tag
        self.capture_chunks = []


class TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.rows: list[list[str]] = []
        self.current_row: list[str] | None = None
        self.capture_cell = False
        self.cell_chunks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "tr":
            self.current_row = []
        elif tag in {"td", "th"} and self.current_row is not None:
            self.capture_cell = True
            self.cell_chunks = []

    def handle_endtag(self, tag: str) -> None:
        if tag in {"td", "th"} and self.capture_cell and self.current_row is not None:
            self.current_row.append(clean_text(" ".join(self.cell_chunks)))
            self.capture_cell = False
            self.cell_chunks = []
        elif tag == "tr" and self.current_row is not None:
            if any(cell for cell in self.current_row):
                self.rows.append(self.current_row)
            self.current_row = None

    def handle_data(self, data: str) -> None:
        if self.capture_cell:
            self.cell_chunks.append(data)


class EluktronicsListingParser(HTMLParser):
    def __init__(self, base_url: str) -> None:
        super().__init__()
        self.base_url = base_url
        self.products: list[dict[str, str]] = []
        self.current_product: dict[str, str] | None = None
        self.article_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {key.lower(): value or "" for key, value in attrs}
        classes = set(attr_map.get("class", "").lower().split())

        if tag == "article" and "product-block" in classes:
            self.current_product = {
                "source_product_id": attr_map.get("data-product-id", ""),
                "name": attr_map.get("data-product-title") or attr_map.get("data-name", ""),
                "price": attr_map.get("data-product-price", ""),
                "source_category": attr_map.get("data-product-category", ""),
            }
            self.article_depth = 1
            return

        if self.current_product is None:
            return

        if tag == "article":
            self.article_depth += 1
        elif tag == "a":
            href = attr_map.get("data-product-href") or attr_map.get("href")
            if href and not self.current_product.get("source_url"):
                self.current_product["source_url"] = urljoin(self.base_url, href)
        elif tag == "img":
            image = attr_map.get("src") or attr_map.get("data-src")
            if image and not self.current_product.get("image_url"):
                self.current_product["image_url"] = urljoin(self.base_url, image)

    def handle_endtag(self, tag: str) -> None:
        if self.current_product is None:
            return

        if tag == "article":
            self.article_depth -= 1
            if self.article_depth <= 0:
                if self.current_product.get("name") and self.current_product.get("source_url"):
                    self.products.append(self.current_product)
                self.current_product = None
                self.article_depth = 0


def clean_text(value: Any) -> str:
    text = str(value)
    for _ in range(3):
        unescaped = unescape(text)
        if unescaped == text:
            break
        text = unescaped

    text = re.sub(r"(?i)&?#x0*a0;", " ", text)
    text = re.sub(r"(?i)&?nbsp;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def strip_tags(html: str) -> str:
    return clean_text(re.sub(r"<[^>]+>", " ", html))


def normalize_for_matching(value: str) -> str:
    value = value.translate(TURKISH_ASCII_TRANSLATION)
    normalized = unicodedata.normalize("NFKD", value)
    return normalized.encode("ascii", errors="ignore").decode("ascii").lower()


def contains_spec_text(value: str) -> bool:
    return bool(SPEC_TEXT_PATTERN.search(normalize_for_matching(value)))


def strip_retailer_tail(value: str) -> str:
    return clean_text(RETAILER_TAIL_PATTERN.sub("", value))


def extract_brand_name(source_name: str, product_name: str) -> str:
    name = clean_text(product_name)
    normalized_name = normalize_for_matching(name)

    for brand in sorted(KNOWN_BRANDS, key=len, reverse=True):
        normalized_brand = normalize_for_matching(brand)
        if normalized_name == normalized_brand or normalized_name.startswith(f"{normalized_brand} "):
            return brand[:200]

    fallback = SOURCE_BRAND_FALLBACKS.get(source_name)
    if fallback:
        return fallback[:200]

    match = re.match(r"[A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?", name)
    return (match.group(0) if match else source_name).strip()[:200]


def import_run_manifest_path(run_id: str) -> Path:
    safe_run_id = re.sub(r"[^A-Za-z0-9_.-]+", "_", run_id).strip("._-")
    return IMPORT_RUN_MANIFESTS_DIR / f"{safe_run_id or 'scrape-run'}.json"


def write_import_run_manifest(run_id: str, serial_numbers: list[str]) -> None:
    IMPORT_RUN_MANIFESTS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "run_id": run_id,
        "created_at": datetime.now(UTC).isoformat(),
        "inserted_serial_numbers": serial_numbers,
    }
    import_run_manifest_path(run_id).write_text(
        json.dumps(payload, ensure_ascii=True, indent=2),
        encoding="utf-8",
    )


def read_import_run_manifest(run_id: str) -> list[str]:
    path = import_run_manifest_path(run_id)
    if not path.exists():
        return []

    payload = json.loads(path.read_text(encoding="utf-8"))
    serial_numbers = payload.get("inserted_serial_numbers", [])
    return [clean_text(serial_number) for serial_number in serial_numbers if clean_text(serial_number)]


def source_name_from_legacy_distributor(distributor: str | None) -> str | None:
    cleaned = clean_text(distributor or "")
    if not cleaned.startswith(SCRAPED_DISTRIBUTOR_PREFIX):
        return None
    return clean_text(cleaned[len(SCRAPED_DISTRIBUTOR_PREFIX) :].split(":", 1)[0]) or None


def product_specs_description(description: str | None, name: str | None = None) -> str | None:
    text = strip_retailer_tail(clean_text(description or ""))
    if text:
        text = re.sub(r"^.*?\bfeaturing\b\s+", "", text, count=1, flags=re.IGNORECASE)
        with_match = re.search(r"\bwith\b\s+", text, flags=re.IGNORECASE)
        if with_match and not contains_spec_text(text[:with_match.start()]):
            text = text[with_match.end():]

        for pattern in MARKETING_COPY_PATTERNS:
            text = pattern.sub("", text)

        text = re.sub(r"\bpowerful and affordable\s+", "", text, flags=re.IGNORECASE)
        text = MARKETING_WORD_PATTERN.sub("", text)
        text = re.sub(r"\ba\s+and\s+", "a ", text, flags=re.IGNORECASE)
        text = re.sub(r"\ban\s+and\s+", "an ", text, flags=re.IGNORECASE)
        text = re.sub(r",\s*Weighing", ". Weighing", text)
        text = re.sub(r"\s+([,.;])", r"\1", text)
        text = re.sub(r"(?:,\s*)+\.", ".", text)
        text = re.sub(r"^(?:the|a|an)\s+", "", strip_retailer_tail(text), flags=re.IGNORECASE)
        text = text.strip(" .,;:-\u2013\u2014")
        if contains_spec_text(text):
            return text[:1000]

    fallback = strip_retailer_tail(clean_text(name or ""))
    if " - " in fallback:
        fallback = fallback.split(" - ", 1)[1]
    elif ":" in fallback:
        fallback = fallback.split(":", 1)[1]

    fallback = MARKETING_WORD_PATTERN.sub("", fallback)
    fallback = re.sub(r"\bperformance\b", "", fallback, flags=re.IGNORECASE)
    fallback = strip_retailer_tail(fallback).strip(" .,;:-\u2013\u2014")
    return fallback[:1000] if contains_spec_text(fallback) else None


def fetch_url(url: str, timeout: int) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def is_allowed_by_source(source: str, url: str) -> bool:
    allowed_domains = SOURCE_DOMAINS.get(source)
    if not allowed_domains:
        return False

    hostname = urlparse(url).hostname or ""
    return hostname.lower() in allowed_domains


def is_allowed_by_robots(url: str, timeout: int) -> bool:
    parsed_url = urlparse(url)
    robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"
    parser = robotparser.RobotFileParser()
    parser.set_url(robots_url)
    try:
        robots_txt = fetch_url(robots_url, timeout)
    except HTTPError as error:
        if error.code in {401, 403}:
            return False
        if 400 <= error.code < 500:
            return True
        print(f"robots check failed: {robots_url} ({error})")
        return False
    except (URLError, TimeoutError) as error:
        print(f"robots check failed: {robots_url} ({error})")
        return False
    parser.parse(robots_txt.splitlines())
    return parser.can_fetch(USER_AGENT, url)


def parse_json_ld_products(chunks: list[str]) -> list[dict[str, Any]]:
    products: list[dict[str, Any]] = []

    def visit(node: Any) -> None:
        if isinstance(node, list):
            for item in node:
                visit(item)
            return

        if not isinstance(node, dict):
            return

        node_type = node.get("@type")
        node_types = node_type if isinstance(node_type, list) else [node_type]
        if any(str(item).lower() == "product" for item in node_types):
            products.append(node)

        graph = node.get("@graph")
        if graph:
            visit(graph)

    for chunk in chunks:
        try:
            visit(json.loads(chunk))
        except json.JSONDecodeError:
            continue

    return products


def first_value(*values: Any) -> str | None:
    for value in values:
        if isinstance(value, list) and value:
            value = value[0]
        if value is None:
            continue
        cleaned = clean_text(value)
        if cleaned:
            return cleaned
    return None


def parse_price(value: Any) -> Decimal | None:
    if value is None:
        return None

    text = clean_text(value)
    if not text:
        return None

    match = re.search(r"(\d[\d.,]*)", text)
    if not match:
        return None

    number = match.group(1)
    if "," in number and "." in number:
        if number.rfind(",") > number.rfind("."):
            number = number.replace(".", "").replace(",", ".")
        else:
            number = number.replace(",", "")
    elif "," in number:
        number = number.replace(".", "").replace(",", ".")

    try:
        return Decimal(number).quantize(Decimal("0.01"))
    except InvalidOperation:
        return None


def normalize_currency(value: Any) -> str | None:
    cleaned = clean_text(value or "").upper()
    if re.fullmatch(r"[A-Z]{3}", cleaned):
        return cleaned
    return None


def extract_bigcommerce_bodl_currency(html: str) -> str | None:
    for match in re.finditer(r"window\.bodl\s*=\s*JSON\.parse\(decodeBase64\(\"([^\"]+)\"\)\)", html):
        try:
            decoded = base64.b64decode(match.group(1)).decode("utf-8", errors="replace")
        except Exception:
            continue

        currency_match = re.search(r'"currency"\s*:\s*"([A-Z]{3})"', decoded)
        if currency_match:
            return currency_match.group(1)

    return None


def extract_woocommerce_currency(html: str) -> str | None:
    match = re.search(r'woocs_current_currency\s*=\s*\{[^}]*"name"\s*:\s*"([A-Z]{3})"', html)
    if match:
        return match.group(1)
    return None


def detect_currency(source: str, html: str, parser: ProductPageParser | None = None, offers: dict[str, Any] | None = None) -> str | None:
    currency = first_value(
        offers.get("priceCurrency") if offers else None,
        parser.meta.get("product:price:currency") if parser else None,
        parser.meta.get("og:price:currency") if parser else None,
    )
    normalized_currency = normalize_currency(currency)
    if normalized_currency:
        return normalized_currency

    if source == "eluktronics":
        return extract_bigcommerce_bodl_currency(html) or SOURCE_DEFAULT_CURRENCIES.get(source)
    if source == "laptopwithlinux":
        return extract_woocommerce_currency(html) or SOURCE_DEFAULT_CURRENCIES.get(source)

    return SOURCE_DEFAULT_CURRENCIES.get(source)


def parse_prices_from_text(text: str, source: str) -> list[Decimal]:
    if source in {"bestbuy", "eluktronics", "laptopwithlinux", "system76", "webscraper"}:
        candidates = re.findall(r"\$\s*(\d[\d,]*(?:\.\d{2})?)", text)
    else:
        candidates = re.findall(r"(\d[\d.]*,\d{2})\s*TL", text, flags=re.IGNORECASE)

    prices = [price for price in (parse_price(candidate) for candidate in candidates) if price]
    return [price for price in prices if price > 0]


def parse_stock_quantity(text: str) -> int | None:
    lowered = normalize_for_matching(text)
    if any(token in lowered for token in ("out of stock", "sold out", "tukendi", "stokta yok")):
        return 0
    return None


def infer_category(name: str, url: str) -> str | None:
    haystack = normalize_for_matching(f"{name} {url}")
    for category, keywords in CATEGORY_KEYWORDS:
        if category in SUPPORTED_PRODUCT_CATEGORIES and any(keyword in haystack for keyword in keywords):
            return category
    return None


def is_excluded_product(name: str) -> bool:
    normalized_name = normalize_for_matching(name)
    return any(pattern.search(normalized_name) for pattern in EXCLUDED_PRODUCT_PATTERNS)


def is_missing_required_image(source: str, image_url: str | None) -> bool:
    return source in IMAGE_REQUIRED_SOURCES and not clean_text(image_url or "")


def is_missing_required_price(source: str, price: Decimal | None) -> bool:
    return source in PRICE_REQUIRED_SOURCES and price is None


def extract_bigcommerce_mpn(html: str) -> str | None:
    match = re.search(r'"mpn"\s*:\s*"([^"]+)"', html)
    if not match:
        return None
    return clean_text(match.group(1).replace("\\/", "/"))


def extract_source_product_id(source: str, url: str, text: str, json_ld_product: dict[str, Any] | None) -> str | None:
    sku = first_value(
        json_ld_product.get("sku") if json_ld_product else None,
        json_ld_product.get("mpn") if json_ld_product else None,
    )
    if sku:
        return sku[:100]

    if source == "bestbuy":
        match = re.search(r"(?:skuId=|/)(\d{5,})(?:[^\d]|$)", url)
        if match:
            return match.group(1)[:100]

    if source == "itopya":
        normalized_text = normalize_for_matching(text)
        code_match = re.search(r"urun kodu:\s*([a-z0-9._-]+)", normalized_text, flags=re.IGNORECASE)
        if code_match:
            return clean_text(code_match.group(1))[:100]

        url_match = re.search(r"_([uh]\d+)", url)
        if url_match:
            return url_match.group(1)[:100]

    if source == "webscraper":
        match = re.search(r"/product/(\d+)", url)
        if match:
            return f"webscraper-{match.group(1)}"[:100]

    if source == "system76":
        match = re.search(r"/laptops/([a-z0-9-]+)", urlparse(url).path, flags=re.IGNORECASE)
        if match:
            return f"system76-{match.group(1)}"[:100]

    if source == "laptopwithlinux":
        match = re.search(r"/product/([a-z0-9-]+)", urlparse(url).path, flags=re.IGNORECASE)
        if match:
            return f"lwl-{match.group(1)}"[:100]

    if source == "eluktronics":
        match = re.search(r"/([a-z0-9][a-z0-9-]+)$", urlparse(url).path.rstrip("/"), flags=re.IGNORECASE)
        if match:
            return f"eluktronics-{match.group(1).lower()}"[:100]

    return None


def extract_product_links(source: str, base_url: str, html: str, parser: ProductPageParser) -> list[str]:
    pattern = PRODUCT_LINK_PATTERNS.get(source)
    if not pattern:
        return []

    candidates = set(pattern.findall(html))

    links: list[str] = []
    for candidate in [*parser.links, *candidates]:
        next_url = urljoin(base_url, candidate)
        comparable_url = urlparse(next_url).path
        if urlparse(next_url).query:
            comparable_url = f"{comparable_url}?{urlparse(next_url).query}"
        if is_allowed_by_source(source, next_url) and pattern.search(comparable_url):
            links.append(next_url)

    return sorted(set(links))


def parse_webscraper_cards(url: str, html: str) -> list[ScrapedProduct]:
    parser = WebScraperCatalogParser(url)
    parser.feed(html)

    products: list[ScrapedProduct] = []
    for card in parser.cards:
        source_url = card.get("source_url", url)
        source_product_id = extract_source_product_id("webscraper", source_url, "", None)
        name = clean_text(card.get("name", ""))
        if not source_product_id or not name or is_excluded_product(name):
            continue

        category = infer_category(name, f"{url} {source_url} {card.get('description', '')}")
        if not category:
            continue

        products.append(
            ScrapedProduct(
                source_name="webscraper",
                source_product_id=source_product_id,
                source_url=source_url,
                name=name[:200],
                price=parse_price(card.get("price")),
                currency=detect_currency("webscraper", "", None, None),
                original_price=None,
                original_currency=None,
                usd_conversion_rate=None,
                category=category,
                item_type=category,
                image_url=card.get("image_url"),
                description=product_specs_description(card.get("description"), name),
                stock_quantity=None,
                model=name[:100],
            )
        )

    return products


def parse_scrapingcourse_table(url: str, html: str) -> list[ScrapedProduct]:
    parser = TableParser()
    parser.feed(html)

    products: list[ScrapedProduct] = []
    header: list[str] | None = None

    for row in parser.rows:
        normalized_row = [normalize_for_matching(cell) for cell in row]
        if "product id" in normalized_row and "price" in normalized_row:
            header = normalized_row
            continue

        if not header or len(row) < len(header):
            continue

        data = dict(zip(header, row, strict=False))
        product_id = clean_text(data.get("product id", ""))
        name = clean_text(data.get("name", ""))
        if is_excluded_product(name):
            continue

        source_category = clean_text(data.get("category", ""))
        price = parse_price(data.get("price"))
        if is_missing_required_price("scrapingcourse", price):
            continue
        in_stock = normalize_for_matching(data.get("in stock", ""))
        category = infer_category(name, f"{source_category} {url}")

        if not product_id or not name or not category:
            continue

        products.append(
            ScrapedProduct(
                source_name="scrapingcourse",
                source_product_id=f"scrapingcourse-{product_id}"[:100],
                source_url=url,
                name=name[:200],
                price=price,
                currency=detect_currency("scrapingcourse", html, None, None),
                original_price=None,
                original_currency=None,
                usd_conversion_rate=None,
                category=category,
                item_type=category,
                image_url=None,
                description=None,
                stock_quantity=1 if in_stock == "yes" else 0 if in_stock == "no" else None,
                model=name[:100],
            )
        )

    return products


def parse_eluktronics_listing(url: str, html: str) -> list[ScrapedProduct]:
    parser = EluktronicsListingParser(url)
    parser.feed(html)
    currency = detect_currency("eluktronics", html, None, None)

    products: list[ScrapedProduct] = []
    for raw_product in parser.products:
        name = clean_text(raw_product.get("name", ""))
        source_url = raw_product.get("source_url", url)
        source_product_id = clean_text(raw_product.get("source_product_id", ""))
        source_category = clean_text(raw_product.get("source_category", ""))
        category = infer_category(name, f"{source_category} {source_url}")

        if not source_product_id:
            source_product_id = extract_source_product_id("eluktronics", source_url, "", None) or ""
        if not source_product_id or not name or not category:
            continue

        item_type = "gaming_laptop" if "gaming" in normalize_for_matching(f"{name} {source_category}") or "rtx" in normalize_for_matching(name) else category
        image_url = raw_product.get("image_url")
        if is_missing_required_image("eluktronics", image_url):
            continue
        price = parse_price(raw_product.get("price"))
        if is_missing_required_price("eluktronics", price):
            continue

        products.append(
            ScrapedProduct(
                source_name="eluktronics",
                source_product_id=f"eluktronics-{source_product_id}"[:100],
                source_url=source_url,
                name=name[:200],
                price=price,
                currency=currency,
                original_price=None,
                original_currency=None,
                usd_conversion_rate=None,
                category=category,
                item_type=item_type,
                image_url=image_url,
                description=product_specs_description(None, name),
                stock_quantity=None,
                model=source_product_id[:100],
            )
        )

    return products


def parse_listing_products(source: str, url: str, html: str) -> list[ScrapedProduct]:
    if source == "eluktronics":
        return parse_eluktronics_listing(url, html)
    if source == "webscraper":
        return parse_webscraper_cards(url, html)
    if source == "scrapingcourse":
        return parse_scrapingcourse_table(url, html)
    return []


def parse_usd_rate_overrides(overrides: list[str]) -> dict[str, Decimal]:
    rates: dict[str, Decimal] = {}
    for override in overrides:
        if "=" not in override:
            raise ValueError(f"invalid --usd-rate value: {override}")
        currency, rate = override.split("=", 1)
        normalized_currency = normalize_currency(currency)
        if not normalized_currency:
            raise ValueError(f"invalid --usd-rate currency: {currency}")
        try:
            parsed_rate = Decimal(rate)
        except InvalidOperation as error:
            raise ValueError(f"invalid --usd-rate number: {rate}") from error
        if parsed_rate <= 0:
            raise ValueError(f"--usd-rate must be positive: {override}")
        rates[normalized_currency] = parsed_rate
    return rates


def fetch_usd_rate(currency: str, timeout: int) -> Decimal:
    url = f"{RATE_API_URL}?{urlencode({'from': currency, 'to': USD_CURRENCY})}"
    payload = json.loads(fetch_url(url, timeout))
    rate = payload.get("rates", {}).get(USD_CURRENCY)
    if rate is None:
        raise ValueError(f"USD rate not found for {currency}")
    return Decimal(str(rate))


def round_converted_usd_price(price: Decimal) -> Decimal:
    rounded_to_zero = (
        (price / PRICE_ROUNDING_INCREMENT).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        * PRICE_ROUNDING_INCREMENT
    )
    retail_price = rounded_to_zero - RETAIL_PRICE_OFFSET
    if retail_price <= 0:
        return MIN_RETAIL_PRICE
    return retail_price.quantize(Decimal("0.01"))


def normalize_prices_to_usd(products: list[ScrapedProduct], args: argparse.Namespace) -> None:
    if not args.convert_prices_to_usd:
        return

    rates = parse_usd_rate_overrides(args.usd_rate)

    for product in products:
        currency = normalize_currency(product.currency)
        if not product.price or not currency or currency == USD_CURRENCY:
            product.currency = currency or product.currency
            continue

        rate = rates.get(currency)
        if rate is None:
            try:
                rate = fetch_usd_rate(currency, args.timeout)
            except Exception as error:
                message = f"could not convert {currency} to USD ({error})"
                if args.commit:
                    raise RuntimeError(message) from error
                print(f"warning: {message}")
                continue
            rates[currency] = rate

        product.original_price = product.price
        product.original_currency = currency
        product.usd_conversion_rate = rate
        product.price = round_converted_usd_price(product.price * rate)
        product.currency = USD_CURRENCY


def parse_product_page(source: str, url: str, html: str) -> ScrapedProduct | None:
    if source == "webscraper":
        products = parse_webscraper_cards(url, html)
        return products[0] if products else None
    if source == "system76" and urlparse(url).path.rstrip("/") == "/laptops":
        return None

    parser = ProductPageParser()
    parser.feed(html)
    text = strip_tags(html)
    json_ld_products = parse_json_ld_products(parser.json_ld_chunks)
    json_ld_product = json_ld_products[0] if json_ld_products else None
    offers = json_ld_product.get("offers") if json_ld_product else None
    if isinstance(offers, list):
        offers = offers[0] if offers else None
    if not isinstance(offers, dict):
        offers = {}

    name = first_value(
        json_ld_product.get("name") if json_ld_product else None,
        parser.meta.get("og:title"),
        parser.meta.get("twitter:title"),
        parser.title,
    )
    if not name:
        return None

    name = re.sub(r"\s*\|\s*(ITOPYA(?:\.COM)?|Best Buy).*$", "", name, flags=re.IGNORECASE)
    if is_excluded_product(name):
        return None

    category = infer_category(name, url)
    if not category:
        return None

    price = parse_price(
        first_value(
            offers.get("price") if offers else None,
            parser.meta.get("product:price:amount"),
            parser.meta.get("og:price:amount"),
        )
    )
    if price is None:
        page_prices = parse_prices_from_text(text, source)
        price = min(page_prices) if page_prices else None
    if is_missing_required_price(source, price):
        return None

    image = first_value(
        json_ld_product.get("image") if json_ld_product else None,
        parser.meta.get("og:image"),
        parser.meta.get("twitter:image"),
    )
    if is_missing_required_image(source, image):
        return None

    description = product_specs_description(
        first_value(
            json_ld_product.get("description") if json_ld_product else None,
            parser.meta.get("description"),
            parser.meta.get("og:description"),
        ),
        name,
    )
    model = first_value(
        json_ld_product.get("model") if json_ld_product else None,
        json_ld_product.get("mpn") if json_ld_product else None,
        extract_bigcommerce_mpn(html) if source == "system76" else None,
    )
    source_product_id = extract_source_product_id(source, url, text, json_ld_product)
    if not source_product_id:
        return None
    availability = normalize_for_matching(parser.meta.get("og:availability", ""))
    if availability == "instock":
        stock_quantity = 1
    elif availability == "outofstock":
        stock_quantity = 0
    else:
        stock_quantity = parse_stock_quantity(text)

    return ScrapedProduct(
        source_name=source,
        source_product_id=source_product_id,
        source_url=url,
        name=name[:200],
        price=price,
        currency=detect_currency(source, html, parser, offers),
        original_price=None,
        original_currency=None,
        usd_conversion_rate=None,
        category=category,
        item_type=category,
        image_url=image,
        description=description,
        stock_quantity=stock_quantity,
        model=model[:100] if model else None,
    )


def collect_products(args: argparse.Namespace) -> list[ScrapedProduct]:
    queued_urls = list(dict.fromkeys(args.url))
    visited_urls: set[str] = set()
    product_urls: set[str] = set()
    products: list[ScrapedProduct] = []

    while queued_urls and len(visited_urls) < args.max_pages:
        url = queued_urls.pop(0)
        if url in visited_urls:
            continue
        visited_urls.add(url)

        if not is_allowed_by_source(args.source, url):
            print(f"skip domain: {url}")
            continue

        if args.respect_robots and not is_allowed_by_robots(url, args.timeout):
            print(f"skip robots: {url}")
            continue

        try:
            html = fetch_url(url, args.timeout)
        except (HTTPError, URLError, TimeoutError) as error:
            print(f"fetch failed: {url} ({error})")
            continue

        parser = ProductPageParser()
        parser.feed(html)

        parsed_products = parse_listing_products(args.source, url, html)
        if not parsed_products:
            parsed_product = parse_product_page(args.source, url, html)
            parsed_products = [parsed_product] if parsed_product else []

        if parsed_products:
            for parsed_product in parsed_products:
                if parsed_product.source_product_id in product_urls:
                    continue
                product_urls.add(parsed_product.source_product_id)
                products.append(parsed_product)
                print(f"product: {parsed_product.name} [{parsed_product.source_product_id}]")
                if len(products) >= args.limit:
                    break
        else:
            links = extract_product_links(args.source, url, html, parser)
            for link in links:
                if link not in visited_urls and link not in queued_urls:
                    queued_urls.append(link)

        if args.sleep:
            time.sleep(args.sleep)

        if len(products) >= args.limit:
            break

    return products


def import_products(products: list[ScrapedProduct], run_id: str, update_existing: bool) -> dict[str, int]:
    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models.product import Product
    from app.services.product_variants import extract_variant_specs, infer_variant_group

    def fill_variant_fields(product: Product) -> None:
        specs = extract_variant_specs(product)
        if product.ram_capacity_gb is None:
            product.ram_capacity_gb = specs.ram_capacity_gb
        if product.storage_capacity_gb is None:
            product.storage_capacity_gb = specs.storage_capacity_gb
        if not (product.variant_group or "").strip():
            product.variant_group = infer_variant_group(product)

    inserted = 0
    updated = 0
    skipped = 0
    retagged = 0
    inserted_serial_numbers: list[str] = []

    with SessionLocal() as db:
        for scraped in products:
            distributor = extract_brand_name(scraped.source_name, scraped.name)
            existing = db.scalar(
                select(Product).where(
                    Product.serial_number == scraped.source_product_id,
                )
            )
            description = scraped.description

            if existing:
                if not update_existing:
                    if existing.distributor != distributor:
                        existing.distributor = distributor
                        retagged += 1
                    skipped += 1
                    continue

                existing.name = scraped.name
                existing.model = scraped.model
                existing.description = description
                existing.price = scraped.price
                existing.stock_quantity = scraped.stock_quantity
                existing.image_url = scraped.image_url
                existing.category = scraped.category
                existing.item_type = scraped.item_type
                existing.distributor = distributor
                fill_variant_fields(existing)
                updated += 1
                continue

            product = Product(
                name=scraped.name,
                model=scraped.model,
                serial_number=scraped.source_product_id,
                description=description,
                price=scraped.price,
                warranty_status=None,
                distributor=distributor,
                stock_quantity=scraped.stock_quantity,
                image_url=scraped.image_url,
                category=scraped.category,
                item_type=scraped.item_type,
            )
            fill_variant_fields(product)
            db.add(product)
            inserted += 1
            inserted_serial_numbers.append(scraped.source_product_id)

        db.commit()

    if inserted_serial_numbers:
        write_import_run_manifest(run_id, inserted_serial_numbers)

    return {"inserted": inserted, "updated": updated, "retagged": retagged, "skipped": skipped}


def cleanup_run(run_id: str, commit: bool) -> int:
    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models.product import Product

    serial_numbers = list(dict.fromkeys(read_import_run_manifest(run_id)))

    with SessionLocal() as db:
        if serial_numbers:
            products = db.scalars(
                select(Product).where(Product.serial_number.in_(serial_numbers))
            ).all()
        else:
            products = db.scalars(
                select(Product).where(
                    Product.distributor.like(f"{SCRAPED_DISTRIBUTOR_PREFIX}%:{run_id}"),
                )
            ).all()

        count = len(products)
        if commit:
            for product in products:
                db.delete(product)
            db.commit()
            if serial_numbers:
                import_run_manifest_path(run_id).unlink(missing_ok=True)

        return count


def retag_scraped_distributors(commit: bool) -> int:
    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models.product import Product

    with SessionLocal() as db:
        products = db.scalars(
            select(Product).where(Product.distributor.like(f"{SCRAPED_DISTRIBUTOR_PREFIX}%"))
        ).all()

        count = 0
        for product in products:
            source_name = source_name_from_legacy_distributor(product.distributor) or "scraped"
            distributor = extract_brand_name(source_name, product.name or "")
            if product.distributor == distributor:
                continue
            product.distributor = distributor
            count += 1

        if commit:
            db.commit()

        return count


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Scrape electronics product pages and optionally import them into the SUtore database.",
    )
    parser.add_argument("--source", choices=sorted(SOURCE_DOMAINS), default="itopya")
    parser.add_argument("--url", action="append", default=[], help="Product or listing URL to scrape.")
    parser.add_argument("--limit", type=int, default=10, help="Maximum products to collect.")
    parser.add_argument("--max-pages", type=int, default=30, help="Maximum pages to fetch.")
    parser.add_argument("--sleep", type=float, default=1.0, help="Delay between requests.")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT_SECONDS)
    parser.add_argument("--commit", action="store_true", help="Write inserts/updates/deletes to the database.")
    parser.add_argument("--update-existing", action="store_true", help="Update rows previously imported from the same source id.")
    parser.add_argument("--cleanup-run-id", help="Delete scraper rows created by a specific run id.")
    parser.add_argument("--retag-scraped-distributors", action="store_true", help="Replace legacy Scraped:* distributors with brand names.")
    parser.add_argument("--run-id", default=datetime.now(UTC).strftime("scrape-%Y%m%d%H%M%S"))
    parser.add_argument("--usd-rate", action="append", default=[], help="Manual conversion rate to USD, e.g. TRY=0.031.")
    parser.add_argument("--no-usd-conversion", dest="convert_prices_to_usd", action="store_false")
    parser.add_argument("--no-robots-check", dest="respect_robots", action="store_false")
    parser.set_defaults(respect_robots=True, convert_prices_to_usd=True)
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.cleanup_run_id:
        count = cleanup_run(args.cleanup_run_id, args.commit)
        action = "deleted" if args.commit else "would delete"
        print(f"{action} {count} products for run id {args.cleanup_run_id}")
        return 0

    if args.retag_scraped_distributors:
        count = retag_scraped_distributors(args.commit)
        action = "retagged" if args.commit else "would retag"
        print(f"{action} {count} scraped product distributors")
        return 0

    if not args.url:
        parser.error("at least one --url is required unless --cleanup-run-id or --retag-scraped-distributors is used")

    products = collect_products(args)
    normalize_prices_to_usd(products, args)
    print(json.dumps([product.__dict__ for product in products], default=str, ensure_ascii=True, indent=2))

    if not args.commit:
        print(f"dry-run only. run id would be: {args.run_id}")
        return 0

    result = import_products(products, args.run_id, args.update_existing)
    print(json.dumps({"run_id": args.run_id, **result}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
