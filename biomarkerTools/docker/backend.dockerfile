FROM public.ecr.aws/amazonlinux/amazonlinux:2023

RUN dnf -y update \
    && dnf -y install \
    R-4.3.2 \
    R-devel-4.3.2 \
    python3.13 \
    python3.13-pip \
    python3.13-devel \
    shadow-utils \
    && dnf clean all

# Restrict Python 3.9 execution to root only
RUN chmod 700 /usr/bin/python3.9

# Install Python packages
RUN python3.13 -m pip install flask 'rpy2==3.5.16' gunicorn

# Install R packages
RUN R -e 'options(repos = c(CRAN = sprintf("https://packagemanager.posit.co/cran/latest/bin/linux/rhel9-%s/%s", R.version["arch"], substr(getRversion(), 1, 3)))); \
    install.packages(c("RJSONIO", "stringr", "pROC", "openxlsx"))'

RUN mkdir -p /deploy/app /deploy/logs /deploy/app/tmp

WORKDIR /deploy/app

COPY . /deploy/app/

EXPOSE 80

# Create a non-root user
RUN groupadd -g 1000 app && \
    useradd -m -u 1000 -g app app

CMD ["gunicorn", "--user", "app", "--group", "app", "--bind", "0.0.0.0:80", "--workers", "1", "--worker-class", "sync", "--timeout", "300", "--log-level", "info", "biomarkerTools:app"]
