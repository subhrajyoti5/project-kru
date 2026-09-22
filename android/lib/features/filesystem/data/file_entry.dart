class FileEntry {
  const FileEntry({
    required this.id,
    required this.name,
    required this.path,
    required this.type,
    required this.size,
    required this.modifiedAt,
    required this.isDirectory,
  });

  final String id;
  final String name;
  final String path;
  final String type;
  final int size;
  final DateTime modifiedAt;
  final bool isDirectory;
}
