FROM public.ecr.aws/amazonlinux/amazonlinux:2023

# --releasever=latest pulls security fixes published after the base image was cut
RUN dnf -y --releasever=latest update \
    && dnf -y --releasever=latest install \
    R-4.3.2 \
    R-devel-4.3.2 \
    python3.13 \
    python3.13-pip \
    python3.13-devel \
    shadow-utils \
    && dnf clean all

# Install Python packages, then remove pip (build-time only; flagged by image scans)
RUN python3.13 -m pip install --no-cache-dir flask 'rpy2==3.5.16' gunicorn \
    && dnf -y remove python3.13-pip \
    && dnf clean all

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

# Remove the system Python 3.9 and dnf, its only consumer (flagged by image scans).
# Must stay the last package step: nothing can be installed with dnf after this.
RUN rpm -e --nodeps $(rpm -qa --qf '%{NAME}\n' | grep -E '^(python3(-.*)?|dnf|dnf-data|yum)$')

CMD ["gunicorn", "--user", "app", "--group", "app", "--bind", "0.0.0.0:80", "--workers", "1", "--worker-class", "sync", "--timeout", "300", "--log-level", "info", "biomarkerTools:app"]
