import 'package:kru_android/features/filesystem/data/file_entry.dart';

/// Boundary for permitted storage access.
/// Listing and transfers stay behind this type so widgets never touch paths.
abstract class FileService {
  Future<List<FileEntry>> list(String path);
}

/// Placeholder until the LAN channel exists.
/// File bytes must travel on that channel, never through the signaling server.
class UnavailableFileService implements FileService {
  @override
  Future<List<FileEntry>> list(String path) {
    throw UnsupportedError(
      'Filesystem access starts after the phone and browser share a LAN channel.',
    );
  }
}
