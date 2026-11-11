import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:smartprocure_mobile/providers/auth_provider.dart';
import 'package:smartprocure_mobile/screens/login_screen.dart';
import 'package:smartprocure_mobile/services/api_service.dart';
import 'package:smartprocure_mobile/theme/app_theme.dart';

void main() {
  testWidgets('login screen renders the sign-in form', (tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(ApiService.instance),
        child: MaterialApp(theme: AppTheme.dark, home: const LoginScreen()),
      ),
    );

    expect(find.text('SmartProcure'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.text('Username'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
  });

  testWidgets('login validates empty fields', (tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(ApiService.instance),
        child: MaterialApp(theme: AppTheme.dark, home: const LoginScreen()),
      ),
    );

    await tester.tap(find.text('Sign In'));
    await tester.pump();

    expect(find.text('Username is required'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
  });
}
