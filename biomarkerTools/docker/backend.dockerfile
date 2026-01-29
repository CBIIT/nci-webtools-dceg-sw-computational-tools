FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf -y update \
    && dnf -y install \
    gcc-c++ \
    make \
    cmake \
    R-4.3.2 \
    R-devel \
    python3 \
    python3-devel \
    python3-pip \
    python3-setuptools \
    python3-wheel \
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

# Set Java environment variables for R
ENV JAVA_HOME=/usr/lib/jvm/java-17-amazon-corretto
ENV LD_LIBRARY_PATH=$JAVA_HOME/lib/server:$LD_LIBRARY_PATH

# Install Python packages
RUN pip3 install flask rpy2

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

# Create tmp directory
RUN mkdir -p /deploy/app/tmp

# Configure Java for R
RUN R CMD javareconf

# Install R packages required by the application
RUN R -e "install.packages(c('RJSONIO', 'stringr', 'pROC', 'rJava', 'xlsx'), repos='https://packagemanager.posit.co/cran/__linux__/rhel9/latest', Ncpus=parallel::detectCores())"

# Expose port 8160 (default port for biomarkerTools)
EXPOSE 8160

# Run the Flask application
CMD ["python3", "biomarkerTools.py", "-p", "8160"]
