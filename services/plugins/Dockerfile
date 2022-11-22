FROM golang:1.19-alpine as builder
RUN apk add upx

WORKDIR /app

COPY ./go.mod ./
COPY ./go.sum ./

RUN go mod download

COPY . ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o ./plugins && upx -9 -k ./plugins

FROM alpine
COPY --from=builder  /app/plugins /bin/plugins
EXPOSE 3000

CMD [ "/bin/plugins" ]