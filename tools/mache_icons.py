#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Erzeugt die App-Icons (icon-192.png, icon-512.png) im Regal.
Wird von der automatischen Prüfung (.github/workflows/ci.yml) aufgerufen,
weil Bilddateien durch den GitHub-Anschluss nicht als Bytes übergeben werden können."""
import os, struct, zlib

def png_schreiben(pfad, groesse, malen):
    n = groesse
    zeilen = bytearray()
    for y in range(n):
        zeilen.append(0)
        for x in range(n):
            zeilen += bytes(malen(x, y, n))
    roh = zlib.compress(bytes(zeilen), 9)
    def chunk(titel, daten):
        c = titel + daten
        return struct.pack('>I', len(daten)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    kopf = struct.pack('>IIBBBBB', n, n, 8, 6, 0, 0, 0)
    with open(pfad, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', kopf))
        f.write(chunk(b'IDAT', roh))
        f.write(chunk(b'IEND', b''))

def icon_malen(x, y, n):
    s = n / 100.0
    r1, g1, b1 = 0x63, 0x66, 0xf1
    r2, g2, b2 = 0xa8, 0x55, 0xf7
    t = y / float(n)
    r, g, b = (r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
    radius = 22 * s
    gx = min(x, n - 1 - x)
    gy = min(y, n - 1 - y)
    if gx < radius and gy < radius:
        dx, dy = radius - gx, radius - gy
        if dx * dx + dy * dy > radius * radius:
            return (0, 0, 0, 0)
    cx, cy, rr = 50 * s, 50 * s, 26 * s
    d2 = (x - cx) ** 2 + (y - cy) ** 2
    if d2 <= rr ** 2 and d2 >= (rr - 9 * s) ** 2:
        return (255, 255, 255, 255)
    for balken_y in (40, 52):
        by = balken_y * s
        if abs(y - (by + 3 * s)) <= 3 * s and (22 * s) <= x <= (46 * s):
            if not (d2 <= rr ** 2 and d2 >= (rr - 9 * s) ** 2):
                return (255, 255, 255, 255)
    return (int(r), int(g), int(b), 255)

if __name__ == '__main__':
    png_schreiben('icon-192.png', 192, icon_malen)
    png_schreiben('icon-512.png', 512, icon_malen)
    print('Icons erzeugt:', os.path.getsize('icon-192.png'), 'B /', os.path.getsize('icon-512.png'), 'B')
