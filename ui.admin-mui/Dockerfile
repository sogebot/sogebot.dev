FROM nginx:alpine

ADD *.zip /
RUN mkdir -p /app/static
RUN unzip *.zip -d /app/static
RUN rm *.zip

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./generate-nginx-location.sh /

# creating locations in .paths file because it dont get pick up by default nginx.conf
RUN sh generate-nginx-location.sh > /etc/nginx/conf.d/locations.paths

EXPOSE 8080