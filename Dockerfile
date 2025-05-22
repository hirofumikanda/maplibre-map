FROM amazonlinux

RUN dnf -y update \
    && dnf -y groupinstall "Development Tools" \
    && curl -sL https://rpm.nodesource.com/setup_20.x | bash - \
    && dnf install -y nodejs

RUN node -v && npm -v