FROM alpine:3.7

VOLUME /data

RUN echo http://dl-cdn.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories
RUN apk add --no-cache docker nodejs nodejs-npm nginx \
    build-base python2 # needed to compile leveldown

COPY runner/*.js           /runner/
COPY runner/package.json   /runner/
COPY runner/config.json    /runner/

COPY registry/*.js         /registry/
COPY registry/package.json /registry/
COPY registry/config.json  /registry/

COPY interface/*.js        /interface/
COPY interface/*.css       /interface/
COPY interface/config.json /interface/
COPY interface/index.html  /interface/
COPY interface/nginx.conf  /interface/

RUN cd registry && npm install --build-from-source

EXPOSE 4001
EXPOSE 4000

CMD (cd registry && node Start &); \
    nginx -c /interface/nginx.conf
