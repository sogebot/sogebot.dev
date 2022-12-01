FROM nginx:alpine

ADD *.zip /
RUN unzip *.zip -d /app/static
RUN rm *.zip

COPY ./ui.admin-mui/nginx.conf /etc/nginx/nginx.conf