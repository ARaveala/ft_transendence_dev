#!/bin/bash

set -e

echo "--> Starting Nginx"

nginx -c /etc/nginx/nginx.conf -g 'daemon off;'

