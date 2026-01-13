import 'package:flutter/material.dart';

import 'majestic_theme.dart';

class MajesticScaffold extends StatelessWidget {
  const MajesticScaffold({
    super.key,
    required this.title,
    required this.child,
    this.actions,
    this.floatingActionButton,
    this.padding = const EdgeInsets.all(16),
  });

  final String title;
  final Widget child;
  final List<Widget>? actions;
  final Widget? floatingActionButton;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: actions,
      ),
      floatingActionButton: floatingActionButton,
      body: Container(
        decoration: majesticBackground(),
        child: SafeArea(
          child: Padding(
            padding: padding,
            child: child,
          ),
        ),
      ),
    );
  }
}
