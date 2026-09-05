#!/bin/sh
# Highlighting fixture; no project tooling depends on this shell.
title="Afterglow"
for hour in 16 18 20; do
  if [ "$hour" -ge 18 ]; then
    printf '%s: %s\n' "$title" "$hour"
  fi
done
