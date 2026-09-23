import 'package:flutter_test/flutter_test.dart';
import 'package:kru_android/app/app.dart';

void main() {
  testWidgets('scanner explains that the website shows the QR', (tester) async {
    await tester.pumpWidget(const KruApp());
    expect(find.text('Scan Web Code'), findsOneWidget);
    expect(find.textContaining('Point camera at the QR code'), findsOneWidget);
  });
}

