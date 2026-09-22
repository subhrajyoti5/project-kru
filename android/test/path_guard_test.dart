import 'package:flutter_test/flutter_test.dart';
import 'package:kru_android/features/filesystem/application/path_guard.dart';

void main() {
  test('allows a file inside a known root', () {
    expect(
      PathGuard.resolve('/Download/notes.txt'),
      '/storage/emulated/0/Download/notes.txt',
    );
  });

  test('rejects traversal and unknown roots', () {
    expect(PathGuard.resolve('/Download/../DCIM/a.jpg'), isNull);
    expect(PathGuard.resolve('/data/secret'), isNull);
    expect(PathGuard.resolve('/Download/a\u0000b'), isNull);
  });
}
