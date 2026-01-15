import 'package:flutter/material.dart';

import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';

/// Modern scanner overlay with animated frame
class ScannerOverlay extends StatefulWidget {
  const ScannerOverlay({
    super.key,
    this.isProcessing = false,
    this.statusText,
    this.overlayColor,
  });

  final bool isProcessing;
  final String? statusText;
  final Color? overlayColor;

  @override
  State<ScannerOverlay> createState() => _ScannerOverlayState();
}

class _ScannerOverlayState extends State<ScannerOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _pulseAnimation;
  late Animation<double> _scanLineAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    )..repeat();

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.03).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.easeInOut),
      ),
    );

    _scanLineAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
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
    final statusText = widget.statusText ??
        (widget.isProcessing ? 'Processing...' : 'Align barcode within frame');

    return LayoutBuilder(
      builder: (context, constraints) {
        final scanAreaSize = constraints.maxWidth * 0.7;

        return Stack(
          children: [
            // Darkened overlay
            CustomPaint(
              size: Size(constraints.maxWidth, constraints.maxHeight),
              painter: _OverlayPainter(
                scanAreaSize: scanAreaSize,
                overlayColor: widget.overlayColor ?? Colors.black.withValues(alpha: 0.5),
              ),
            ),
            // Scan frame
            Center(
              child: AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: widget.isProcessing ? 1.0 : _pulseAnimation.value,
                    child: child,
                  );
                },
                child: SizedBox(
                  width: scanAreaSize,
                  height: scanAreaSize,
                  child: Stack(
                    children: [
                      // Corner brackets
                      _buildCorner(Alignment.topLeft),
                      _buildCorner(Alignment.topRight),
                      _buildCorner(Alignment.bottomLeft),
                      _buildCorner(Alignment.bottomRight),
                      // Scanning line
                      if (!widget.isProcessing)
                        AnimatedBuilder(
                          animation: _scanLineAnimation,
                          builder: (context, _) {
                            return Positioned(
                              top: scanAreaSize * _scanLineAnimation.value,
                              left: 20,
                              right: 20,
                              child: Container(
                                height: 2,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      Colors.transparent,
                                      theme.colorScheme.primary.withValues(alpha: 0.8),
                                      theme.colorScheme.primary,
                                      theme.colorScheme.primary.withValues(alpha: 0.8),
                                      Colors.transparent,
                                    ],
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: theme.colorScheme.primary.withValues(alpha: 0.5),
                                      blurRadius: 10,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                    ],
                  ),
                ),
              ),
            ),
            // Status badge
            Positioned(
              top: 20,
              left: 20,
              child: _StatusBadge(
                text: statusText,
                isProcessing: widget.isProcessing,
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCorner(Alignment alignment) {
    final theme = Theme.of(context);
    final isTop = alignment.y < 0;
    final isLeft = alignment.x < 0;

    return Positioned(
      top: isTop ? 0 : null,
      bottom: isTop ? null : 0,
      left: isLeft ? 0 : null,
      right: isLeft ? null : 0,
      child: Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          border: Border(
            top: isTop
                ? BorderSide(
                    color: widget.isProcessing
                        ? MajesticColors.gold
                        : theme.colorScheme.primary,
                    width: 3,
                  )
                : BorderSide.none,
            bottom: !isTop
                ? BorderSide(
                    color: widget.isProcessing
                        ? MajesticColors.gold
                        : theme.colorScheme.primary,
                    width: 3,
                  )
                : BorderSide.none,
            left: isLeft
                ? BorderSide(
                    color: widget.isProcessing
                        ? MajesticColors.gold
                        : theme.colorScheme.primary,
                    width: 3,
                  )
                : BorderSide.none,
            right: !isLeft
                ? BorderSide(
                    color: widget.isProcessing
                        ? MajesticColors.gold
                        : theme.colorScheme.primary,
                    width: 3,
                  )
                : BorderSide.none,
          ),
        ),
      ),
    );
  }
}

class _OverlayPainter extends CustomPainter {
  _OverlayPainter({
    required this.scanAreaSize,
    required this.overlayColor,
  });

  final double scanAreaSize;
  final Color overlayColor;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = overlayColor;

    final scanRect = Rect.fromCenter(
      center: Offset(size.width / 2, size.height / 2),
      width: scanAreaSize,
      height: scanAreaSize,
    );

    // Draw overlay with cutout
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(scanRect, const Radius.circular(16)))
      ..fillType = PathFillType.evenOdd;

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({
    required this.text,
    required this.isProcessing,
  });

  final String text;
  final bool isProcessing;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isProcessing
            ? MajesticColors.gold.withValues(alpha: 0.9)
            : Colors.black.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isProcessing) ...[
            SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: isProcessing ? MajesticColors.ink : Colors.white,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Text(
            text,
            style: TextStyle(
              color: isProcessing ? MajesticColors.ink : Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

/// Camera controls bar
class ScannerControls extends StatelessWidget {
  const ScannerControls({
    super.key,
    this.onFlashToggle,
    this.onCameraFlip,
    this.isFlashOn = false,
  });

  final VoidCallback? onFlashToggle;
  final VoidCallback? onCameraFlip;
  final bool isFlashOn;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (onFlashToggle != null)
            _ControlButton(
              icon: isFlashOn ? Icons.flash_on : Icons.flash_off,
              onPressed: onFlashToggle!,
              isActive: isFlashOn,
            ),
          if (onFlashToggle != null && onCameraFlip != null)
            const SizedBox(width: 24),
          if (onCameraFlip != null)
            _ControlButton(
              icon: Icons.flip_camera_ios,
              onPressed: onCameraFlip!,
            ),
        ],
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.icon,
    required this.onPressed,
    this.isActive = false,
  });

  final IconData icon;
  final VoidCallback onPressed;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isActive ? MajesticColors.gold : Colors.white.withValues(alpha: 0.2),
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(24),
        child: Container(
          width: 48,
          height: 48,
          alignment: Alignment.center,
          child: Icon(
            icon,
            color: isActive ? MajesticColors.ink : Colors.white,
            size: 24,
          ),
        ),
      ),
    );
  }
}

