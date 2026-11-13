#!/usr/bin/env python3
"""Clickable thumbnail from the video's own strongest frame.
  python3 thumbnail.py --video final.mp4 --at 17.4 --text "HEAD-ON: WHICH WAY?" --badge "WHO GIVES WAY?" \
      --logo public/brand/logo.png --fonts public/fonts --accent "#2DD4BF" --out thumb.png [--wide thumb_16x9.jpg]
The background is a real frame of the animation (a topic graphic, not a stock picture); the headline is set
very large on colour blocks, the key word highlighted, the logo on a white card."""
import argparse, os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

HL = ['#FACC15', '#2DD4BF', '#FFFFFF']


def frame(video, t, out):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.2f}', '-i', video, '-frames:v', '1', out], check=True)
    return Image.open(out).convert('RGB')


def wrap(words, font, maxw, draw):
    lines, cur = [], []
    for w in words:
        test = ' '.join(cur + [w])
        if cur and draw.textlength(test, font=font) > maxw:
            lines.append(cur); cur = [w]
        else:
            cur.append(w)
    if cur: lines.append(cur)
    return lines


def rounded(im, r):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=r, fill=255)
    out = im.convert('RGBA'); out.putalpha(m); return out


def cover(im, W, H, fy=0.5):
    s = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * s + 0.5), int(im.height * s + 0.5)), Image.LANCZOS)
    top = int(max(0, im.height - H) * fy); left = (im.width - W) // 2
    return im.crop((left, top, left + W, top + H))


