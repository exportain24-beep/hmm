#!/usr/bin/env python3
"""Original, royalty-free music bed synthesised from a MusicGen-style prompt (mood, tempo, instruments).
Melody-free (pads, soft arps, bass, light drums), structured on bars with an arc:
intro (pad) -> build -> full -> breakdown -> full -> real ending chord on a bar line.
  python3 music_bed.py --duration 92.4 --mood hopeful --out music.wav [--bpm 96] [--seed 3] [--drop 41.2]
Moods: calm hopeful upbeat warm tense epic curious. --drop = time (s) of the big turn; the breakdown ends there."""
import argparse, wave
import numpy as np
from scipy.signal import fftconvolve, lfilter

SR = 48000
MOODS = {  # root midi, mode, progression (scale degrees), bpm, layers
    'calm':    (57, 'major', [1, 5, 6, 4], 78, 'pad arp bass'),
    'hopeful': (60, 'major', [1, 5, 6, 4], 96, 'pad arp bass kick hat'),
    'upbeat':  (62, 'major', [1, 6, 4, 5], 112, 'pad arp bass kick hat clap'),
    'warm':    (55, 'major', [1, 4, 6, 5], 88, 'pad arp bass kick'),
    'curious': (57, 'minor', [1, 6, 3, 7], 92, 'pad arp bass hat'),
    'tense':   (52, 'minor', [1, 6, 7, 5], 84, 'pad bass kick hat'),
    'epic':    (50, 'minor', [1, 6, 3, 7], 90, 'pad arp bass kick hat clap'),
}
SCALE = {'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10]}
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)


def chord(root, mode, deg):
    s = SCALE[mode]; i = deg - 1
    return [root + s[(i + k) % 7] + 12 * ((i + k) // 7) for k in (0, 2, 4)]


def env(n, a, r):
    e = np.ones(n); a, r = int(a * SR), int(r * SR)
    if a: e[:min(a, n)] = np.linspace(0, 1, min(a, n))
    if r: e[-min(r, n):] *= np.linspace(1, 0, min(r, n))
    return e


def lp(x, fc):  # one-pole low-pass
    a = np.exp(-2 * np.pi * fc / SR); return lfilter([1 - a], [1, -a], x)


def saw(f, n, ph=0):
    t = np.arange(n) / SR; return 2 * ((f * t + ph) % 1) - 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--duration', type=float, required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--mood', default='hopeful', choices=MOODS); ap.add_argument('--bpm', type=float)
    ap.add_argument('--seed', type=int, default=1); ap.add_argument('--drop', type=float, default=0)
    a = ap.parse_args(); rng = np.random.default_rng(a.seed)
    root, mode, prog, bpm, layers = MOODS[a.mood]; bpm = a.bpm or bpm; layers = layers.split()
    beat = 60 / bpm; bar = 4 * beat; N = int(a.duration * SR)
    nbars = max(4, int(a.duration // bar)); end_t = nbars * bar  # music ends on a bar line, ring-out fills the rest
    drop_bar = int(a.drop // bar) if a.drop else int(nbars * 0.62)
    L = np.zeros(N + SR * 4); R = np.zeros_like(L)

    def add(sig, t, pan=0.0, g=1.0):
        i = int(t * SR); j = min(len(L), i + len(sig)); s = sig[:j - i] * g
        L[i:j] += s * (1 - max(pan, 0)); R[i:j] += s * (1 + min(pan, 0))

    for b in range(nbars + 1):
        t0 = b * bar; last = b == nbars
        c = chord(root, mode, prog[b % len(prog)]) if not last else chord(root, mode, 1)
        intro, brk = b < 2, drop_bar - 2 <= b < drop_bar
        energy = 0.55 if intro else 0.7 if brk else 1.0
        n = int((bar + 0.9) * SR) if not last else int(3.5 * SR)  # pads overlap: legato, no dip on bar lines
        for k, m in enumerate(c + [c[0] - 12]):  # pad: detuned saws, soft filter, slow attack
            for det, pan in ((-0.07, -0.6), (0.07, 0.6)):
                s = lp(saw(hz(m) * 2 ** (det / 12), n, rng.random()), 900 if not last else 600)
                add(s * env(n, 0.9, 1.0 if not last else 3.0), t0, pan, 0.05 * energy)
        if last: break
        if 'bass' in layers and not intro:
            for q in range(4):
                nn = int(beat * SR * 0.9); f = hz(c[0] - 24); tt = np.arange(nn) / SR
                s = np.tanh(1.6 * np.sin(2 * np.pi * f * tt)) * np.exp(-tt * 2.2)
                add(s * env(nn, 0.01, 0.08), t0 + q * beat, 0, 0.11 * (0.6 if brk else 1))
        if 'arp' in layers and not brk:
            pat = [0, 1, 2, 1, 3, 2, 1, 2]
            for q in range(8):
                m = (c + [c[0] + 12])[pat[q] % 4] + 12; nn = int(beat * SR * 0.6); tt = np.arange(nn) / SR
                s = (np.sin(2 * np.pi * hz(m) * tt) + 0.3 * np.sin(4 * np.pi * hz(m) * tt)) * np.exp(-tt * 7)
                add(s, t0 + q * beat / 2, 0.35 if q % 2 else -0.35, 0.05 * energy)
        if not intro and not brk:
            for q in range(4):
                tb = t0 + q * beat
                if 'kick' in layers:
                    nn = int(0.35 * SR); tt = np.arange(nn) / SR
                    add(np.sin(2 * np.pi * (48 * tt + 60 * (1 - np.exp(-tt * 30)) / 30)) * np.exp(-tt * 9), tb, 0, 0.11)
                if 'hat' in layers:
                    for off in (0.5,):
                        nn = int(0.05 * SR); s = np.diff(rng.standard_normal(nn + 1)) * np.exp(-np.arange(nn) / SR * 90)
                        add(s, tb + off * beat, 0.25, 0.02)
                if 'clap' in layers and q in (1, 3):
                    nn = int(0.18 * SR); s = lp(rng.standard_normal(nn), 3000) * np.exp(-np.arange(nn) / SR * 22)
                    add(s, tb, -0.1, 0.04)
        if b == drop_bar - 1:  # riser into the drop
            nn = int(bar * SR); tt = np.arange(nn) / SR
            s = lp(rng.standard_normal(nn), 2500) * (tt / bar) ** 2.5
            add(s, t0, 0, 0.05)

    ir_n = int(1.8 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 3.2); ir /= np.abs(ir).sum() / 6
    L = L + 0.25 * fftconvolve(L, ir)[:len(L)]; R = R + 0.25 * fftconvolve(R, ir[::-1])[:len(R)]
    out = np.stack([L[:N], R[:N]], 1); out *= env(N, 0.8, 1.5)[:, None]
    out /= max(1e-9, np.abs(out).max()) / 0.89
    with wave.open(a.out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
    print(f'{a.mood} {bpm:.0f} bpm, {nbars} bars (ends {end_t:.1f}s, drop bar {drop_bar} @ {drop_bar * bar:.1f}s) -> {a.out}')


if __name__ == '__main__':
    main()
