FROM hashicorp/vault:1.20

# agent config + template + dev token
RUN mkdir -p /vault/config/ /vault/templates/
COPY ./config/ /vault/config/
COPY ./templates/ /vault/templates/

# simple entrypoint to start both vault server (dev) and agent
COPY ./tools/entry.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entry.sh

ENTRYPOINT ["/usr/local/bin/entry.sh"]
