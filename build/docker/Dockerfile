FROM ubuntu:20.04

RUN apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        g++ \
        gcc \
        git \
        graphviz \
        openssh-client \
        python3-dev \
        python3-pip && \
    rm -rf /var/lib/apt/lists/*

RUN pip3 install pip --upgrade

RUN pip3 install --extra-index-url https://test.pypi.org/simple/ XPySom-dask git+https://github.com/discovery-unicamp/dasf-core.git jupyterlab

RUN pip install "numpy<1.24" bokeh==2.4.3 "protobuf<=3.20.1" "charset-normalizer<3.0" "tornado<6.2"

WORKDIR /dasf

LABEL dasf=latest


