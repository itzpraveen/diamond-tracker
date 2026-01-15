import 'package:flutter/material.dart';

import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';

/// Elevated button with built-in loading state and animations
class LoadingButton extends StatefulWidget {
  const LoadingButton({
    super.key,
    required this.onPressed,
    required this.label,
    this.icon,
    this.isLoading = false,
    this.isExpanded = true,
    this.variant = LoadingButtonVariant.primary,
  });

  final VoidCallback? onPressed;
  final String label;
  final IconData? icon;
  final bool isLoading;
  final bool isExpanded;
  final LoadingButtonVariant variant;

  @override
  State<LoadingButton> createState() => _LoadingButtonState();
}

class _LoadingButtonState extends State<LoadingButton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    Widget button;

    switch (widget.variant) {
      case LoadingButtonVariant.primary:
        button = _buildElevatedButton(theme, isDark);
        break;
      case LoadingButtonVariant.secondary:
        button = _buildOutlinedButton(theme, isDark);
        break;
      case LoadingButtonVariant.text:
        button = _buildTextButton(theme, isDark);
        break;
      case LoadingButtonVariant.danger:
        button = _buildDangerButton(theme, isDark);
        break;
    }

    if (widget.isExpanded) {
      button = SizedBox(width: double.infinity, child: button);
    }

    return GestureDetector(
      onTapDown: widget.isLoading || widget.onPressed == null ? null : (_) => _controller.forward(),
      onTapUp: widget.isLoading || widget.onPressed == null ? null : (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        ),
        child: button,
      ),
    );
  }

  Widget _buildElevatedButton(ThemeData theme, bool isDark) {
    return ElevatedButton(
      onPressed: widget.isLoading ? null : widget.onPressed,
      child: _buildContent(Colors.white),
    );
  }

  Widget _buildOutlinedButton(ThemeData theme, bool isDark) {
    return OutlinedButton(
      onPressed: widget.isLoading ? null : widget.onPressed,
      child: _buildContent(isDark ? MajesticColors.darkText : MajesticColors.ink),
    );
  }

  Widget _buildTextButton(ThemeData theme, bool isDark) {
    return TextButton(
      onPressed: widget.isLoading ? null : widget.onPressed,
      child: _buildContent(theme.colorScheme.primary),
    );
  }

  Widget _buildDangerButton(ThemeData theme, bool isDark) {
    return ElevatedButton(
      onPressed: widget.isLoading ? null : widget.onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: MajesticColors.danger,
        foregroundColor: Colors.white,
      ),
      child: _buildContent(Colors.white),
    );
  }

  Widget _buildContent(Color spinnerColor) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      child: widget.isLoading
          ? SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: spinnerColor,
              ),
            )
          : Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (widget.icon != null) ...[
                  Icon(widget.icon, size: 20),
                  const SizedBox(width: 8),
                ],
                Text(widget.label),
              ],
            ),
    );
  }
}

enum LoadingButtonVariant { primary, secondary, text, danger }

/// Icon button with loading state
class LoadingIconButton extends StatelessWidget {
  const LoadingIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
    this.isLoading = false,
    this.tooltip,
    this.color,
    this.size = 24,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final bool isLoading;
  final String? tooltip;
  final Color? color;
  final double size;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Widget button = IconButton(
      onPressed: isLoading ? null : onPressed,
      icon: isLoading
          ? SizedBox(
              width: size - 4,
              height: size - 4,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: color ?? theme.colorScheme.primary,
              ),
            )
          : Icon(icon, size: size, color: color),
    );

    if (tooltip != null) {
      button = Tooltip(message: tooltip!, child: button);
    }

    return button;
  }
}

/// Floating action button with loading state
class LoadingFAB extends StatelessWidget {
  const LoadingFAB({
    super.key,
    required this.icon,
    required this.onPressed,
    this.label,
    this.isLoading = false,
    this.isExtended = false,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final String? label;
  final bool isLoading;
  final bool isExtended;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (isExtended && label != null) {
      return FloatingActionButton.extended(
        onPressed: isLoading ? null : onPressed,
        icon: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: theme.colorScheme.onPrimary,
                ),
              )
            : Icon(icon),
        label: Text(label!),
      );
    }

    return FloatingActionButton(
      onPressed: isLoading ? null : onPressed,
      child: isLoading
          ? SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: theme.colorScheme.onPrimary,
              ),
            )
          : Icon(icon),
    );
  }
}

/// Scan button with camera icon - used across scan screens
class ScanButton extends StatelessWidget {
  const ScanButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon = Icons.qr_code_scanner,
    this.isLoading = false,
    this.isPrimary = true,
  });

  final String label;
  final VoidCallback onPressed;
  final IconData icon;
  final bool isLoading;
  final bool isPrimary;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (isPrimary) {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: isLoading ? null : onPressed,
          icon: isLoading
              ? SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: theme.colorScheme.onPrimary,
                  ),
                )
              : Icon(icon),
          label: Text(label),
        ),
      );
    }

    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: isLoading ? null : onPressed,
        icon: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: isDark ? MajesticColors.darkText : MajesticColors.ink,
                ),
              )
            : Icon(icon),
        label: Text(label),
      ),
    );
  }
}
