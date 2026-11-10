"""Build Phatta raster assets from Faizi's reference plates (our own AI-generated art).

Outputs /workspace/work/phv2/out/<theme>/... at 1x and 2x.
Coordinates are plate pixels (1x). Every sprite is cropped from the plate at the exact rect it is shown at,
so placing it back at that rect reproduces the plate.
"""
import json, os
import cv2
import numpy as np
from PIL import Image, ImageFilter

# Reference images are not in the repo: point PHATTA_REFS at a folder holding night.webp, day.webp
# (copies of contra-videojs/locked/phatta-night.webp and phatta-day.webp). Output goes to PHATTA_OUT.
HERE = os.environ.get('PHATTA_REFS', os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get('PHATTA_OUT', os.path.join(HERE, 'out'))

T = {
    'night': dict(
        src='night.webp', W=1376, H=768,
        video=(429, 198, 519, 260),           # x, y, w, h
        track=(412, 503, 551, 20),             # bead track (between the painted end caps)
        gold_src=(415, 585), silver_src=(620, 955),
        ball=(588, 497, 27, 27), ball_c=(601.5, 510.5),
        chip=(579, 469, 45, 24), chip_text=(583, 472, 37, 15),
        erase_above=(574, 464, 56, 39),        # chip + ball area above the track
        erase_below=(586, 523, 31, 3),
        play=(452, 557, 27), vol=(508, 557, 19), cc=(833, 558, 19), rate=(882, 558, 19), fs=(931, 558, 19),
        play_icon=(436, 543, 34, 28), play_tri=(437, 545, 17, 24), play_bars=(455, 545, 14, 24),
        vol_icon=(496, 547, 25, 21), cc_icon=(819, 548, 28, 21), rate_icon=(869, 548, 27, 21), fs_icon=(918, 546, 27, 24),
        vslider=(533, 550, 72, 17), vtrack=(536, 555, 65, 6), vgold_src=(538, 559), vsilver_src=(574, 597), vknob=(559, 551, 15, 15),
        time=(621, 545, 143, 26),
        strip=(402, 523, 575, 79), strip_clean=(766, 806),
        bells=(398, 602, 590, 160),
        nav=dict(logo=(38, 12, 96, 26), skins=(1150, 12, 46, 26), about=(1209, 12, 56, 26), github=(1276, 12, 64, 26)),
        leds=[(609,19),(767,19),(670,24),(705,23),(827,27),(551,27),(492,51),(884,52),(366,54),(1010,55),(429,55),(948,56),(286,79),(1089,79),(195,94),(1180,94),(1247,279),(126,338),(1249,339),(126,401),(128,462),(1247,460)],
    ),
    'day': dict(
        src='day.webp', W=1312, H=816,
        video=(422, 214, 469, 268),
        track=(378, 536, 556, 20),
        gold_src=(385, 550), silver_src=(590, 925),
        ball=(554, 529, 28, 28), ball_c=(567.5, 542.5),
        chip=(545, 503, 46, 22), chip_text=(549, 505, 38, 15),
        erase_above=(540, 498, 56, 38),
        erase_below=(553, 556, 30, 3),
        play=(414.5, 591, 27), vol=(470.5, 591, 19), cc=(813, 591, 19), rate=(860, 591, 19), fs=(906, 591, 19),
        play_icon=(398, 577, 34, 28), play_tri=(400, 579, 17, 24), play_bars=(417, 579, 14, 24),
        vol_icon=(458, 580, 26, 22), cc_icon=(799, 581, 28, 21), rate_icon=(846, 581, 28, 21), fs_icon=(892, 579, 28, 24),
        vslider=(497, 583, 74, 17), vtrack=(500, 588, 67, 6), vgold_src=(502, 524), vsilver_src=(540, 564), vknob=(524, 584, 15, 15),
        time=(589, 578, 148, 28),
        strip=(366, 557, 584, 79), strip_clean=(740, 785),
        bells=(352, 634, 615, 170),
        nav=dict(skins=(1086, 12, 51, 28), about=(1151, 12, 57, 28), github=(1221, 12, 66, 28)),
        leds=[],
    ),
}


def rect_slice(r):
    x, y, w, h = r
    return slice(y, y + h), slice(x, x + w)


def inpaint(img, mask, radius=4):
    return cv2.inpaint(img, mask, radius, cv2.INPAINT_TELEA)


def save(img_bgr_or_bgra, path, s, quality=88, lossless=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if img_bgr_or_bgra.shape[2] == 4:
        im = Image.fromarray(cv2.cvtColor(img_bgr_or_bgra, cv2.COLOR_BGRA2RGBA))
    else:
        im = Image.fromarray(cv2.cvtColor(img_bgr_or_bgra, cv2.COLOR_BGR2RGB))
    if s != 1:
        im = im.resize((im.width * s, im.height * s), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    im.save(path, 'WEBP', quality=quality, method=6, lossless=lossless)
    return os.path.getsize(path)


def build(name, cfg):
    src = cv2.imread(os.path.join(HERE, cfg['src']), cv2.IMREAD_COLOR)
    H, W = src.shape[:2]
    assert (W, H) == (cfg['W'], cfg['H'])
    plate = src.copy()
    mask = np.zeros((H, W), np.uint8)
    sizes = {}
    out = os.path.join(OUT, name)

    # ---- bells: warm metal mask (chains + bells), inpaint behind, keep as an alpha layer
    bx, by, bw, bh = cfg['bells']
    region = src[by:by + bh, bx:bx + bw]
    hsv = cv2.cvtColor(region, cv2.COLOR_BGR2HSV)
    hch, sch, vch = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    warm = ((hch >= 5) & (hch <= 32) & (sch >= 45) & (vch >= 45)).astype(np.uint8)
    gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
    top = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    thin = ((top > 28) & (sch >= 25)).astype(np.uint8)
    bm = cv2.bitwise_or(warm, thin)
    bm = cv2.morphologyEx(bm, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(bm)
    keep = np.zeros_like(bm)
    for i in range(1, n):
        if st[i, 4] >= 12:
            keep[lab == i] = 1
    bm = cv2.dilate(keep, np.ones((3, 3), np.uint8))
    alpha = cv2.GaussianBlur((bm * 255).astype(np.uint8), (3, 3), 0)
    bells = np.dstack([region, alpha])
    full_mask = np.zeros((H, W), np.uint8)
    full_mask[by:by + bh, bx:bx + bw] = cv2.dilate(bm, np.ones((3, 3), np.uint8)) * 255
    for s in (1, 2):
        sizes[f'bells@{s}'] = save(region.copy(), f'{out}/bells@{s}x.webp', s, quality=80 if s == 1 else 70)

    # ---- painted control content to erase from the plate
    def add(r, pad=0):
        x, y, w, h = r
        mask[y - pad:y + h + pad, x - pad:x + w + pad] = 255

    # chip + ball above the track: copy the same rows from 70 px to the left (a plain dark band)
    x, y, w, h = cfg['erase_above']
    plate[y:y + h, x:x + w] = src[y:y + h, x - 70:x - 70 + w]
    x, y, w, h = cfg['erase_below']
    plate[y:y + h, x:x + w] = src[y:y + h, x - 70:x - 70 + w]
    for k in ('vslider', 'time'):
        add(cfg[k])
    hsv_full = cv2.cvtColor(src, cv2.COLOR_BGR2HSV)
    for k in ('play_icon', 'vol_icon', 'cc_icon', 'rate_icon', 'fs_icon'):
        x, y, w, h = cfg[k]
        hs = hsv_full[y:y + h, x:x + w]
        g = ((hs[..., 2] > 95) & (hs[..., 1] < 110)).astype(np.uint8) * 255
        g = cv2.dilate(g, np.ones((3, 3), np.uint8), iterations=1)
        mask[y:y + h, x:x + w] = np.maximum(mask[y:y + h, x:x + w], g)
    plate = inpaint(plate, mask, 3)

    # video rect: black (the live video covers it)
    vx, vy, vw, vh = cfg['video']
    plate[vy:vy + vh, vx:vx + vw] = 0

    for s in (1, 2):
        sizes[f'plate@{s}'] = save(plate, f'{out}/plate@{s}x.webp', s, quality=86 if s == 1 else 74)

    # ---- bead track layers (full width), tiled with the 5 px bead period from painted stretches
    tx, ty, tw, th = cfg['track']
    g0, g1 = cfg['gold_src']; s0, s1 = cfg['silver_src']
    gold = np.zeros((th, tw, 3), np.uint8); silver = np.zeros_like(gold)
    for i in range(tw):
        x = tx + i
        gx = x if x < g1 else g0 + ((x - g0) % (g1 - g0))
        sx = x if x >= s0 else s0 + ((x - s0) % (s1 - s0))
        gold[:, i] = src[ty:ty + th, gx]
        silver[:, i] = src[ty:ty + th, sx]
    for s in (1, 2):
        sizes[f'gold@{s}'] = save(gold, f'{out}/gold@{s}x.webp', s, quality=90)
        sizes[f'silver@{s}'] = save(silver, f'{out}/silver@{s}x.webp', s, quality=90)

    # ---- brass ball (alpha circle)
    x, y, w, h = cfg['ball']
    cx, cy = cfg['ball_c']
    ball = src[y:y + h, x:x + w].copy()
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx + 0.5 - (cx - x)) ** 2 + (yy + 0.5 - (cy - y)) ** 2)
    a = np.clip((12.6 - d) * 255, 0, 255).astype(np.uint8)
    for s in (1, 2):
        sizes[f'ball@{s}'] = save(np.dstack([ball, a]), f'{out}/ball@{s}x.webp', s, quality=92)

    # ---- chip (time tag) with its painted text removed
    x, y, w, h = cfg['chip']
    chip = src[y:y + h, x:x + w].copy()
    cx0, cy0, cw, ch = cfg['chip_text']
    m = np.zeros(chip.shape[:2], np.uint8)
    m[cy0 - y:cy0 - y + ch, cx0 - x:cx0 - x + cw] = 255
    chip_gray = cv2.cvtColor(chip, cv2.COLOR_BGR2GRAY)
    dark = (chip_gray < np.median(chip_gray[m > 0]) - 25).astype(np.uint8) * 255
    tmask = cv2.dilate(cv2.bitwise_and(dark, m), np.ones((3, 3), np.uint8))
    chip_blank = inpaint(chip, tmask, 3)
    # chip alpha: the cream body + pointer, transparent elsewhere (it moves over lacquer)
    cg = cv2.cvtColor(chip_blank, cv2.COLOR_BGR2GRAY)
    ca = cv2.GaussianBlur(((cg > 90).astype(np.uint8) * 255), (3, 3), 0)
    for s in (1, 2):
        sizes[f'chip@{s}'] = save(np.dstack([chip_blank, ca]), f'{out}/chip@{s}x.webp', s, quality=92)

    # ---- icons: square crops around each button centre from the ORIGINAL (painted icon), and from the erased plate
    def crop(img, r):
        x, y, w, h = r
        return img[y:y + h, x:x + w].copy()

    icons = {}
    for k in ('vol_icon', 'cc_icon', 'rate_icon', 'fs_icon', 'play_icon'):
        icons[k] = crop(src, cfg[k])
        for s in (1, 2):
            save(icons[k], f'{out}/{k.replace("_icon", "")}-icon@{s}x.webp', s, quality=92)
    # play-only and pause-only: blank disc + the painted glyph, centred
    px, py, pw, ph = cfg['play_icon']
    blank = crop(plate, cfg['play_icon'])
    for nm, gr in (('play', cfg['play_tri']), ('pause', cfg['play_bars'])):
        g = crop(src, gr)
        gx, gy, gw, gh = gr
        canvas = blank.copy()
        ox = (pw - gw) // 2 + (1 if nm == 'play' else 0)
        oy = gy - py
        # paste only glyph-ish pixels (bright), so the dark disc stays continuous
        lum = cv2.cvtColor(g, cv2.COLOR_BGR2GRAY).astype(float)
        al = np.clip((lum - 30) / 45, 0, 1)[..., None]
        reg = canvas[oy:oy + gh, ox:ox + gw].astype(float)
        canvas[oy:oy + gh, ox:ox + gw] = (g * al + reg * (1 - al)).astype(np.uint8)
        for s in (1, 2):
            save(canvas, f'{out}/{nm}-icon@{s}x.webp', s, quality=92)
    # blank discs for alternate (SVG) icons and the live 1× label
    for k in ('vol_icon', 'cc_icon', 'rate_icon', 'fs_icon', 'play_icon'):
        for s in (1, 2):
            save(crop(plate, cfg[k]), f'{out}/{k.replace("_icon", "")}-blank@{s}x.webp', s, quality=92)

    # ---- volume slider layers
    x, y, w, h = cfg['vtrack']
    a0, a1 = cfg['vgold_src']; b0, b1 = cfg['vsilver_src']
    vg = np.zeros((h, w, 3), np.uint8); vs = np.zeros_like(vg)
    for i in range(w):
        xx_ = x + i
        # keep the rounded caps: left cap from the gold end, right cap from the silver end
        ga = xx_ if xx_ < a1 else a0 + ((xx_ - a0) % (a1 - a0))
        sb = xx_ if xx_ >= b0 else b0 + ((xx_ - b0) % (b1 - b0))
        vg[:, i] = src[y:y + h, ga]
        vs[:, i] = src[y:y + h, sb]
    # the gold source has no right cap: mirror the left cap into it
    cap = 3
    vg[:, w - cap:] = vg[:, :cap][:, ::-1]
    vs[:, :cap] = vs[:, w - cap:][:, ::-1]
    for s in (1, 2):
        save(vg, f'{out}/vgold@{s}x.webp', s, quality=92)
        save(vs, f'{out}/vsilver@{s}x.webp', s, quality=92)
    x, y, w, h = cfg['vknob']
    kn = src[y:y + h, x:x + w].copy()
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx + 0.5 - w / 2) ** 2 + (yy + 0.5 - h / 2) ** 2)
    ka = np.clip((6.8 - d) * 255, 0, 255).astype(np.uint8)
    for s in (1, 2):
        save(np.dstack([kn, ka]), f'{out}/vknob@{s}x.webp', s, quality=92)

    # ---- strip for flow mode / fullscreen / phones: painted frame ends + a clean lacquer stretch (no rings)
    sx_, sy_, sw_, sh_ = cfg['strip']
    c0, c1 = cfg['strip_clean']
    left = plate[sy_:sy_ + sh_, sx_:sx_ + 20]
    right = plate[sy_:sy_ + sh_, sx_ + sw_ - 20:sx_ + sw_]
    mid = plate[sy_:sy_ + sh_, c0:c1]
    flow = np.concatenate([left] + [mid] * 4 + [right], 1)
    for s in (1, 2):
        sizes[f'strip@{s}'] = save(flow, f'{out}/strip@{s}x.webp', s, quality=88)

    # ---- ring sprites (blank discs, circular alpha) and seek-bar end caps, for flow mode
    def ring(cx, cy, r, name):
        R = int(r) + 3
        x0, y0 = int(round(cx - R)), int(round(cy - R))
        c = plate[y0:y0 + 2 * R, x0:x0 + 2 * R].copy()
        yy, xx = np.mgrid[0:2 * R, 0:2 * R]
        d = np.sqrt((xx + 0.5 - (cx - x0)) ** 2 + (yy + 0.5 - (cy - y0)) ** 2)
        a = np.clip((r + 2.5 - d) * 255, 0, 255).astype(np.uint8)
        for s in (1, 2):
            save(np.dstack([c, a]), f'{out}/{name}@{s}x.webp', s, quality=92)
        return dict(x=x0, y=y0, size=2 * R)
    meta_extra = {}
    meta_extra['ring_play'] = ring(*cfg['play'], 'ring-play')
    meta_extra['ring_btn'] = ring(*cfg['vol'], 'ring-btn')
    tx, ty, tw, th = cfg['track']
    capL = (tx - 10, ty - 2, 10, th + 4); capR = (tx + tw, ty - 2, 11, th + 4)
    for nm, r in (('capL', capL), ('capR', capR)):
        for s in (1, 2):
            save(crop(src, r), f'{out}/{nm}@{s}x.webp', s, quality=92)
    meta_extra['capL'] = capL; meta_extra['capR'] = capR

    # colours for the area outside the plate (edge samples)
    edge_l = src[:, :6].reshape(-1, 3).mean(0)[::-1]
    edge_r = src[:, -6:].reshape(-1, 3).mean(0)[::-1]
    edge_t = src[:6].reshape(-1, 3).mean(0)[::-1]
    edge_b = src[-6:].reshape(-1, 3).mean(0)[::-1]
    rows = [src[y, :8].reshape(-1, 3).mean(0)[::-1] for y in range(0, H, H // 8)]
    meta = dict(cfg, edges=dict(left=edge_l.round().tolist(), right=edge_r.round().tolist(), top=edge_t.round().tolist(),
                                bottom=edge_b.round().tolist(), left_rows=[r.round().tolist() for r in rows]), sizes=sizes, **meta_extra)
    meta.pop('src')
    with open(f'{out}/meta.json', 'w') as f:
        json.dump(meta, f, indent=1)
    return sizes


if __name__ == '__main__':
    for n, c in T.items():
        print(n, build(n, c))
