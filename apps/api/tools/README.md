# Product Scraper

`scrape_products.py` is a safe-by-default importer for external electronics store pages. By default it is a dry run: it fetches and prints normalized rows, but does not write to the database unless you pass `--commit`.

Prices are normalized to USD by default when a product page returns a local currency. Converted prices are rounded to the nearest retail `.99` price, so `1897.21` becomes `1899.99`. The original price and currency stay in the dry-run JSON, while the imported product description stays product-only. Use `--no-usd-conversion` if you want to keep scraped local prices.

Rows inserted by the scraper use:

```text
distributor = <brand name>
serial_number = <scraper source product id>
```

The imported `description` field only stores product-spec text collected from the product page or product title. It does not store the source URL, run id, category label, or price-conversion notes.

The scraper only imports supported storefront categories: laptop, desktop, monitor, component, storage, network, peripheral, and audio. It skips miscellaneous rows such as phones, tablets, cables, chargers, printers, cameras, controllers, consoles, mousepads, stands, chairs, and bags.

Run ids are tracked in local ignored manifest files under `apps/api/tools/import_runs/` so `distributor` can stay customer-facing.

**Windows PowerShell**
Run these from the repo root:

```powershell
cd apps/api
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
```

If `.venv` does not exist yet:

```powershell
cd apps/api
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
```

If activation is blocked in the current terminal:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Dry-run Itopya OEM builds:

```powershell
python tools\scrape_products.py --source itopya --url "https://www.itopya.com/oem-paketler" --limit 80 --max-pages 120 --sleep 1 --usd-rate TRY=0.02239 --run-id itopya-oem-001
```

Commit Itopya OEM builds to the database:

```powershell
python tools\scrape_products.py --source itopya --url "https://www.itopya.com/oem-paketler" --limit 80 --max-pages 120 --sleep 1 --usd-rate TRY=0.02239 --run-id itopya-oem-001 --commit
```

Dry-run Eluktronics laptops:

```powershell
python tools\scrape_products.py --source eluktronics --url "https://www.eluktronics.com/laptops/" --limit 100 --max-pages 1 --sleep 1 --usd-rate TRY=0.02239 --run-id eluktronics-001
```

Commit Eluktronics laptops to the database:

```powershell
python tools\scrape_products.py --source eluktronics --url "https://www.eluktronics.com/laptops/" --limit 100 --max-pages 1 --sleep 1 --usd-rate TRY=0.02239 --run-id eluktronics-001 --commit
```

**Bash**
Run these from the repo root on Linux/macOS:

```bash
cd apps/api
source .venv/bin/activate
python -m pip install -e .
```

If `.venv` does not exist yet:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
```

Dry-run Itopya OEM builds:

```bash
python tools/scrape_products.py --source itopya --url "https://www.itopya.com/oem-paketler" --limit 80 --max-pages 120 --sleep 1 --usd-rate TRY=0.02239 --run-id itopya-oem-001
```

Commit Itopya OEM builds to the database:

```bash
python tools/scrape_products.py --source itopya --url "https://www.itopya.com/oem-paketler" --limit 80 --max-pages 120 --sleep 1 --usd-rate TRY=0.02239 --run-id itopya-oem-001 --commit
```

Dry-run Eluktronics laptops:

```bash
python tools/scrape_products.py --source eluktronics --url "https://www.eluktronics.com/laptops/" --limit 100 --max-pages 1 --sleep 1 --usd-rate TRY=0.02239 --run-id eluktronics-001
```

Commit Eluktronics laptops to the database:

```bash
python tools/scrape_products.py --source eluktronics --url "https://www.eluktronics.com/laptops/" --limit 100 --max-pages 1 --sleep 1 --usd-rate TRY=0.02239 --run-id eluktronics-001 --commit
```

**Maintenance**
Preview cleanup for one import run:

```powershell
python tools\scrape_products.py --cleanup-run-id itopya-oem-001
```

Actually remove imported rows from that run:

```powershell
python tools\scrape_products.py --cleanup-run-id itopya-oem-001 --commit
```

Fix older scraped rows that still show `Scraped:<source>:<run-id>` as the distributor:

```powershell
python tools\scrape_products.py --retag-scraped-distributors --commit
```

The same maintenance commands in Bash:

```bash
python tools/scrape_products.py --cleanup-run-id itopya-oem-001
python tools/scrape_products.py --cleanup-run-id itopya-oem-001 --commit
python tools/scrape_products.py --retag-scraped-distributors --commit
```

By default the scraper checks robots.txt and skips pages it is not allowed to fetch.
