FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf -y update \
    && dnf -y install \
    R-4.3.2 \
    R-devel-4.3.2 \
    python3.11 \
    python3.11-devel \
    python3.11-pip \
    && dnf clean all

# Restrict Python 3.9 execution to root only
RUN chmod 700 /usr/bin/python3.9

# Install Python packages
RUN python3.11 -m pip install --upgrade pip setuptools wheel \
    && python3.11 -m pip install flask "rpy2==3.5.15" gunicorn

# Install R packages
RUN R -e 'options(repos = c(CRAN = sprintf("https://packagemanager.posit.co/cran/latest/bin/linux/rhel9-%s/%s", R.version["arch"], substr(getRversion(), 1, 3)))); \
    install.packages(c("RJSONIO", "stringr", "pROC", "openxlsx"))'

RUN mkdir -p /deploy/app /deploy/logs /deploy/app/tmp

WORKDIR /deploy/app

COPY . /deploy/app/

EXPOSE 8160

CMD ["gunicorn", "--bind", "0.0.0.0:8160", "--workers", "1", "--worker-class", "sync", "--timeout", "300", "--log-level", "info", "biomarkerTools:app"]
