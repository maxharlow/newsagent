FROM node:5

VOLUME /data
VOLUME /var/lib/docker

RUN curl -sSL https://get.docker.com/ | sh

COPY registry/*.js         /registry/
COPY registry/package.json /registry/
COPY registry/config.json  /registry/

COPY runner/*.js           /runner/
COPY runner/package.json   /runner/
COPY runner/config.json    /runner/

RUN cd registry && npm install

EXPOSE 4001

CMD service docker start \
    && (cd registry && node Start)
