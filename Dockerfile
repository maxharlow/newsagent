FROM node:5

VOLUME /data
VOLUME /var/lib/docker

RUN curl -sSL https://get.docker.com/ | sh
RUN apt-get install -y nginx

COPY runner/*.js           /runner/
COPY runner/package.json   /runner/
COPY runner/config.json    /runner/

COPY registry/*.js         /registry/
COPY registry/package.json /registry/
COPY registry/config.json  /registry/

COPY interface/*.js        /interface/
COPY interface/index.html  /interface/
COPY interface/style.css   /interface/
COPY interface/nginx.conf  /interface/

RUN cd registry && npm install

EXPOSE 4001
EXPOSE 4000

CMD service docker start; \
    (cd registry && node Start &); \
    nginx -c /interface/nginx.conf
