FROM golang:1.21-alpine as builder
RUN apk add upx

WORKDIR /app

COPY ./go.mod ./
COPY ./go.sum ./

RUN go mod download

COPY . ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -trimpath -o ./plugins && upx -9 -k ./plugins

FROM gcr.io/distroless/base-debian11:nonroot
COPY --from=builder  /app/plugins /bin/plugins
USER 65534
EXPOSE 3000

CMD [ "/bin/plugins" ]