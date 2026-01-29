FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf -y update \
    && dnf -y install \
    nodejs \
    npm \
    && dnf clean all

# Create application directory
RUN mkdir -p /deploy/app

WORKDIR /deploy/app

# Copy frontend static files
COPY index.html main.js requires.js styles.css IEOnly.css favicon.ico /deploy/app/
COPY glossary-popover.js glossary.js /deploy/app/
COPY common /deploy/app/common
COPY help /deploy/app/help
COPY images /deploy/app/images
COPY bc /deploy/app/bc/
COPY meanRiskStratification /deploy/app/meanRiskStratification/
COPY meanstorisk /deploy/app/meanstorisk/
COPY riskStratAdvanced /deploy/app/riskStratAdvanced/
COPY sampleSize /deploy/app/sampleSize/

# Install http-server for serving static files
RUN npm install -g http-server

# Expose port 8080 for static file server
EXPOSE 8080

# Serve static files
CMD ["http-server", "/deploy/app", "-p", "8080", "--proxy", "http://backend:9160"]
