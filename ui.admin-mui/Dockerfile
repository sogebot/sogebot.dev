FROM nginx:alpine

RUN apk add --no-cache --upgrade bash
RUN apk upgrade

RUN mkdir -p /app/static
ADD *.zip /app/static

ADD ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./generate-nginx-location.sh /generate-nginx-location.sh

# creating locations in .paths file because it dont get pick up by default nginx.conf
RUN chmod +x generate-nginx-location.sh
RUN sh /generate-nginx-location.sh > /etc/nginx/conf.d/locations.paths

# cleanup
RUN rm *.zip
RUN rm generate-nginx-location.sh


EXPOSE 8080