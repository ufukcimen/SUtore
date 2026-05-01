from decimal import Decimal

import pytest

from app.models.product import Product
from app.services.product_variants import (
    collapse_variant_products,
    extract_variant_specs,
    format_capacity_gb,
    infer_variant_group,
    matching_variant_products,
    normalize_variant_group,
    variant_group_key,
)


def make_product(**overrides) -> Product:
    defaults = {
        "product_id": 1,
        "name": "Test Product",
        "model": "TEST-1",
        "description": "",
        "price": Decimal("999.99"),
        "category": "laptop",
        "item_type": "gaming_laptop",
        "distributor": "Test Brand",
        "is_active": True,
    }
    defaults.update(overrides)
    return Product(**defaults)


class TestCapacityFormattingAndNormalization:
    @pytest.mark.parametrize(
        ("capacity_gb", "expected"),
        [
            (None, None),
            (0, None),
            (32, "32 GB"),
            (512, "512 GB"),
            (1024, "1 TB"),
            (2048, "2 TB"),
            (1536, "1536 GB"),
        ],
    )
    def test_format_capacity_gb(self, capacity_gb, expected) -> None:
        assert format_capacity_gb(capacity_gb) == expected

    @pytest.mark.parametrize(
        ("raw_group", "expected"),
        [
            (None, None),
            ("", None),
            ("  OEM Falcon RTX4070  ", "oem falcon rtx4070"),
            ("HYDROC-16/G2 RTX 5090", "hydroc 16 g2 rtx 5090"),
        ],
    )
    def test_normalize_variant_group(self, raw_group, expected) -> None:
        assert normalize_variant_group(raw_group) == expected


class TestTextCapacityExtraction:
    @pytest.mark.parametrize(
        ("name", "description", "expected_ram", "expected_storage"),
        [
            ("Laptop RAM: 32GB SSD: 1TB", "", ("32 GB", 32), ("1 TB", 1024)),
            ("Laptop 16GB RAM 512GB SSD", "", ("16 GB", 16), ("512 GB", 512)),
            (
                "HYDROC 4TB Gen 5 SSD, 96GB 6400MHz RAM",
                "",
                ("96 GB", 96),
                ("4 TB", 4096),
            ),
            ("Compact Laptop 16GB/512GB", "", ("16 GB", 16), ("512 GB", 512)),
            ("Workstation", "Memory: 64GB, NVMe 2TB", ("64 GB", 64), ("2 TB", 2048)),
            (
                "Desktop 32GB DDR5 1TB PCIe 4.0 SSD",
                "",
                ("32 GB", 32),
                ("1 TB", 1024),
            ),
        ],
    )
    def test_extracts_supported_text_formats(
        self,
        name,
        description,
        expected_ram,
        expected_storage,
    ) -> None:
        specs = extract_variant_specs(make_product(name=name, description=description))

        assert (specs.ram_capacity, specs.ram_capacity_gb) == expected_ram
        assert (specs.storage_capacity, specs.storage_capacity_gb) == expected_storage

    def test_uses_largest_bare_capacity_as_storage_for_systems(self) -> None:
        product = make_product(
            name="Creator Laptop 32GB RAM 2TB",
            description="Portable workstation configuration.",
        )

        specs = extract_variant_specs(product)

        assert (specs.ram_capacity, specs.ram_capacity_gb) == ("32 GB", 32)
        assert (specs.storage_capacity, specs.storage_capacity_gb) == ("2 TB", 2048)

    def test_does_not_treat_gpu_memory_as_laptop_variant_capacity(self) -> None:
        product = make_product(
            name="Asus AMD Radeon RX 7800 XT",
            description="16GB graphics card for 1440p gaming.",
            category="component",
            item_type="gpu",
        )

        specs = extract_variant_specs(product)

        assert specs.ram_capacity is None
        assert specs.storage_capacity is None
        assert not specs.has_variant_capacity


class TestStructuredVariantFields:
    def test_capacity_fields_override_text_parsing(self) -> None:
        product = make_product(
            name="Laptop 16GB RAM 512GB SSD",
            ram_capacity_gb=64,
            storage_capacity_gb=2048,
        )

        specs = extract_variant_specs(product)

        assert (specs.ram_capacity, specs.ram_capacity_gb) == ("64 GB", 64)
        assert (specs.storage_capacity, specs.storage_capacity_gb) == ("2 TB", 2048)

    def test_partial_capacity_fields_are_supported_with_explicit_group(self) -> None:
        product = make_product(
            name="OEM Desktop Build",
            variant_group="oem-desktop-rtx4080",
            ram_capacity_gb=32,
            storage_capacity_gb=None,
        )

        specs = extract_variant_specs(product)

        assert (specs.ram_capacity, specs.ram_capacity_gb) == ("32 GB", 32)
        assert specs.storage_capacity is None
        assert variant_group_key(product) == "variant:oem desktop rtx4080"

    def test_explicit_group_can_group_products_without_capacity_text(self) -> None:
        first = make_product(
            product_id=1,
            name="OEM Falcon Build",
            model="FALCON-A",
            variant_group="falcon-rtx4070",
            ram_capacity_gb=32,
            storage_capacity_gb=1024,
        )
        second = make_product(
            product_id=2,
            name="OEM Falcon Build",
            model="FALCON-B",
            variant_group="falcon-rtx4070",
            ram_capacity_gb=64,
            storage_capacity_gb=2048,
        )

        assert variant_group_key(first) == variant_group_key(second)


