FROM nginx:alpine

ADD *.zip /
ADD ./nginx.conf /etc/nginx/conf.d/default.conf
ADD ./generate-nginx-location.sh /

RUN mkdir -p /app/static
RUN unzip *.zip -d /app/static

# creating locations in .paths file because it dont get pick up by default nginx.conf
RUN sh ./generate-nginx-location.sh > /etc/nginx/conf.d/locations.paths

# cleanup
RUN rm *.zip
RUN rm generate-nginx-location.sh


EXPOSE 8080