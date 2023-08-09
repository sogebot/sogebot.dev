FROM golang:1.21-alpine as builder
RUN apk add upx

WORKDIR /app

COPY ./go.mod ./
COPY ./go.sum ./

RUN go mod download

COPY . ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o ./credentials && upx -9 -k ./credentials

FROM alpine
COPY --from=builder  /app/credentials /bin/credentials
EXPOSE 3000

CMD [ "/bin/credentials" ]