import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:kru_android/features/filesystem/application/file_system_service.dart';

const int chunkSize = 64 * 1024;
const int maxBuffered = 1024 * 1024;

class DataProtocol {
  DataProtocol({
    required this.sendText,
    required this.sendBinary,
    FileSystemService? files,
  }) : _files = files ?? FileSystemService();

  final Future<void> Function(String text) sendText;
  final Future<void> Function(Uint8List bytes) sendBinary;
  final FileSystemService _files;
  final Map<String, _Incoming> _incoming = {};
  final Map<String, RandomAccessFile> _reads = {};
  var _stopped = false;

  void stop() {
    _stopped = true;
    for (final file in _reads.values) {
      file.closeSync();
    }
    for (final incoming in _incoming.values) {
      incoming.file.closeSync();
      incoming.partial.deleteSync();
    }
    _reads.clear();
    _incoming.clear();
  }

  Future<void> onText(String text) async {
    if (text.length > 64 * 1024) return;
    final decoded = jsonDecode(text);
    if (decoded is! Map) return;
    final type = decoded['type'];
    final requestId = decoded['requestId'];
    try {
      switch (type) {
        case 'list_directory':
          final entries = await _files.listDirectory('${decoded['path'] ?? '/'}');
          await _send({
            'type': 'directory_response',
            'requestId': requestId,
            'path': decoded['path'] ?? '/',
            'entries': entries.map((entry) => entry.toJson()).toList(),
          });
        case 'stat':
          final entry = await _files.stat('${decoded['path']}');
          await _send({'type': 'stat_response', 'requestId': requestId, 'entry': entry.toJson()});
        case 'create_directory':
          await _files.createDirectory('${decoded['path'] ?? '/'}', '${decoded['name']}');
          await _ok(requestId);
        case 'rename':
          await _files.rename('${decoded['path']}', '${decoded['name']}');
          await _ok(requestId);
        case 'delete':
          await _files.delete('${decoded['path']}');
          await _ok(requestId);
        case 'download_request':
          await _download('${decoded['path']}', '$requestId');
        case 'upload_request':
          await _beginUpload(decoded);
        case 'upload_complete':
          await _finishUpload(decoded);
        case 'transfer_cancel':
          _cancel('${decoded['transferId']}');
          await _send({'type': 'transfer_error', 'requestId': requestId, 'transferId': decoded['transferId'], 'error': {'code': 'CANCELLED', 'message': 'Cancelled.'}});
        default:
          break;
      }
    } on FsException catch (error) {
      await _fail(requestId, error.code, error.message);
    } catch (error) {
      await _fail(requestId, 'FAILED', '$error');
    }
  }

  Future<void> onBinary(Uint8List bytes) async {
    if (bytes.length < 14 || bytes[0] != 0x4b || bytes[1] != 0x52 || bytes[2] != 0x55 || bytes[3] != 0x31) {
      return;
    }
    final view = ByteData.sublistView(bytes);
    final idLength = bytes[5];
    if (bytes.length < 14 + idLength) return;
    final transferId = utf8.decode(bytes.sublist(6, 6 + idLength));
    final offset = view.getUint32(6 + idLength, Endian.big);
    final payload = bytes.sublist(10 + idLength);
    final incoming = _incoming[transferId];
    if (incoming == null || payload.length > chunkSize) return;
    incoming.file.setPositionSync(offset);
    incoming.file.writeFromSync(payload);
    incoming.written += payload.length;
  }

  Future<void> _download(String path, String requestId) async {
    final info = await _files.stat(path);
    if (info.isDirectory) {
      await _fail(requestId, 'INVALID_PATH', 'Cannot download a folder.');
      return;
    }
    final transferId = _id();
    final file = _files.fileForRead(path).openSync();
    _reads[transferId] = file;
    await _send({
      'type': 'download_start',
      'requestId': requestId,
      'transferId': transferId,
      'name': info.name,
      'size': info.size,
      'mimeType': info.mimeType,
    });
    var offset = 0;
    var sequence = 0;
    while (!_stopped && offset < info.size) {
      await _waitForBuffer();
      final size = info.size - offset > chunkSize ? chunkSize : info.size - offset;
      final data = file.readSync(size);
      if (data.isEmpty) break;
      await sendBinary(_frame(transferId, offset, data));
      offset += data.length;
      sequence += 1;
    }
    file.closeSync();
    _reads.remove(transferId);
    final hash = _files.sha256Of(path);
    await _send({
      'type': 'download_complete',
      'requestId': requestId,
      'transferId': transferId,
      'actualSize': offset,
      'sha256': hash,
      'sequences': sequence,
    });
  }

