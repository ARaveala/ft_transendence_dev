# nginx + ModSecurity v3 + connector + CRS (all from Debian/bookworm repos)
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
      nginx-full \
      libnginx-mod-http-modsecurity \
      libmodsecurity3 \
      modsecurity-crs \
      ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

# Create a tidy home for your modsec config and log directory (optional structure)
RUN mkdir -p /etc/nginx/modsec/crs /etc/modsecurity /var/log/nginx

COPY ./conf/modsecurity.conf-recommended /etc/nginx/modsecurity.conf
# Base ModSecurity config (switch to "On") this won't be needed because I am copying the config file from the host and ill be changing it there
# RUN sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/i' /etc/nginx/modsec/modsecurity.conf
    # echo "SecDebugLogLevel 9" >> /etc/nginx/modsec/modsecurity.conf

# Wire OWASP CRS (installed under /usr/share/modsecurity-crs)
RUN ln -s /usr/share/modsecurity-crs /etc/nginx/modsec/crs || true && \
    cp /etc/modsecurity/crs/crs-setup.conf /etc/nginx/modsec/crs/crs-setup.conf


RUN touch /etc/nginx/modsec/main.conf   
# Create the aggregator that Nginx will load
RUN echo "Include /etc/nginx/modsecurity.conf" >> /etc/nginx/modsec/main.conf
RUN echo "Include /etc/modsecurity/crs/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf" >> /etc/nginx/modsec/main.conf
RUN echo "Include /etc/modsecurity/crs/RESPONSE-999-EXCLUSION-RULES-AFTER-CRS.conf" >> /etc/nginx/modsec/main.conf
RUN echo "Include /etc/modsecurity/crs/crs-setup.conf" >> /etc/nginx/modsec/main.conf
RUN echo "Include /usr/share/modsecurity-crs/rules/*.conf" >> /etc/nginx/modsec/main.conf

# Debian’s package already drops a loader in /etc/nginx/modules-enabled/
# so you usually do NOT need an explicit 'load_module' line.
# If you ever need it, the .so is at:
#   /usr/lib/nginx/modules/ngx_http_modsecurity_module.so

# Your nginx config (TLS + reverse proxy)
COPY ./conf/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
