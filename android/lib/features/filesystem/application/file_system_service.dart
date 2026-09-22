import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:kru_android/features/filesystem/application/path_guard.dart';

class _DigestSink implements Sink<Digest> {
  Digest? _value;
  Digest get value => _value!;
  @override
  void add(Digest data) => _value = data;
  @override
  void close() {}
}

class FsException implements Exception {
  FsException(this.code, this.message);
  final String code;
  final String message;
}

class ListedEntry {
  ListedEntry({
    required this.name,
    required this.virtualPath,
    required this.isDirectory,
    required this.size,
    required this.modifiedAt,
    required this.mimeType,
  });

  final String name;
  final String virtualPath;
  final bool isDirectory;
  final int size;
  final int modifiedAt;
  final String mimeType;

  Map<String, Object> toJson() => {
        'name': name,
        'path': virtualPath,
        'type': isDirectory ? 'directory' : 'file',
        'size': size,
        'modifiedAt': modifiedAt,
        'mimeType': mimeType,
      };
}

class FileSystemService {
  Future<List<ListedEntry>> listDirectory(String virtualPath) async {
    if (PathGuard.isRoot(virtualPath)) {
      return PathGuard.roots.keys
          .map(
            (name) => ListedEntry(
              name: name,
              virtualPath: '/$name',
              isDirectory: true,
              size: 0,
              modifiedAt: 0,
              mimeType: 'inode/directory',
            ),
          )
          .toList();
    }
    final real = _require(virtualPath);
    final directory = Directory(real);
    if (!await directory.exists()) {
      throw FsException('NOT_FOUND', 'Folder not found.');
    }
    final entries = <ListedEntry>[];
    await for (final entity in directory.list(followLinks: false)) {
      final stat = await entity.stat();
      final name = entity.path.split('/').last;
      final isDir = entity is Directory;
      entries.add(
        ListedEntry(
          name: name,
          virtualPath: _join(virtualPath, name),
          isDirectory: isDir,
          size: isDir ? 0 : stat.size,
          modifiedAt: stat.modified.millisecondsSinceEpoch,
          mimeType: isDir ? 'inode/directory' : _mime(name),
        ),
      );
    }
    entries.sort((a, b) {
      if (a.isDirectory != b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.toLowerCase().compareTo(b.name.toLowerCase());
    });
    return entries;
  }

  Future<ListedEntry> stat(String virtualPath) async {
    final real = _require(virtualPath);
    final type = await FileSystemEntity.type(real);
    if (type == FileSystemEntityType.notFound) {
      throw FsException('NOT_FOUND', 'Not found.');
    }
    final stat = await FileStat.stat(real);
    final name = virtualPath.split('/').where((part) => part.isNotEmpty).last;
    final isDir = type == FileSystemEntityType.directory;
    return ListedEntry(
      name: name,
      virtualPath: virtualPath,
      isDirectory: isDir,
      size: isDir ? 0 : stat.size,
      modifiedAt: stat.modified.millisecondsSinceEpoch,
      mimeType: isDir ? 'inode/directory' : _mime(name),
    );
  }

  Future<void> createDirectory(String parent, String name) async {
    if (!PathGuard.validName(name)) throw FsException('INVALID_NAME', 'Invalid folder name.');
    final real = _require(_join(parent, name));
    await Directory(real).create(recursive: false);
  }

  Future<void> rename(String virtualPath, String name) async {
    if (!PathGuard.validName(name)) throw FsException('INVALID_NAME', 'Invalid name.');
    final real = _require(virtualPath);
    final parent = real.substring(0, real.lastIndexOf('/'));
    final type = await FileSystemEntity.type(real);
    if (type == FileSystemEntityType.notFound) throw FsException('NOT_FOUND', 'Not found.');
    await (type == FileSystemEntityType.directory ? Directory(real) : File(real)).rename('$parent/$name');
  }

  Future<void> delete(String virtualPath) async {
    final real = _require(virtualPath);
    final type = await FileSystemEntity.type(real);
    if (type == FileSystemEntityType.directory) {
      await Directory(real).delete(recursive: true);
    } else if (type == FileSystemEntityType.file) {
      await File(real).delete();
    } else {
      throw FsException('NOT_FOUND', 'Not found.');
    }
  }

  File fileForRead(String virtualPath) {
    final real = _require(virtualPath);
    return File(real);
  }

  File fileForWrite(String virtualPath) {
    final real = _require(virtualPath);
    final file = File(real);
    if (file.existsSync()) file.deleteSync();
    file.createSync(recursive: true);
    return file;
  }

  String sha256Of(String virtualPath) {
    final real = _require(virtualPath);
    final sink = _DigestSink();
    final input = sha256.startChunkedConversion(sink);
    final file = File(real).openSync();
    try {
      while (true) {
        final chunk = file.readSync(64 * 1024);
        if (chunk.isEmpty) break;
        input.add(chunk);
      }
    } finally {
      file.closeSync();
    }
    input.close();
    return sink.value.toString();
  }

  String _require(String virtualPath) {
    final resolved = PathGuard.resolve(virtualPath);
    if (resolved == null) throw FsException('INVALID_PATH', 'Path is not allowed.');
    return resolved;
  }

  String _join(String parent, String name) {
    if (PathGuard.isRoot(parent)) return '/$name';
    return '${parent.endsWith('/') ? parent.substring(0, parent.length - 1) : parent}/$name';
  }

  String _mime(String name) {
    final lower = name.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    return 'application/octet-stream';
  }
}
