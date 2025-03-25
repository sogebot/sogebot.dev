FROM nginx:alpine

ARG COMMIT=11e6d909

RUN apk add --no-cache --upgrade bash
RUN apk upgrade

RUN mkdir -p /app/static/${COMMIT}

ADD sogeBot-dashboard-${COMMIT} /app/static
ADD sogeBot-dashboard-basePath-${COMMIT} /app/static/${COMMIT}

RUN ls /app/static/*

# extract commit files
COPY *.zip /app/static/
RUN ls /app/static/*.zip

RUN cd /app/static/ && for z in *.zip; do echo "$z"; if [[ "$z" != *"${COMMIT}"* ]]; then unzip "$z"; fi; done;
RUN cd /app/static/ && rm *.zip
RUN cd /

ADD ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./generate-nginx-location.sh /generate-nginx-location.sh

# creating locations in .paths file because it dont get pick up by default nginx.conf
RUN chmod +x generate-nginx-location.sh
RUN sh /generate-nginx-location.sh > /etc/nginx/conf.d/locations.paths
RUN cat /etc/nginx/conf.d/locations.paths

RUN ls -d /app/static/*

# cleanup
RUN rm generate-nginx-location.sh


EXPOSE 80