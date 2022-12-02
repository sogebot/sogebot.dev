FROM nginx:alpine

ARG COMMIT=2c12db2a

RUN apk add --no-cache --upgrade bash
RUN apk upgrade

RUN mkdir -p /app/static/${COMMIT}
ADD sogeBot-dashboard-${COMMIT} /app/static
ADD sogeBot-dashboard-basePath-${COMMIT} /app/static/${COMMIT}

RUN ls -R /app/static

# extract commit files
# RUN cd /app/static/ && unzip *.zip && rm *.zip && cd /

ADD ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./generate-nginx-location.sh /generate-nginx-location.sh

# creating locations in .paths file because it dont get pick up by default nginx.conf
RUN chmod +x generate-nginx-location.sh
RUN sh /generate-nginx-location.sh > /etc/nginx/conf.d/locations.paths
RUN cat /etc/nginx/conf.d/locations.paths

# cleanup
RUN rm generate-nginx-location.sh


EXPOSE 80