FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    iverilog verilator gcc g++ make bash \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 hdl \
    && useradd --uid 10001 --gid 10001 --no-create-home hdl

WORKDIR /workspace
ENV HOME=/tmp
USER 10001:10001
