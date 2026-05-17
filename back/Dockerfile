FROM ubuntu:22.04

RUN apt-get update \
&& apt-get install -y --no-install-recommends \
    curl \
    dnsutils \
    netcat-openbsd \
    openssh-client \
    ifupdown \
    iproute2 \
    iptables \
    traceroute \
    iputils-ping \
    mininet \
    net-tools \
    kmod \
    bridge-utils \
    tcpdump \
    git \
    python3 \
    python3-pip \
    dnsmasq \
    isc-dhcp-client \
    gcc \
    make \
    libpcap-dev \
    libbsd-dev \
    openvswitch-switch \
 && rm -rf /var/lib/apt/lists/* \
 && touch /etc/network/interfaces \
 && mkdir /opt/mininet_dependencies

RUN git clone https://github.com/mimi-net/mimidump.git \
    && cd mimidump && git checkout 32e6e5e && make prefix=/usr install && cd .. && rm -rf mimidump

WORKDIR /app

# Use the host's fast loopback proxy (reachable when the build uses
# `network: host`). The Docker daemon's default proxy is via docker0
# which is ~10x slower in this environment.
ENV HTTP_PROXY=http://127.0.0.1:1081 \
    HTTPS_PROXY=http://127.0.0.1:1081 \
    http_proxy=http://127.0.0.1:1081 \
    https_proxy=http://127.0.0.1:1081 \
    NO_PROXY=localhost,127.0.0.1 \
    no_proxy=localhost,127.0.0.1

# Install dependencies from the uv-generated lockfile.
# pyproject.toml + uv.lock are the source of truth; requirements.lock is
# regenerated from them via `uv export --frozen --no-dev --format requirements.txt`.
COPY requirements.lock /app/requirements.lock
RUN pip3 install --break-system-packages --no-cache-dir --timeout 60 --retries 10 --prefer-binary \
    -r /app/requirements.lock

ENV HTTP_PROXY= \
    HTTPS_PROXY= \
    http_proxy= \
    https_proxy=

ADD ./ENTRYPOINT.sh /app/ENTRYPOINT.sh
RUN chmod +x ENTRYPOINT.sh
ADD ./src /app

ENTRYPOINT ["/app/ENTRYPOINT.sh"]
