#!/bin/bash

# enforce stricter error handling, making your scripts less prone to unexpected behavior and easier to debug
# -e errexit: exit immediately if any command fails
# -u nounset: treats unset variables as an error, you cant use a variable that hasnt been assigned a value
# -o pipefail: the script exits if any command in a pipeline fails
set -euo pipefail

echo "--> Preparing ModSecurity + connector ..."

MODSECURITY="${MODSECURITY:-https://github.com/owasp-modsecurity/ModSecurity}"
CONNECTOR="${CONNECTOR:-https://github.com/owasp-modsecurity/ModSecurity-nginx}"
CRS="${CRS:-https://github.com/coreruleset/coreruleset}"
SRC="${WAF_SRC:-/waf/src}"
BUILD="${WAF_BLD:-/waf/build}"
MODDIR="/etc/nginx/modules"
MODSEC_CONF_DIR="/etc/nginx/modsec"
LOG_DIR="/var/log/modsecurity"

# helpers for debugging
warn() { echo "[WARN] $*"; }
info() { echo "[INFO] $*"; }

mkdir -p "$MODSEC_CONF_DIR" "$MODDIR" "$SRC" "$BUILD" "$LOG_DIR"

# git clone repos if the directory doesn't exist; depth=1 > only the latest snapshot
[ -d "$SRC/ModSecurity/.git" ] || git clone --depth=1 "$MODSECURITY" "$SRC/ModSecurity/"
[ -d "$SRC/ModSecurity-Nginx/.git" ] || git clone --depth=1 "$CONNECTOR" "$SRC/ModSecurity-Nginx/"
[ -d "$MODSEC_CONF_DIR/crs/.git" ] || git clone --depth=1 "$CRS" "$MODSEC_CONF_DIR/crs"

# build libmodsecurity if it doesnt exist
if [ ! -f /usr/local/lib/libmodsecurity.so ] && [ ! -f /usr/local/modsecurity/lib/libmodsecurity.so ]; then
    info "Building libmodsecurity..."
    cd "$SRC/ModSecurity"
    git submodule update --init --recursive
    ./build.sh 
    ./configure --disable-doxygen-doc
    make -j"$(nproc)"
    make install
    # NOT DONE --> CONTINUE FROM HERE

echo "--> Starting Nginx"

nginx -c /etc/nginx/nginx.conf -g 'daemon off;'

