FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o forum .

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/forum .
COPY --from=builder /app/frontend ./frontend

RUN mkdir -p uploads

EXPOSE 8081

CMD ["./forum"]