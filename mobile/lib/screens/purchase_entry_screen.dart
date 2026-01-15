import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';
import 'package:diamond_tracker_mobile/ui/majestic_theme.dart';
import 'package:diamond_tracker_mobile/widgets/form_fields.dart';
import 'package:diamond_tracker_mobile/widgets/loading_button.dart';
import 'package:diamond_tracker_mobile/widgets/photo_picker.dart';

class PurchaseEntryScreen extends ConsumerStatefulWidget {
  const PurchaseEntryScreen({super.key});

  @override
  ConsumerState<PurchaseEntryScreen> createState() => _PurchaseEntryScreenState();
}

class _PurchaseEntryScreenState extends ConsumerState<PurchaseEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _customerController = TextEditingController();
  final _phoneController = TextEditingController();
  final _weightController = TextEditingController();
  final _diamondCentController = TextEditingController();
  final _valueController = TextEditingController();
  final List<XFile> _photos = [];
  String? _itemSource;
  bool _offline = false;
  bool _submitting = false;

  @override
  void dispose() {
    _descriptionController.dispose();
    _customerController.dispose();
    _phoneController.dispose();
    _weightController.dispose();
    _diamondCentController.dispose();
    _valueController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return MajesticScaffold(
      title: 'Purchase Entry',
      padding: EdgeInsets.zero,
      child: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _HeaderCard(isDark: isDark),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: FormSection(
                  title: 'Item Details',
                  subtitle: 'Capture item info and source',
                  children: [
                    MajesticTextField(
                      controller: _descriptionController,
                      label: 'Item Description',
                      hint: 'e.g. diamond ring',
                      prefixIcon: Icons.diamond_outlined,
                      enabled: !_submitting,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Item description is required';
                        }
                        return null;
                      },
                    ),
                    MajesticDropdown<String>(
                      label: 'Item Source',
                      value: _itemSource,
                      hint: 'Select source',
                      items: const [
                        DropdownMenuItem(value: 'Old', child: Text('Old (stock received)')),
                        DropdownMenuItem(value: 'Repair', child: Text('Repair (customer)')),
                      ],
                      enabled: !_submitting,
                      onChanged: (value) => setState(() => _itemSource = value),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Select an item source';
                        }
                        return null;
                      },
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: MajesticTextField(
                            controller: _weightController,
                            label: 'Weight (g)',
                            prefixIcon: Icons.scale_outlined,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            inputFormatters: [
                              FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                            ],
                            enabled: !_submitting,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: MajesticTextField(
                            controller: _diamondCentController,
                            label: 'Diamond Cent',
                            prefixIcon: Icons.auto_awesome,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            inputFormatters: [
                              FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                            ],
                            enabled: !_submitting,
                          ),
                        ),
                      ],
                    ),
                    MajesticTextField(
                      controller: _valueController,
                      label: 'Purchase Value (INR)',
                      prefixIcon: Icons.currency_rupee,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                      ],
                      enabled: !_submitting,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: FormSection(
                  title: 'Customer',
                  subtitle: 'Optional for walk-in customers',
                  children: [
                    MajesticTextField(
                      controller: _customerController,
                      label: 'Customer Name',
                      prefixIcon: Icons.person_outline,
                      enabled: !_submitting,
                    ),
                    MajesticTextField(
                      controller: _phoneController,
                      label: 'Customer Phone',
                      prefixIcon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      enabled: !_submitting,
                      maxLength: 10,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: FormSection(
                  title: 'Item Photos',
                  subtitle: 'Capture at least one clear photo',
                  children: [
                    PhotoPicker(
                      photos: _photos,
                      onPhotosChanged: (photos) => setState(() {
                        _photos
                          ..clear()
                          ..addAll(photos);
                      }),
                      required: true,
                      enabled: !_submitting,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: FormSection(
                  title: 'Options',
                  children: [
                    MajesticSwitch(
                      title: 'Offline Mode',
                      subtitle: _offline ? 'Will sync when online' : 'Upload immediately',
                      icon: _offline ? Icons.cloud_off : Icons.cloud_done,
                      value: _offline,
                      onChanged: _submitting ? null : (value) => setState(() => _offline = value),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            LoadingButton(
              onPressed: _submitting ? null : () => _submit(context),
              label: 'Create Job',
              icon: Icons.check_circle_outline,
              isLoading: _submitting,
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Future<void> _submit(BuildContext context) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    FocusScope.of(context).unfocus();
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_photos.isEmpty) {
      messenger.showSnackBar(
        const SnackBar(content: Text('At least one photo is required.')),
      );
      return;
    }
    if (_itemSource == null || _itemSource!.isEmpty) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Select an item source.')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final repo = ref.read(jobRepositoryProvider);
      final weight = double.tryParse(_weightController.text.trim());
      final diamondCent = double.tryParse(_diamondCentController.text.trim());
      final value = double.tryParse(_valueController.text.trim());
      if (_offline) {
        final jobId = await _queueOfflineJob(
          weight: weight,
          diamondCent: diamondCent,
          value: value,
        );
        if (!context.mounted) return;
        _clearForm();
        await _showQueuedDialog(jobId);
        if (!context.mounted) return;
        navigator.pop();
        return;
      }

      final api = ref.read(apiClientProvider);
      final uploads = <Map<String, dynamic>>[];
      for (final photo in _photos) {
        final uploaded = await api.uploadImage(File(photo.path));
        uploads.add(uploaded);
      }

      final job = await repo.createJob({
        'item_description': _descriptionController.text.trim(),
        'customer_name': _customerController.text.trim(),
        'customer_phone': _phoneController.text.trim(),
        'approximate_weight': weight,
        'diamond_cent': diamondCent,
        'purchase_value': value,
        'item_source': _itemSource,
        'photos': uploads,
      });
      if (!context.mounted) return;
      _clearForm();
      final jobId = job['job_id'] as String;
      await showDialog<void>(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            title: const Text('Job Created'),
            content: Text('Job ID: $jobId'),
            actions: [
              TextButton(
                onPressed: () => _shareLabel(jobId),
                child: const Text('Share Label'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Done'),
              ),
            ],
          );
        },
      );
      if (!context.mounted) return;
      navigator.pop();
    } catch (error) {
      if (!context.mounted) return;
      messenger.showSnackBar(
        SnackBar(content: Text('Failed to create job: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  void _clearForm() {
    _formKey.currentState?.reset();
    _descriptionController.clear();
    _customerController.clear();
    _phoneController.clear();
    _weightController.clear();
    _diamondCentController.clear();
    _valueController.clear();
    setState(() {
      _itemSource = null;
      _photos.clear();
    });
  }

  Future<String> _queueOfflineJob({double? weight, double? diamondCent, double? value}) async {
    final repo = ref.read(jobRepositoryProvider);
    final db = ref.read(dbProvider);
    final payload = {
      'item_description': _descriptionController.text.trim(),
      'customer_name': _customerController.text.trim(),
      'customer_phone': _phoneController.text.trim(),
      'approximate_weight': weight,
      'diamond_cent': diamondCent,
      'purchase_value': value,
      'item_source': _itemSource,
      'current_status': 'OFFLINE_PENDING',
    };
    final job = await repo.createJob(payload, offline: true);
    final jobId = job['job_id'] as String;
    final dir = await getApplicationDocumentsDirectory();
    for (var index = 0; index < _photos.length; index++) {
      final photo = _photos[index];
      final source = File(photo.path);
      final filename = '$jobId-${DateTime.now().millisecondsSinceEpoch}-$index.jpg';
      final destination = File('${dir.path}/$filename');
      await source.copy(destination.path);
      await db.addPhoto(jobId, destination.path);
    }
    return jobId;
  }

  Future<void> _showQueuedDialog(String jobId) async {
    final syncService = ref.read(syncServiceProvider);
    final messenger = ScaffoldMessenger.of(context);
    if (!context.mounted) return;
    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Saved Offline'),
          content: Text('Queued Job ID: $jobId\nSync to print the label and continue tracking.'),
          actions: [
            TextButton(
              onPressed: () async {
                Navigator.pop(dialogContext);
                try {
                  final report = await syncService.syncAll();
                  if (!context.mounted) return;
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(
                        'Sync done: ${report.jobsSynced} jobs, ${report.scansSynced} scans, ${report.failures} failures.',
                      ),
                    ),
                  );
                } catch (error) {
                  if (!context.mounted) return;
                  messenger.showSnackBar(
                    SnackBar(content: Text('Sync failed: $error')),
                  );
                }
              },
              child: const Text('Sync Now'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Done'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _shareLabel(String jobId) async {
    final api = ref.read(apiClientProvider);
    final bytes = await api.downloadLabel(jobId);
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/label-$jobId.pdf');
    await file.writeAsBytes(bytes, flush: true);
    await Share.shareXFiles([XFile(file.path)], text: 'Label $jobId');
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.isDark});

  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  MajesticColors.darkCard,
                  MajesticColors.darkSurface,
                ]
              : [
                  MajesticColors.forest.withValues(alpha: 0.08),
                  MajesticColors.gold.withValues(alpha: 0.05),
                ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? MajesticColors.darkBorder
              : MajesticColors.forest.withValues(alpha: 0.1),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: isDark
                  ? MajesticColors.gold.withValues(alpha: 0.2)
                  : MajesticColors.forest.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              Icons.add_shopping_cart,
              color: isDark ? MajesticColors.gold : MajesticColors.forest,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'New Item Intake',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  'Capture item details and photos for tracking',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