class TestVariantGroupIdentity:
    def test_inferred_group_ignores_numeric_scraped_model_ids_and_capacities(self) -> None:
        first = make_product(
            product_id=69,
            name=(
                "HYDROC-16 G2 Ultra Pro Edition - Intel Core Ultra 9 275HX, "
                "NVIDIA RTX 5090, 4TB Gen 5 SSD, 48GB 6400MHz RAM"
            ),
            model="2813",
            distributor="Eluktronics",
        )
        second = make_product(
            product_id=73,
            name=(
                "HYDROC-16 G2 Ultra Pro Edition - Intel Core Ultra 9 275HX, "
                "NVIDIA RTX 5090, 4TB Gen 5 SSD, 96GB 6400MHz RAM"
            ),
            model="2816",
            distributor="Eluktronics",
        )

        assert infer_variant_group(first) == infer_variant_group(second)

    def test_inferred_group_keeps_hardware_differences_separate(self) -> None:
        rtx_5080 = make_product(
            name=(
                "HYDROC-16 G2 Ultra Pro Edition - Intel Core Ultra 9 275HX, "
                "NVIDIA RTX 5080, 4TB SSD, 48GB 6400MHz RAM"
            ),
            distributor="Eluktronics",
        )
        rtx_5090 = make_product(
            name=(
                "HYDROC-16 G2 Ultra Pro Edition - Intel Core Ultra 9 275HX, "
                "NVIDIA RTX 5090, 4TB SSD, 48GB 6400MHz RAM"
            ),
            distributor="Eluktronics",
        )

        assert infer_variant_group(rtx_5080) != infer_variant_group(rtx_5090)

    def test_storage_generation_descriptors_do_not_split_same_group(self) -> None:
        plain_storage = make_product(
            name=(
                "HYDROC-16 G2 Ultra Pro Edition - NVIDIA RTX 5080, "
                "4TB SSD, 48GB 6400MHz RAM"
            ),
            distributor="Eluktronics",
        )
        gen_storage = make_product(
            name=(
                "HYDROC-16 G2 Ultra Pro Edition - NVIDIA RTX 5080, "
                "4TB Gen 5 SSD, 96GB 6400MHz RAM"
            ),
            distributor="Eluktronics",
        )

        assert infer_variant_group(plain_storage) == infer_variant_group(gen_storage)

    def test_explicit_variant_group_wins_over_inferred_identity(self) -> None:
        first = make_product(
            product_id=1,
            name="Different Name 32GB RAM 1TB SSD",
            variant_group="OEM Falcon RTX4070",
        )
        second = make_product(
            product_id=2,
            name="Another Name 64GB RAM 2TB SSD",
            variant_group="oem-falcon-rtx4070",
        )

        assert variant_group_key(first) == variant_group_key(second)
        assert variant_group_key(first) == "variant:oem falcon rtx4070"

    def test_products_without_group_or_capacity_remain_standalone(self) -> None:
        product = make_product(
            product_id=9,
            name="Standalone Monitor",
            category="monitor",
            item_type="monitor",
            variant_group=None,
        )

        assert infer_variant_group(product) is None
        assert variant_group_key(product) == "product:9"


class TestProductVariantCollections:
    def test_collapse_chooses_lowest_price_representative(self) -> None:
        products = [
            make_product(
                product_id=1,
                name="OEM Falcon Build",
                price=Decimal("1499.99"),
                variant_group="falcon",
                ram_capacity_gb=64,
                storage_capacity_gb=2048,
            ),
            make_product(
                product_id=2,
                name="OEM Falcon Build",
                price=Decimal("1299.99"),
                variant_group="falcon",
                ram_capacity_gb=32,
                storage_capacity_gb=1024,
            ),
            make_product(
                product_id=3,
                name="Standalone Monitor",
                price=Decimal("399.99"),
                category="monitor",
                item_type="monitor",
            ),
        ]

        collapsed = collapse_variant_products(products)

        assert [product.product_id for product in collapsed] == [2, 3]

    def test_collapse_keeps_standalone_products_separate_even_when_names_match(self) -> None:
        products = [
            make_product(product_id=1, name="USB-C Dock", category="accessory", item_type="dock"),
            make_product(product_id=2, name="USB-C Dock", category="accessory", item_type="dock"),
        ]

        collapsed = collapse_variant_products(products)

        assert [product.product_id for product in collapsed] == [1, 2]

    def test_matching_variants_filters_group_and_sorts_by_configuration(self) -> None:
        current = make_product(
            product_id=1,
            variant_group="falcon",
            ram_capacity_gb=64,
            storage_capacity_gb=2048,
        )
        candidates = [
            make_product(
                product_id=4,
                variant_group="falcon",
                ram_capacity_gb=64,
                storage_capacity_gb=4096,
                price=Decimal("1799.99"),
            ),
            make_product(
                product_id=2,
                variant_group="falcon",
                ram_capacity_gb=32,
                storage_capacity_gb=1024,
                price=Decimal("1299.99"),
            ),
            make_product(
                product_id=3,
                variant_group="falcon",
                ram_capacity_gb=64,
                storage_capacity_gb=2048,
                price=Decimal("1499.99"),
            ),
            make_product(
                product_id=5,
                variant_group="other",
                ram_capacity_gb=32,
                storage_capacity_gb=1024,
                price=Decimal("999.99"),
            ),
        ]

        variants = matching_variant_products(current, candidates)

        assert [product.product_id for product in variants] == [2, 3, 4]
