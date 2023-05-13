FROM golang:1.20-alpine as builder
RUN apk add upx

WORKDIR /app

COPY ./go.mod ./
COPY ./go.sum ./

RUN go mod download

COPY . ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o ./webhooks && upx -9 -k ./webhooks

FROM alpine
COPY --from=builder  /app/webhooks /bin/webhooks
EXPOSE 3000

CMD [ "/bin/webhooks" ]