import 'package:flutter_test/flutter_test.dart';
import 'package:kru_android/app/app.dart';

void main() {
  testWidgets('scanner explains that the website shows the QR', (tester) async {
    await tester.pumpWidget(const KruApp());
    expect(find.textContaining('This phone scans that code'), findsOneWidget);
    expect(find.text('Decode and connect'), findsOneWidget);
  });
}
