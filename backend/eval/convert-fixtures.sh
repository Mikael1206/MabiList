#!/usr/bin/env bash
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
if command -v magick >/dev/null 2>&1; then
  converter=(magick)
elif command -v convert >/dev/null 2>&1; then
  converter=(convert)
else
  echo 'ImageMagick is required but neither magick nor convert is on PATH.' >&2
  exit 127
fi
for source in "$here"/generated/*.svg; do
  "${converter[@]}" "$source" "${source%.svg}.png"
done
printf 'Rendered %s synthetic chat screenshots\n' "$(find "$here/generated" -maxdepth 1 -name '*.png' | wc -l)"
