	# Stage 0: Build the frontend
	FROM node:20-bookworm-slim AS frontend-builder
	WORKDIR /frontend

	# Copy frontend package.json and install dependencies
	COPY ./frontend/package*.json ./
	RUN npm install

	# Copy the rest of frontend code and build
	COPY ./frontend ./
	RUN npm run build

	# Stage 1: WAF + Nginx + ModSecurity
	FROM debian:bookworm-slim

	ENV DEBIAN_FRONTEND=noninteractive

	# Install nginx + modsecurity + CRS + utilities
	RUN apt-get update && apt-get install -y --no-install-recommends \
		nginx-full \
		libnginx-mod-http-modsecurity \
		libmodsecurity3 \
		modsecurity-crs \
		ca-certificates curl && \
		rm -rf /var/lib/apt/lists/*

	# Create config and log directories
	RUN mkdir -p /etc/nginx/modsec/crs /etc/modsecurity /var/log/nginx

	# Copy modsecurity configs
	COPY modsec/conf/modsecurity.conf-recommended /etc/nginx/modsecurity.conf
	COPY modsec/crs-setup.conf /etc/modsecurity/crs/crs-setup.conf

	# Aggregate ModSecurity rules
	RUN touch /etc/nginx/modsec/main.conf && \
		echo "Include /etc/nginx/modsecurity.conf" >> /etc/nginx/modsec/main.conf && \
		echo "Include /etc/modsecurity/crs/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf" >> /etc/nginx/modsec/main.conf && \
		echo "Include /etc/modsecurity/crs/RESPONSE-999-EXCLUSION-RULES-AFTER-CRS.conf" >> /etc/nginx/modsec/main.conf && \
		echo "Include /etc/modsecurity/crs/crs-setup.conf" >> /etc/nginx/modsec/main.conf && \
		echo "Include /usr/share/modsecurity-crs/rules/*.conf" >> /etc/nginx/modsec/main.conf

	# Copy nginx config
	COPY modsec/conf/nginx.conf /etc/nginx/nginx.conf


	# Copy frontend build output from previous stage
	COPY --from=frontend-builder /frontend/dist /usr/share/nginx/html
	COPY --from=frontend-builder /frontend/pong_game /usr/share/nginx/html/pong_game

	# Expose ports
	EXPOSE 80 443

	# Run nginx in foreground
	CMD ["nginx", "-g", "daemon off;"]

