# Phatta asset tools

How the raster plates and sprites were cut (Python 3, numpy, opencv-python-headless, Pillow).

```sh
export PHATTA_REFS=/path/to/refs   # night.webp, day.webp: Faizi's locked reference art
export PHATTA_OUT=/tmp/phatta-out
python3 build_assets.py            # plates, bells, sprites, meta.json per theme
python3 gen_css.py ../src/video/phatta-geometry.css
```

Then copy `plate@*` and `bells@*` to `apps/gallery/phatta/assets/<theme>/` and every other sprite to
`src/assets/<theme>/`. All measurements (plate pixels) live in `T` in `build_assets.py`; text tuning in `TUNE` in `gen_css.py`.
