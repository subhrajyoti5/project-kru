# File transfer protocol

Every JSON message includes `type` and `requestId`.

## Connection

- `hello` from the phone when the data channel opens. Fields: `protocolVersion`, `device.platform`.
- `hello_ack` from the browser.
- `transfer_cancel` with `transferId`.
- `operation_response` with `success` and, on failure, `error.code` plus `error.message`.

Error codes: `INVALID_PATH`, `INVALID_NAME`, `NOT_FOUND`, `PERMISSION_DENIED`, `BAD_MESSAGE`, `CANCELLED`, `FAILED`.

## Filesystem

- `list_directory` with `path`. Response `directory_response` lists `entries` with `name`, `path`, `type`, `size`, `modifiedAt`, `mimeType`. No file contents.
- `stat` / `stat_response`.
- `create_directory` with `path` and `name`.
- `rename` with `path` and `name`.
- `delete` with `path`.

`/` lists the allowed roots. Any path containing `..`, a null byte, or a root outside Download, DCIM, Pictures, Documents, Music, and Movies is `INVALID_PATH`.

## Transfer

- `download_request` with `path`.
- `download_start` with `transferId`, `name`, `size`, `mimeType`.
- Binary frames carry the bytes. Header is `KRU1`, kind `1` for download and `2` for upload, the transfer id, and the byte offset.
- `download_complete` with `actualSize` and `sha256`.
- `upload_request` with `path`, `name`, `size`.
- `upload_start` with `transferId`.
- `upload_complete` with `sha256`. The phone deletes the partial file if the size or hash does not match.

The browser shows Connected only after `hello`. A dropped data channel marks active transfers failed.
