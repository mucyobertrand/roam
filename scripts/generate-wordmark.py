"""Generate the roam wordmark (SVG master + @1x/@2x/@3x PNGs) into assets/images/brand.

"oam" are League Spartan Bold (scripts/fonts, SIL OFL), lightly emboldened, matched to
assets/prompt-imgs/design.png (ink aspect ~4.8). The "r" is a custom monoline glyph, as
requested from assets/image.png: a stem whose top-left corner flows into a round
shoulder and a horizontal arm of the same thickness, cut square at the end (League
Spartan's own r has a wedge-cut diagonal arm). It is built here from League Spartan's
stem width and x-height, so it matches the other letters' weight.

Both outputs come from the same outlines: glyph contours are flattened to polygons for
the PNGs, and written as paths for the SVG. The font is build-time only.

usage (needs Pillow + fonttools):
  python scripts/generate-wordmark.py [font.ttf] [out_dir] [tracking_em] [embolden_em]
"""
import math
import sys
from pathlib import Path

from fontTools.pens.basePen import BasePen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
FONT = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "scripts/fonts/LeagueSpartan_700Bold.ttf")
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "assets/images/brand"
TRACKING = float(sys.argv[3]) if len(sys.argv) > 3 else -0.005  # em, between letters
EMBOLDEN = float(sys.argv[4]) if len(sys.argv) > 4 else 0.012  # em, stroke added on each side
TEXT = "roam"
INK = "#0B0B1A"  # --color-ink
BASE_HEIGHT = 48  # @1x height in points (the glyphs' x-height box, no padding)

# Custom "r", in multiples of the font's stem width (measured from assets/image.png).
R_SHOULDER = 1.5  # outer radius of the shoulder
R_INNER = 0.55  # radius of the inside curve where the arm meets the stem
R_ARM = 0.85  # arm thickness (slightly lighter than the stem, like the source)
R_REACH = 2.0  # arm end, measured from the stem's left edge
ARC_STEPS = 24  # polygon segments per quarter circle

OUT.mkdir(parents=True, exist_ok=True)


class FlattenPen(BasePen):
    """Collects glyph contours as polygons (lists of (x, y)), flattening curves."""

    def __init__(self, glyphset, steps=16):
        super().__init__(glyphset)
        self.contours, self.current, self.steps = [], [], steps

    def _moveTo(self, p):
        self.current = [p]

    def _lineTo(self, p):
        self.current.append(p)

    def _curveToOne(self, p1, p2, p3):
        (x0, y0) = self._getCurrentPoint()
        for i in range(1, self.steps + 1):
            t = i / self.steps
            mt = 1 - t
            self.current.append(
                (
                    mt**3 * x0 + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0],
                    mt**3 * y0 + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1],
                )
            )

    def _qCurveToOne(self, p1, p2):
        (x0, y0) = self._getCurrentPoint()
        for i in range(1, self.steps + 1):
            t = i / self.steps
            mt = 1 - t
            self.current.append(
                (mt**2 * x0 + 2 * mt * t * p1[0] + t**2 * p2[0], mt**2 * y0 + 2 * mt * t * p1[1] + t**2 * p2[1])
            )

    def _closePath(self):
        if self.current:
            self.contours.append(self.current)
        self.current = []

    _endPath = _closePath


tt = TTFont(FONT)
upm = tt["head"].unitsPerEm
cmap = tt.getBestCmap()
glyphs = tt.getGlyphSet()
hmtx = tt["hmtx"]


def outline(ch):
    pen = FlattenPen(glyphs)
    glyphs[cmap[ord(ch)]].draw(pen)
    return pen.contours


def bounds(contours):
    xs = [x for c in contours for x, _ in c]
    ys = [y for c in contours for _, y in c]
    return min(xs), min(ys), max(xs), max(ys)


def signed_area(c):
    return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(c, c[1:] + c[:1])) / 2


def nonzero_mask(contours, to_px, width, height):
    """Fill like the font renderer (nonzero): union of outer-wound contours minus the
    opposite-wound ones (counters). Overlapping outer contours stay solid, unlike even-odd."""
    outer_sign = math.copysign(1, signed_area(max(contours, key=lambda c: abs(signed_area(c)))))
    solid, holes = Image.new("L", (width, height), 0), Image.new("L", (width, height), 0)
    for c in contours:
        target = solid if math.copysign(1, signed_area(c)) == outer_sign else holes
        ImageDraw.Draw(target).polygon([to_px(px, py) for px, py in c], fill=255)
    return ImageChops.subtract(solid, holes)


