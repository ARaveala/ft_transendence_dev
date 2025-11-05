#!/usr/bin/env bash
set -euo pipefail
MINICONDA="$HOME/miniconda3"
CONDA="$MINICONDA/bin/conda"

# ensure conda binary exists
if [ ! -x "$CONDA" ]; then
  echo "Conda not found at $CONDA"
  exit 1
fi

# 1) Accept Anaconda channels' Terms of Service (non-interactive)
#    (this addresses the 'CondaToSNonInteractiveError' you saw)
"$CONDA" tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main || true
"$CONDA" tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r || true

# 2) Install mamba (using conda) into the base env (non-interactive)
"$CONDA" install -y -c conda-forge mamba

# 3) Create the environment with required packages using mamba (fast)
#    If mamba fails for any reason we fall back to conda create.
if "$MINICONDA/bin/mamba" create -n browserenv -c conda-forge -y python=3.11 \
     gstreamer gst-plugins-base gst-plugins-good gst-plugins-bad \
     flite libavif chromium; then
  echo "Created env 'browserenv' with mamba"
else
  echo "mamba failed; falling back to conda create"
  "$CONDA" create -n browserenv -c conda-forge -y python=3.11 \
     gstreamer gst-plugins-base gst-plugins-good gst-plugins-bad \
     flite libavif chromium
fi

# 4) Use the chromium binary from the env without running `conda activate`
CHROMIUM="$MINICONDA/envs/browserenv/bin/chromium"
if [ -x "$CHROMIUM" ]; then
  echo "Launching chromium from $CHROMIUM (no-sandbox for headless CI)"
  "$CHROMIUM" --no-sandbox --version || true
else
  echo "Chromium binary not found at $CHROMIUM"
  echo "List env bin: $(ls -1 "$MINICONDA/envs/browserenv/bin" 2>/dev/null || true)"
  exit 1
fi

echo "Done."
# 1. Activate your conda env
source ~/miniconda3/bin/activate browserenv

# 2. Install all missing dependencies in that env
conda install -c conda-forge -y \
  gstreamer gst-plugins-base gst-plugins-good gst-plugins-bad \
  flite libavif