/// Bottom sheet for scan result
class ScanResultSheet extends StatelessWidget {
  const ScanResultSheet({
    super.key,
    required this.jobId,
    required this.onConfirm,
    required this.onRescan,
    this.jobData,
    this.error,
    this.currentStatus,
    this.nextStatus,
    this.batchCode,
    this.isOffline = false,
    this.onOfflineChanged,
    this.onReportIncident,
  });

  final String jobId;
  final Map<String, dynamic>? jobData;
  final String? error;
  final String? currentStatus;
  final String? nextStatus;
  final String? batchCode;
  final bool isOffline;
  final void Function(bool)? onOfflineChanged;
  final VoidCallback onConfirm;
  final VoidCallback onRescan;
  final VoidCallback? onReportIncident;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final hasError = error != null;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? MajesticColors.darkCard : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? MajesticColors.darkBorder : MajesticColors.ink.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            // Header
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Job $jobId',
                        style: theme.textTheme.titleMedium,
                      ),
                      if (batchCode != null)
                        Container(
                          margin: const EdgeInsets.only(top: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: MajesticColors.gold.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Batch $batchCode',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: MajesticColors.gold,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                if (hasError)
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: MajesticColors.danger.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.error_outline,
                      color: MajesticColors.danger,
                      size: 20,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            // Content
            if (hasError)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: MajesticColors.danger.withValues(alpha: isDark ? 0.2 : 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: MajesticColors.danger.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber, color: MajesticColors.danger, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        error!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: MajesticColors.danger,
                        ),
                      ),
                    ),
                  ],
                ),
              )
            else if (jobData != null) ...[
              if (jobData!['item_description'] != null)
                Text(
                  jobData!['item_description'].toString(),
                  style: theme.textTheme.bodyMedium,
                ),
              const SizedBox(height: 16),
              // Status info would go here using StatusTransition widget
              // Holder info
              if (jobData!['current_holder_username'] != null ||
                  jobData!['current_holder_role'] != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.person_outline,
                      size: 16,
                      color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.5),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Last: ${jobData!['current_holder_username'] ?? jobData!['current_holder_role'] ?? '-'}',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ],
            ],
            const SizedBox(height: 20),
            // Offline toggle
            if (onOfflineChanged != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? MajesticColors.darkSurface : MajesticColors.cloud,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      isOffline ? Icons.cloud_off : Icons.cloud_done,
                      size: 20,
                      color: isOffline ? MajesticColors.warning : MajesticColors.success,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Offline Mode',
                        style: theme.textTheme.titleSmall,
                      ),
                    ),
                    Switch(
                      value: isOffline,
                      onChanged: onOfflineChanged,
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 20),
            // Actions
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: hasError && !isOffline ? null : onConfirm,
                    child: Text(nextStatus != null ? 'Confirm' : 'Confirm Scan'),
                  ),
                ),
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: onRescan,
                  child: const Text('Rescan'),
                ),
              ],
            ),
            if (onReportIncident != null) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: TextButton.icon(
                  onPressed: onReportIncident,
                  icon: const Icon(Icons.report_gmailerrorred, size: 18),
                  label: const Text('Report Incident'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