def compose(panel, W, H, text, badge, logo, fonts, accent, vertical):
    panel = ImageEnhance.Contrast(ImageEnhance.Color(panel).enhance(1.3)).enhance(1.1)
    u = W / 1080 if vertical else W / 1280
    if vertical:
        img = cover(panel, W, H).filter(ImageFilter.GaussianBlur(28))
        img = ImageEnhance.Brightness(img).enhance(0.45).convert('RGBA')
        pw = W - int(48 * u); ph = int(pw * panel.height / panel.width)
        sharp = rounded(panel.resize((pw, ph), Image.LANCZOS), int(40 * u))
        py = int(740 * u)
        glow = Image.new('RGBA', (pw + 80, ph + 80), (0, 0, 0, 0)); ImageDraw.Draw(glow).rounded_rectangle([40, 40, pw + 40, ph + 40], radius=int(40 * u), outline=accent, width=int(14 * u))
        img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(14)), (int(24 * u) - 40, py - 40))
        img.alpha_composite(sharp, (int(24 * u), py))
        ImageDraw.Draw(img).rounded_rectangle([int(24 * u), py, int(24 * u) + pw, py + ph], radius=int(40 * u), outline=accent, width=int(6 * u))
    else:
        img = cover(panel, W, H, 0.4).convert('RGBA')
        ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
        for x in range(W):
            d.line([(x, 0), (x, H)], fill=(4, 14, 30, int(235 * max(0, 1 - x / (W * 0.72)) ** 1.1)))
        img = Image.alpha_composite(img, ov)
    d = ImageDraw.Draw(img)
    head = os.path.join(fonts, 'Poppins-ExtraBold.ttf'); semi = os.path.join(fonts, 'Poppins-Bold.ttf')
    if badge:
        bf = ImageFont.truetype(semi, int((46 if vertical else 34) * u)); bw = d.textlength(badge, font=bf)
        x, y = int(56 * u), int((110 if vertical else 40) * u)
        d.rounded_rectangle([x, y, x + bw + 52 * u, y + bf.size * 1.75], radius=int(18 * u), fill=accent)
        d.text((x + 26 * u, y + bf.size * 0.28), badge, font=bf, fill='#061223')
    words = text.upper().split()
    size = int((158 if vertical else 104) * u)
    maxw = W - int(112 * u) if vertical else int(W * 0.66)
    while True:
        f = ImageFont.truetype(head, size)
        lines = wrap(words, f, maxw, d)
        if len(lines) <= (4 if vertical else 3) and all(d.textlength(' '.join(l), font=f) <= maxw for l in lines): break
        size -= 6
    lh = int(size * 1.16)
    block = lh * len(lines)
    y = int(230 * u) + max(0, (int(480 * u) - block) // 2) if vertical else int(150 * u)
    for i, l in enumerate(lines):
        line = ' '.join(l)
        x = int(56 * u)
        hl = i == len(lines) - 1 or any(ch.isdigit() for ch in line)
        tw = d.textlength(line, font=f); pad = int(18 * u)
        if hl:
            d.rounded_rectangle([x - pad / 2, y + size * 0.06, x + tw + pad, y + size * 1.12], radius=int(16 * u), fill=HL[0])
            d.text((x + pad / 4, y - size * 0.04), line, font=f, fill='#061223')
        else:
            d.text((x, y - size * 0.04 + 6 * u), line, font=f, fill=(2, 8, 20))
            d.text((x, y - size * 0.04), line, font=f, fill='#FFFFFF', stroke_width=int(3 * u), stroke_fill='#061223')
        y += lh
    if logo and os.path.exists(logo):
        lg = Image.open(logo).convert('RGBA')
        lh2 = int((200 if vertical else 104) * u)
        lg = lg.resize((int(lg.width * lh2 / lg.height), lh2), Image.LANCZOS)
        cx = (W - lg.width) // 2 if vertical else int(56 * u)
        cyy = H - lg.height - int((70 if vertical else 40) * u)
        # transparent logo, no card: a blurred dark halo behind it keeps the white wordmark readable
        halo = Image.new('RGBA', (lg.width + 120, lg.height + 120), (0, 0, 0, 0))
        halo.paste((4, 14, 30, 200), (60, 60), lg.split()[3])
        img.alpha_composite(halo.filter(ImageFilter.GaussianBlur(22)), (cx - 60, cyy - 60))
        img.alpha_composite(lg, (cx, cyy))
    return img.convert('RGB')


def upcase(text):
    import re
    return ' '.join(w if re.fullmatch(r'[A-Z]{2,}s[:,.!?]?', w) else w.upper() for w in text.split())


def best_split(words, font, maxw, draw, max_lines=3):
    """Fewest lines that fit, then the most balanced; never end a line on a bare number."""
    import itertools, re
    n = len(words); best = None
    for k in range(1, min(max_lines, n) + 1):
        for cuts in itertools.combinations(range(1, n), k - 1):
            idx = (0,) + cuts + (n,)
            lines = [words[idx[i]:idx[i + 1]] for i in range(k)]
            if any(re.fullmatch(r'[\d.,]+', l[-1]) for l in lines[:-1]): continue
            ws = [draw.textlength(' '.join(l), font=font) for l in lines]
            if max(ws) > maxw: continue
            score = max(ws) - min(ws)
            if best is None or score < best[0]: best = (score, lines)
        if best: return best[1]
    return None


def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def social_cover(panel, text, badge, logo, fonts, accent):
    """1080x1920 cover for Reels (Facebook + Instagram). Everything that matters sits inside the centre
    4:5 window (y 285-1635), which is what the feed and the profile grid show; the rest is brand texture."""
    W, H = 1080, 1920
    acc = hexrgb(accent)
    # 1. brand gradient: navy top-left to deep teal bottom-right
    g = Image.new('RGB', (W, H)); gd = ImageDraw.Draw(g)
    top, bot = (6, 22, 52), (4, 70, 86)
    for y in range(H):
        t = y / H
        gd.line([(0, y), (W, y)], fill=tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    img = g.convert('RGBA')
    # soft accent light behind the headline + a second one low right
    for (cx, cy, r, a) in ((W * 0.25, 560, 620, 48), (W * 0.9, 1500, 560, 40)):
        glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse([cx - r, cy - r, cx + r, cy + r], fill=acc + (a,))
        img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(160)))
    # nautical chart texture: faint grid + two contour waves
    tex = Image.new('RGBA', (W, H), (0, 0, 0, 0)); td = ImageDraw.Draw(tex)
    for x in range(0, W, 90): td.line([(x, 0), (x, H)], fill=(255, 255, 255, 14), width=1)
    for y in range(0, H, 90): td.line([(0, y), (W, y)], fill=(255, 255, 255, 14), width=1)
    import math
    for k, yy in enumerate((1700, 1790)):
        pts = [(x, yy + 26 * math.sin(x / 140 + k)) for x in range(0, W + 20, 20)]
        td.line(pts, fill=acc + (90 - 30 * k,), width=5)
    img.alpha_composite(tex)
    d = ImageDraw.Draw(img)
    head = os.path.join(fonts, 'Poppins-ExtraBold.ttf'); semi = os.path.join(fonts, 'Poppins-Bold.ttf')
    # 2. badge (centred, inside the safe zone)
    y0 = 300
    if badge:
        bf = ImageFont.truetype(semi, 40); bw = d.textlength(badge, font=bf)
        bx = (W - bw - 56) / 2
        d.rounded_rectangle([bx, y0, bx + bw + 56, y0 + 72], radius=36, fill=acc)
        d.text((bx + 28, y0 + 12), badge, font=bf, fill='#061223')
    # 3. headline: centred, white lines, last line on a yellow block
    words = upcase(text).split(); maxw = W - 120; lines = None
    for max_lines, floor in ((2, 104), (3, 60)):  # two big lines read best; three only if two would be too small
        size = 150
        while size >= floor:
            f = ImageFont.truetype(head, size)
            lines = best_split(words, f, maxw, d, max_lines)
            if lines: break
            size -= 6
        if lines: break
    lines = lines or wrap(words, f, maxw, d)
    lh = int(size * 1.14); y = y0 + 110
    for i, l in enumerate(lines):
        line = ' '.join(l); tw = d.textlength(line, font=f); x = (W - tw) / 2
        if i == len(lines) - 1:
            d.rounded_rectangle([x - 26, y + size * 0.08, x + tw + 26, y + size * 1.12], radius=18, fill=HL[0])
            d.text((x, y - size * 0.03), line, font=f, fill='#061223')
        else:
            d.text((x + 4, y + 6), line, font=f, fill=(0, 6, 18))
            d.text((x, y), line, font=f, fill='#FFFFFF')
        y += lh
    # 4. the video's own topic graphic as a framed card
    top_card = int(y + 34); bottom_card = 1440
    ch = bottom_card - top_card; cw = W - 120
    pv = ImageEnhance.Contrast(ImageEnhance.Color(panel).enhance(1.35)).enhance(1.12)
    card = rounded(cover(pv, cw, ch, 0.62), 34)
    sh = Image.new('RGBA', (cw + 120, ch + 120), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([60, 70, cw + 60, ch + 70], radius=34, fill=(0, 0, 0, 150))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(26)), (0, top_card - 60))
    img.alpha_composite(card, (60, top_card))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([60, top_card, 60 + cw, bottom_card], radius=34, outline=acc + (255,), width=6)
    # 5. logo (transparent, no card) at the bottom of the safe zone, handle below it
    if logo and os.path.exists(logo):
        lg = Image.open(logo).convert('RGBA'); lh2 = 130
        lg = lg.resize((int(lg.width * lh2 / lg.height), lh2), Image.LANCZOS)
        img.alpha_composite(lg, ((W - lg.width) // 2, 1478))
    hf = ImageFont.truetype(semi, 34); hand = '@HeyMariner'
    d.text(((W - d.textlength(hand, font=hf)) / 2, 1650), hand, font=hf, fill=(255, 255, 255, 200))
    return img.convert('RGB')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--video', required=True); ap.add_argument('--at', type=float, required=True)
    ap.add_argument('--text', required=True); ap.add_argument('--badge', default='')
    ap.add_argument('--logo'); ap.add_argument('--fonts', required=True); ap.add_argument('--accent', default='#2DD4BF')
    ap.add_argument('--out', required=True); ap.add_argument('--wide')
    ap.add_argument('--crop', help='x,y,w,h of the animation panel inside the video frame')
    a = ap.parse_args()
    tmp = tempfile.mkdtemp()
    bg = frame(a.video, a.at, os.path.join(tmp, 'f.png'))
    vertical = bg.height > bg.width
    if a.crop:
        x, y, w, h = (int(v) for v in a.crop.split(','))
        bg = bg.crop((x + 4, y + 4, x + w - 4, y + h - 4))
    if vertical:
        bg = bg.crop((0, int(bg.height * 0.14), bg.width, bg.height))  # skip the panel's top band, where scene text sits
        social_cover(bg, a.text, a.badge, a.logo, a.fonts, a.accent).save(a.out, optimize=True)
    else:
        compose(bg, 1280, 720, a.text, a.badge, a.logo, a.fonts, a.accent, False).save(a.out, optimize=True)
    if a.wide:  # 16:9 version for YouTube / LinkedIn previews
        compose(bg, 1280, 720, a.text, a.badge, a.logo, a.fonts, a.accent, False).save(a.wide, quality=92)
    print('thumbnail ->', a.out)


if __name__ == '__main__':
    main()
