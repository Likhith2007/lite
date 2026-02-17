# LiteParse Python

Python wrapper for [LiteParse](https://github.com/run-llama/liteparse) - fast, lightweight document parsing with optional OCR.

## Installation

```bash
pip install liteparse
```

**Prerequisites:** The LiteParse Node.js CLI must be installed:

```bash
npm install -g liteparse
# or
npx liteparse --version
```

## Quick Start

```python
from liteparse import LiteParse

# Create parser
parser = LiteParse()

# Parse a document
result = parser.parse("document.pdf")
print(result.text)

# Access structured data
for page in result.pages:
    print(f"Page {page.pageNum}: {len(page.textItems)} text items")

    # Detected tables from heuristic line analysis
    for table in page.tables:
        print(f"  Table: {table.rows}x{table.cols}")
```

## Configuration

```python
from liteparse import LiteParse

parser = LiteParse()

result = parser.parse(
    "document.pdf",
    ocr_enabled=False,
    max_pages=10,
    dpi=150,
    preserve_small_text=True,
)
print(result.text)
```

## Batch Processing

For parsing multiple files, batch mode is significantly faster as it reuses the PDF engine:

```python
from liteparse import LiteParse

parser = LiteParse(ocr_enabled=False)

# Parse all documents in a directory
result = parser.batch_parse(
    input_dir="./documents",
    output_dir="./output",
    recursive=True,              # Include subdirectories
    extension_filter=".pdf",     # Only PDF files
)

print(f"Parsed {result.success_count} files in {result.total_time_seconds}s")
print(f"Average: {result.avg_time_ms}ms per file")
```

## API Reference

### LiteParse

```python
class LiteParse:
    def __init__(
        self,
        *,
        output_format: OutputFormat = OutputFormat.TEXT,
        ocr_enabled: bool = True,
        ocr_server_url: Optional[str] = None,
        ocr_language: str = "en",
        max_pages: int = 1000,
        dpi: int = 150,
        table_detection: bool = True,
        precise_bounding_box: bool = True,
        cli_path: Optional[str] = None,
    ): ...

    def parse(
        self,
        file_path: Union[str, Path],
        *,
        target_pages: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> ParseResult: ...

    def parse_bytes(
        self,
        data: bytes,
        filename: str = "document.pdf",
        *,
        target_pages: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> ParseResult: ...

    def batch_parse(
        self,
        input_dir: Union[str, Path],
        output_dir: Union[str, Path],
        *,
        recursive: bool = False,
        extension_filter: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> BatchResult: ...

    def get_text(
        self,
        file_path: Union[str, Path],
        *,
        target_pages: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> str: ...
```

### ParseResult

```python
@dataclass
class ParseResult:
    pages: List[ParsedPage]
    text: str
    json: Optional[Dict[str, Any]]

    @property
    def num_pages(self) -> int: ...
    def get_page(self, page_num: int) -> Optional[ParsedPage]: ...
```

### ParsedPage

```python
@dataclass
class ParsedPage:
    pageNum: int
    width: float
    height: float
    text: str
    textItems: List[TextItem]
    boundingBoxes: List[BoundingBox]
    tables: List[DetectedTable]
```

## Supported Formats

- PDF (`.pdf`)
- Microsoft Office (`.docx`, `.xlsx`, `.pptx`, etc.) - requires LibreOffice
- OpenDocument (`.odt`, `.ods`, `.odp`) - requires LibreOffice
- Images (`.png`, `.jpg`, `.tiff`, etc.) - requires ImageMagick
- And more!

## Performance Tips

1. **Disable OCR** if your documents have selectable text:
   ```python
   parser = LiteParse(ocr_enabled=False)
   ```

2. **Use batch mode** for multiple files to avoid cold-start overhead:
   ```python
   parser.batch_parse("./input", "./output")
   ```

3. **Limit pages** if you only need specific pages:
   ```python
   result = parser.parse("doc.pdf", target_pages="1-5")
   ```
