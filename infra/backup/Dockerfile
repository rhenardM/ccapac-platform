FROM alpine:3.20

RUN apk add --no-cache bash postgresql16-client mariadb-client mariadb-connector-c age rclone tar gzip tzdata

COPY --chmod=755 backup.sh restore.sh entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
