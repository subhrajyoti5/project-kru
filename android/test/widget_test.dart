import 'package:flutter_test/flutter_test.dart';
import 'package:kru_android/app/app.dart';

void main() {
  testWidgets('scanner explains that the website shows the QR', (tester) async {
    await tester.pumpWidget(const KruApp());
    expect(find.text('Scan the QR code from your desktop browser'), findsOneWidget);
    expect(find.textContaining('Make sure your phone and desktop are on the same Wi-Fi network'), findsOneWidget);
  });
}

