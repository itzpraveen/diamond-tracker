import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';
import 'package:diamond_tracker_mobile/widgets/form_fields.dart';
import 'package:diamond_tracker_mobile/widgets/loading_button.dart';

class IncidentScreen extends ConsumerStatefulWidget {
  const IncidentScreen({super.key, this.jobId});

  final String? jobId;

  @override
  ConsumerState<IncidentScreen> createState() => _IncidentScreenState();
}

class _IncidentScreenState extends ConsumerState<IncidentScreen> {
  final _jobIdController = TextEditingController();
  final _descController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String _type = 'StickerMismatch';
  bool _submitting = false;

  static const _incidentTypes = [
    ('StickerMismatch', 'Sticker Mismatch', Icons.qr_code_2, 'Label doesn\'t match item'),
    ('MissingItem', 'Missing Item', Icons.search_off, 'Item not found in shipment'),
    ('DuplicateScan', 'Duplicate Scan', Icons.content_copy, 'Same item scanned twice'),
    ('Damage', 'Damage', Icons.broken_image_outlined, 'Item is damaged'),
    ('Other', 'Other', Icons.more_horiz, 'Other issue'),
  ];

  @override
  void initState() {
    super.initState();
    if (widget.jobId != null) {
      _jobIdController.text = widget.jobId!;
    }
  }

  @override
  void dispose() {
    _jobIdController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _submitting = true);

    try {
      final api = ref.read(apiClientProvider);
      await api.createIncident({
        'job_id': _jobIdController.text.trim().isEmpty ? null : _jobIdController.text.trim(),
        'type': _type,
        'description': _descController.text.trim(),
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Incident reported successfully'),
          backgroundColor: MajesticColors.success,
        ),
      );
      Navigator.pop(context);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to submit: $error'),
          backgroundColor: MajesticColors.danger,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return MajesticScaffold(
      title: 'Report Incident',
      child: Form(
        key: _formKey,
        child: ListView(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: MajesticColors.warning.withValues(alpha: isDark ? 0.15 : 0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: MajesticColors.warning.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: MajesticColors.warning.withValues(alpha: isDark ? 0.25 : 0.15),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.report_gmailerrorred,
                      color: MajesticColors.warning,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Report an Issue',
                          style: theme.textTheme.titleMedium,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Document any problems for tracking and resolution',
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Incident type selector
            Text(
              'INCIDENT TYPE',
              style: theme.textTheme.labelMedium?.copyWith(
                letterSpacing: 1.5,
                color: isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.55),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _incidentTypes.map((type) {
                final isSelected = _type == type.$1;
                return _IncidentTypeChip(
                  value: type.$1,
                  label: type.$2,
                  icon: type.$3,
                  subtitle: type.$4,
                  isSelected: isSelected,
                  isDark: isDark,
                  onTap: () => setState(() => _type = type.$1),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),

            // Form fields
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Details',
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 16),
                    MajesticTextField(
                      controller: _jobIdController,
                      label: 'Job ID',
                      hint: 'Optional - enter if known',
                      prefixIcon: Icons.tag,
                    ),
                    const SizedBox(height: 16),
                    MajesticTextField(
                      controller: _descController,
                      label: 'Description',
                      hint: 'Describe what happened...',
                      prefixIcon: Icons.notes,
                      maxLines: 4,
                      minLines: 3,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please describe the incident';
                        }
                        return null;
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Submit button
            LoadingButton(
              onPressed: _submit,
              label: 'Submit Report',
              icon: Icons.send,
              isLoading: _submitting,
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class _IncidentTypeChip extends StatelessWidget {
  const _IncidentTypeChip({
    required this.value,
    required this.label,
    required this.icon,
    required this.subtitle,
    required this.isSelected,
    required this.isDark,
    required this.onTap,
  });

  final String value;
  final String label;
  final IconData icon;
  final String subtitle;
  final bool isSelected;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? MajesticColors.gold.withValues(alpha: 0.2) : MajesticColors.forest.withValues(alpha: 0.08))
              : (isDark ? MajesticColors.darkCard : MajesticColors.cloud),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? (isDark ? MajesticColors.gold : MajesticColors.forest)
                : (isDark ? MajesticColors.darkBorder : MajesticColors.ink.withValues(alpha: 0.08)),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isSelected
                    ? (isDark ? MajesticColors.gold.withValues(alpha: 0.25) : MajesticColors.forest.withValues(alpha: 0.12))
                    : (isDark ? MajesticColors.darkSurface : Colors.white),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                size: 20,
                color: isSelected
                    ? (isDark ? MajesticColors.gold : MajesticColors.forest)
                    : (isDark ? MajesticColors.darkTextSecondary : MajesticColors.ink.withValues(alpha: 0.5)),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: isSelected
                          ? (isDark ? MajesticColors.gold : MajesticColors.forest)
                          : null,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle,
                size: 22,
                color: isDark ? MajesticColors.gold : MajesticColors.forest,
              ),
          ],
        ),
      ),
    );
  }
}
