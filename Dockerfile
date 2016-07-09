FROM alpine:3.4

VOLUME /data
VOLUME /var/lib/docker

RUN apk add --no-cache docker nodejs nginx

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

RUN cd registry && npm install

EXPOSE 4001
EXPOSE 4000

CMD (docker daemon &); \
    (cd registry && node Start &); \
    nginx -c /interface/nginx.conf
