FROM alpine:3.19
RUN apk add --no-cache curl jq bash openssl
COPY setup.sh /setup.sh
RUN chmod +x /setup.sh
ENTRYPOINT ["/setup.sh"]