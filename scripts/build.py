"""Package only public Diamond website assets; backend, tests and secrets stay private."""
from pathlib import Path
import shutil
root = Path(__file__).resolve().parents[1]
out = root / 'dist'
if out.exists():
    shutil.rmtree(out)
out.mkdir()
for source in root.iterdir():
    if source.is_file() and (source.suffix in {'.html', '.css', '.js', '.xml', '.txt'} or source.name == 'availability.json'):
        shutil.copy2(source, out / source.name)
shutil.copytree(root / 'images', out / 'images')
(out / '_routes.json').write_text('{"version":1,"include":["/api/*"],"exclude":[]}\n')
print('Built Diamond static website in dist; API routes handled by Pages Functions.')