  Future<void> _beginUpload(Map decoded) async {
    final requestId = decoded['requestId'];
    final name = '${decoded['name']}';
    final parent = '${decoded['path'] ?? '/'}';
    final size = decoded['size'];
    if (size is! int || size < 0) {
      await _fail(requestId, 'BAD_MESSAGE', 'Size is required.');
      return;
    }
    final virtual = parent == '/' ? '/$name' : '$parent/$name';
    final partial = _files.fileForWrite(virtual);
    final transferId = _id();
    _incoming[transferId] = _Incoming(partial.openSync(mode: FileMode.writeOnly), partial, size);
    await _send({
      'type': 'upload_start',
      'requestId': requestId,
      'transferId': transferId,
      'path': virtual,
      'size': size,
    });
  }

  Future<void> _finishUpload(Map decoded) async {
    final transferId = '${decoded['transferId']}';
    final incoming = _incoming.remove(transferId);
    if (incoming == null) return;
    incoming.file.closeSync();
    final requestId = decoded['requestId'];
    if (incoming.written != incoming.expected) {
      incoming.partial.deleteSync();
      await _fail(requestId, 'FAILED', 'Size mismatch.');
      return;
    }
    final actual = sha256OfFile(incoming.partial.path);
    final expectedHash = decoded['sha256'];
    if (expectedHash is String && expectedHash.isNotEmpty && expectedHash != actual) {
      incoming.partial.deleteSync();
      await _fail(requestId, 'FAILED', 'Checksum mismatch.');
      return;
    }
    await _send({
      'type': 'upload_complete',
      'requestId': requestId,
      'transferId': transferId,
      'actualSize': incoming.written,
      'sha256': actual,
    });
  }

  void _cancel(String transferId) {
    final read = _reads.remove(transferId);
    read?.closeSync();
    final incoming = _incoming.remove(transferId);
    if (incoming != null) {
      incoming.file.closeSync();
      if (incoming.partial.existsSync()) incoming.partial.deleteSync();
    }
  }

  Future<void> _waitForBuffer() async {}

  Uint8List _frame(String transferId, int offset, List<int> payload) {
    final idBytes = utf8.encode(transferId);
    final frame = Uint8List(10 + idBytes.length + payload.length);
    final view = ByteData.sublistView(frame);
    frame[0] = 0x4b;
    frame[1] = 0x52;
    frame[2] = 0x55;
    frame[3] = 0x31;
    frame[4] = 1;
    frame[5] = idBytes.length;
    frame.setRange(6, 6 + idBytes.length, idBytes);
    view.setUint32(6 + idBytes.length, offset, Endian.big);
    frame.setRange(10 + idBytes.length, frame.length, payload);
    return frame;
  }

  Future<void> _ok(Object? requestId) {
    return _send({'type': 'operation_response', 'requestId': requestId, 'success': true});
  }

  Future<void> _fail(Object? requestId, String code, String message) {
    return _send({
      'type': 'operation_response',
      'requestId': requestId,
      'success': false,
      'error': {'code': code, 'message': message},
    });
  }

  Future<void> _send(Map<String, Object?> message) {
    return sendText(jsonEncode(message));
  }

  String _id() {
    final random = Random.secure();
    return List.generate(16, (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
  }
}

class _Incoming {
  _Incoming(this.file, this.partial, this.expected);
  final RandomAccessFile file;
  final File partial;
  final int expected;
  int written = 0;
}

String sha256OfFile(String path) {
  final sink = _DigestSink();
  final input = sha256.startChunkedConversion(sink);
  final file = File(path).openSync();
  try {
    while (true) {
      final chunk = file.readSync(chunkSize);
      if (chunk.isEmpty) break;
      input.add(chunk);
    }
  } finally {
    file.closeSync();
  }
  input.close();
  return sink.value.toString();
}

class _DigestSink implements Sink<Digest> {
  Digest? _value;
  Digest get value => _value!;
  @override
  void add(Digest data) => _value = data;
  @override
  void close() {}
}