# ---- Custom "r" from League Spartan's own r: same left edge, stem width and height ----
orig_r = outline("r")
rx0, _, rx1, r_top = bounds(orig_r)
# Measure the stem on the filled glyph (contours overlap, so outline crossings mislead).
_m = nonzero_mask(orig_r, lambda px, py: (px - rx0 + 2, r_top - py + 2), math.ceil(rx1 - rx0) + 4, math.ceil(r_top) + 4)
_row = [bool(_m.getpixel((x, int(r_top * 0.7) + 2))) for x in range(_m.width)]  # 30% up from the baseline
_start = _row.index(True)
w = _row[_start:].index(False)  # first ink run = the stem
stem_left = rx0 + _start - 2
Ro, Ri, t = R_SHOULDER * w, R_INNER * w, R_ARM * w
ocx, ocy = stem_left + Ro, r_top - Ro  # outer shoulder centre
icx, icy = stem_left + w + Ri, r_top - t - Ri  # inside curve centre
arm_end = stem_left + R_REACH * w


def arc(cx, cy, r, a0, a1, steps=ARC_STEPS):
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / steps)),
             cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / steps))) for i in range(steps + 1)]


r_contour = (
    [(stem_left, 0)]
    + arc(ocx, ocy, Ro, 180, 90)  # outer shoulder, up and over to the top
    + [(arm_end, r_top), (arm_end, r_top - t)]  # arm, square end
    + arc(icx, icy, Ri, 90, 180)  # inside curve, back down to the stem
    + [(stem_left + w, 0)]
)
r_svg = (
    f"M{stem_left:.1f} 0V{ocy:.1f}A{Ro:.1f} {Ro:.1f} 0 0 1 {ocx:.1f} {r_top:.1f}H{arm_end:.1f}"
    f"V{r_top - t:.1f}H{icx:.1f}A{Ri:.1f} {Ri:.1f} 0 0 0 {stem_left + w:.1f} {icy:.1f}V0Z"
)
r_advance = arm_end + (hmtx[cmap[ord("r")]][0] - rx1)  # keep League Spartan's right side bearing

# ---- Lay out the word ----
letters = []  # (x offset, polygons, svg path data)
x = 0.0
for ch in TEXT:
    if ch == "r":
        letters.append((x, [r_contour], r_svg))
        x += r_advance + TRACKING * upm
        continue
    name = cmap[ord(ch)]
    svg_pen = SVGPathPen(glyphs)
    glyphs[name].draw(svg_pen)
    letters.append((x, outline(ch), svg_pen.getCommands()))
    x += hmtx[name][0] + TRACKING * upm

all_points = [(ox + px, py) for ox, polys, _ in letters for c in polys for px, py in c]
xmin, ymin, xmax, ymax = bounds([all_points])
stroke = EMBOLDEN * upm

# ---- Vector master ----
pad = stroke / 2
vx0, vx1, vy0, vy1 = xmin - pad, xmax + pad, ymin - pad, ymax + pad
vw, vh = vx1 - vx0, vy1 - vy0
paths = "\n    ".join(f'<path transform="translate({ox:.1f} 0)" d="{d}"/>' for ox, _, d in letters)
svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw:.1f} {vh:.1f}" '
    f'width="{BASE_HEIGHT * vw / vh:.1f}" height="{BASE_HEIGHT}" role="img" aria-label="roam">\n'
    f'  <g transform="translate({-vx0:.1f} {vy1:.1f}) scale(1 -1)" fill="{INK}" stroke="{INK}" '
    f'stroke-width="{stroke:.1f}" stroke-linejoin="round">\n    {paths}\n  </g>\n</svg>\n'
)
(OUT / "wordmark.svg").write_text(svg, encoding="utf8")

# ---- Raster: fill each letter nonzero (counters stay open), stroke outlines to embolden ----
SCALE = 1.5  # px per font unit for the master raster
W = math.ceil((vx1 - vx0) * SCALE) + 4
H = math.ceil((vy1 - vy0) * SCALE) + 4


def to_px(px, py):
    return ((px - vx0) * SCALE + 2, (vy1 - py) * SCALE + 2)


fill = Image.new("L", (W, H), 0)
for ox, polys, _ in letters:
    fill = ImageChops.lighter(fill, nonzero_mask(polys, lambda px, py, ox=ox: to_px(ox + px, py), W, H))
edges = ImageDraw.Draw(fill)
for ox, polys, _ in letters:
    for c in polys:
        pts = [to_px(ox + px, py) for px, py in c]
        edges.line(pts + pts[:1], fill=255, width=max(1, round(stroke * SCALE)), joint="curve")

ink = Image.new("RGBA", (W, H), INK)
ink.putalpha(fill)
master = ink.crop(fill.getbbox())
ratio = master.width / master.height
for factor, suffix in ((1, ""), (2, "@2x"), (3, "@3x")):
    hpx = BASE_HEIGHT * factor
    master.resize((round(hpx * ratio), hpx), Image.LANCZOS).save(OUT / f"wordmark{suffix}.png", optimize=True)

print(f"stem {w:.0f} units, shoulder radius {Ro:.0f}, arm reach {R_REACH * w:.0f}")
print(f"aspect ratio {ratio:.4f}  ({round(BASE_HEIGHT * ratio)}x{BASE_HEIGHT} @1x)")
