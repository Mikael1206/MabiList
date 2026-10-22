#!/usr/bin/env bash
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
for source in "$here"/generated/*.svg; do
  magick "$source" "${source%.svg}.png"
done
printf 'Rendered %s synthetic chat screenshots\n' "$(find "$here/generated" -maxdepth 1 -name '*.png' | wc -l)"
