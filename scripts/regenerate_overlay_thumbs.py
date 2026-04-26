from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / 'src' / 'overlays'
THUMB_DIR = SOURCE_DIR / 'thumbs'
THUMB_DIR.mkdir(parents=True, exist_ok=True)

MAX_SIZE = (160, 160)

for source_path in sorted(SOURCE_DIR.glob('*.webp')):
    if source_path.name.startswith(('texture', 'lightleak', 'bokeh', 'paper')):
        output_path = THUMB_DIR / source_path.name
        with Image.open(source_path) as img:
            img = img.convert('RGB')
            img.thumbnail(MAX_SIZE, Image.LANCZOS)
            img.save(output_path, 'WEBP', quality=85)
        print(f'Generated thumbnail: {output_path.relative_to(ROOT)} ({img.size})')
