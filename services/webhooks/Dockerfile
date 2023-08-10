FROM golang:1.21-alpine as builder
RUN apk add upx

WORKDIR /app

COPY ./go.mod ./
COPY ./go.sum ./

RUN go mod download

COPY . ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -trimpath -o ./webhooks && upx -9 -k ./webhooks

FROM gcr.io/distroless/base-debian11:nonroot
COPY --from=builder  /app/webhooks /bin/webhooks
USER 65534
EXPOSE 8080
EXPOSE 8081

CMD [ "/bin/webhooks" ]