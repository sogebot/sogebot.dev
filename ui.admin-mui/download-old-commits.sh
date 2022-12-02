#/bin/bash
docker run -v /64062cc7:/mnt --entrypoint /bin/bash sogebot/dashboard:64062cc7 -c "cp -r /app/static/64062cc7/* /mnt"
zip -r 64062cc7.zip /64062cc7
echo "Build 64062cc7 downloaded and zipped."