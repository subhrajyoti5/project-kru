class PathGuard {
  static const roots = <String, String>{
    'Download': '/storage/emulated/0/Download',
    'DCIM': '/storage/emulated/0/DCIM',
    'Pictures': '/storage/emulated/0/Pictures',
    'Documents': '/storage/emulated/0/Documents',
    'Music': '/storage/emulated/0/Music',
    'Movies': '/storage/emulated/0/Movies',
  };

  static bool isRoot(String virtualPath) {
    return virtualPath.isEmpty || virtualPath == '/';
  }

  /// Returns the on-device path for a virtual path such as `/Download/a.pdf`.
  /// Returns null when the path is outside the allowed roots.
  static String? resolve(String virtualPath) {
    if (virtualPath.contains('\u0000') || virtualPath.contains('\\') || virtualPath.contains('..')) {
      return null;
    }
    final parts = virtualPath.split('/').where((part) => part.isNotEmpty).toList();
    if (parts.isEmpty) return null;
    final root = roots[parts.first];
    if (root == null) return null;
    for (final part in parts.skip(1)) {
      if (!_validName(part)) return null;
    }
    if (parts.length == 1) return root;
    final resolved = '$root/${parts.skip(1).join('/')}';
    if (resolved != root && !resolved.startsWith('$root/')) return null;
    return resolved;
  }

  static bool validName(String name) => _validName(name);

  static bool _validName(String name) {
    if (name.isEmpty || name == '.' || name == '..') return false;
    if (name.contains('/') || name.contains('\\') || name.contains('\u0000')) return false;
    return true;
  }
}
