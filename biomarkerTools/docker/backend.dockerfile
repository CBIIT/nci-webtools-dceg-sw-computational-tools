FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf -y update \
    && dnf -y install \
    gcc-c++ \
    make \
    cmake \
    R-4.3.2 \
    R-devel \
    python3.11 \
    python3.11-devel \
    java-17-amazon-corretto-devel \
    libcurl-devel \
    openssl-devel \
    libxml2-devel \
    cairo-devel \
    harfbuzz-devel \
    fribidi-devel \
    freetype-devel \
    libpng-devel \
    libtiff-devel \
    libjpeg-devel \
    fontconfig-devel \
    tar \
    && dnf clean all

# Restrict Python 3.9 execution to root only
RUN chmod 700 /usr/bin/python3.9

# Set Java environment variables for R
ENV JAVA_HOME=/usr/lib/jvm/java-17-amazon-corretto

# Install Python packages
RUN python3.11 -m pip install --upgrade pip setuptools wheel \
    && python3.11 -m pip install flask rpy2 gunicorn

# Create application directory
RUN mkdir -p /deploy/app /deploy/logs

WORKDIR /deploy/app

# Copy Python backend files
COPY biomarkerTools.py biomarkerTools.wsgi biomarkerToolsSuite.R /deploy/app/
COPY bc /deploy/app/bc
COPY meanRiskStratification /deploy/app/meanRiskStratification
COPY meanstorisk /deploy/app/meanstorisk
COPY riskStratAdvanced /deploy/app/riskStratAdvanced
COPY sampleSize /deploy/app/sampleSize


# Copy static frontend files
COPY common /deploy/app/common
COPY help /deploy/app/help
COPY images /deploy/app/images
COPY index.html main.js requires.js styles.css glossary.js glossary-popover.js IEOnly.css favicon.ico /deploy/app/

# Create tmp directory
RUN mkdir -p /deploy/app/tmp

# Configure Java for R
RUN R CMD javareconf

# Install R packages required by the application
# Install from source with multiple mirror fallbacks
RUN R -e "options(repos=c(CRAN='http://cran.rstudio.com/')); \
    install.packages('RJSONIO', type='source', Ncpus=parallel::detectCores()); \
    install.packages('stringr', type='source', Ncpus=parallel::detectCores()); \
    install.packages('pROC', type='source', Ncpus=parallel::detectCores()); \
    install.packages('openxlsx', type='source', Ncpus=parallel::detectCores())"

# Verify packages are installed
RUN R -e "library(RJSONIO); library(stringr); library(pROC); library(openxlsx)"

# Expose port 8160 (default port for biomarkerTools)
EXPOSE 8160

# Run with Gunicorn - single worker to avoid rpy2 context issues
# --worker-class sync ensures no threading issues with R
CMD ["gunicorn", "--bind", "0.0.0.0:8160", "--workers", "1", "--worker-class", "sync", "--timeout", "300", "--log-level", "info", "biomarkerTools:app"]
