import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import 'package:diamond_tracker_mobile/state/providers.dart';
import 'package:diamond_tracker_mobile/ui/majestic_scaffold.dart';

class PurchaseEntryScreen extends ConsumerStatefulWidget {
  const PurchaseEntryScreen({super.key});

  @override
  ConsumerState<PurchaseEntryScreen> createState() => _PurchaseEntryScreenState();
}

class _PurchaseEntryScreenState extends ConsumerState<PurchaseEntryScreen> {
  final _descriptionController = TextEditingController();
  final _customerController = TextEditingController();
  final _phoneController = TextEditingController();
  final _weightController = TextEditingController();
  final _diamondCentController = TextEditingController();
  final _valueController = TextEditingController();
  final _picker = ImagePicker();
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
    return MajesticScaffold(
      title: 'Purchase Entry',
      child: ListView(
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('New Item Intake', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(labelText: 'Item Description'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _customerController,
                    decoration: const InputDecoration(labelText: 'Customer Name'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    decoration: const InputDecoration(labelText: 'Customer Phone'),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _itemSource,
                    decoration: const InputDecoration(labelText: 'Item Source'),
                    hint: const Text('Select source'),
                    items: const [
                      DropdownMenuItem(value: 'Old', child: Text('Old (stock received)')),
                      DropdownMenuItem(value: 'Repair', child: Text('Repair (customer)')),
                    ],
                    onChanged: _submitting ? null : (value) => setState(() => _itemSource = value),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _weightController,
                    decoration: const InputDecoration(labelText: 'Approximate Weight (g)'),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _diamondCentController,
                    decoration: const InputDecoration(labelText: 'Diamond Cent'),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _valueController,
                    decoration: const InputDecoration(labelText: 'Purchase Value (INR)'),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                  const SizedBox(height: 12),
                  Text('Item Photos *', style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (int index = 0; index < _photos.length; index++)
                        Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.file(
                                File(_photos[index].path),
                                width: 72,
                                height: 72,
                                fit: BoxFit.cover,
                              ),
                            ),
                            Positioned(
                              right: 4,
                              top: 4,
                              child: InkWell(
                                onTap: () => setState(() => _photos.removeAt(index)),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.8),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Text('x', style: TextStyle(fontSize: 12)),
                                ),
                              ),
                            )
                          ],
                        ),
                      InkWell(
                        onTap: _submitting ? null : _capturePhoto,
                        child: Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.black12),
                          ),
                          child: const Icon(Icons.camera_alt),
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    value: _offline,
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Offline Mode'),
                    onChanged: (value) => setState(() => _offline = value),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : () => _submit(context),
                      child: const Text('Create Job'),
                    ),
                  )
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _capturePhoto() async {
    final photo = await _picker.pickImage(source: ImageSource.camera, imageQuality: 85);
    if (photo == null) return;
    setState(() => _photos.add(photo));
  }

  Future<void> _submit(BuildContext context) async {
    if (_descriptionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Item description is required.')),
      );
      return;
    }
    if (_photos.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('At least one photo is required.')),
      );
      return;
    }
    if (_itemSource == null || _itemSource!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
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
        if (!mounted) return;
        _clearForm();
        await _showQueuedDialog(jobId);
        if (mounted) {
          Navigator.pop(context);
        }
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
      if (!mounted) return;
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
      if (mounted) {
        Navigator.pop(context);
      }
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create job: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  void _clearForm() {
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
    if (!mounted) return;
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
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        'Sync done: ${report.jobsSynced} jobs, ${report.scansSynced} scans, ${report.failures} failures.',
                      ),
                    ),
                  );
                } catch (error) {
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
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
