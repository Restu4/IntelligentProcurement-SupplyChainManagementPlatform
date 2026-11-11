import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../providers/document_provider.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/common.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  static const List<String> _allowedExtensions = ['pdf', 'docx', 'txt', 'md'];

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (!mounted) return;
      context.read<DocumentProvider>().load();
    });
  }

  Future<void> _pickAndUpload() async {
    final provider = context.read<DocumentProvider>();

    FilePickerResult? result;
    try {
      result = await FilePicker.platform.pickFiles(
        withData: true,
        type: FileType.custom,
        allowedExtensions: _allowedExtensions,
      );
    } catch (error) {
      _showMessage('Could not open the file picker: $error');
      return;
    }

    if (result == null || result.files.isEmpty) return;

    final file = result.files.single;
    final Uint8List? bytes = file.bytes;
    if (bytes == null) {
      _showMessage('Unable to read the selected file.');
      return;
    }

    final description = await _askDescription(file.name);
    if (description == null) return;
    if (!mounted) return;

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const _UploadingDialog(),
    );

    try {
      await provider.upload(
        filename: file.name,
        bytes: bytes,
        description: description,
      );
      if (mounted) Navigator.of(context, rootNavigator: true).pop();
      _showMessage('${file.name} indexed successfully.');
    } catch (error) {
      if (mounted) Navigator.of(context, rootNavigator: true).pop();
      _showMessage(provider.error ?? 'Upload failed: $error');
    }
  }

  Future<String?> _askDescription(String filename) async {
    final controller = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Upload document'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              filename,
              style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Short description (optional)',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () =>
                Navigator.of(dialogContext).pop(controller.text.trim()),
            style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Upload'),
          ),
        ],
      ),
    );
    controller.dispose();
    return result;
  }

  Future<void> _confirmDelete(ProcurementDocument document) async {
    final provider = context.read<DocumentProvider>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Delete document?'),
        content: Text(
          '${document.originalFilename} will be removed from the database and '
          'the vector index. This cannot be undone.',
          style: const TextStyle(fontSize: 13, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await provider.remove(document.id);
      _showMessage('Document deleted.');
    } catch (error) {
      _showMessage(provider.error ?? 'Delete failed: $error');
    }
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DocumentProvider>();
    final isAdmin = context.watch<AuthProvider>().user?.isAdmin ?? false;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Knowledge Base'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => provider.load(),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      floatingActionButton: isAdmin
          ? FloatingActionButton.extended(
              onPressed: provider.uploading ? null : _pickAndUpload,
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.black,
              icon: const Icon(Icons.upload_file),
              label: const Text('Upload'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: provider.load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
          children: [
            SectionCard(
              child: Row(
                children: [
                  const Icon(Icons.auto_awesome,
                      color: AppColors.primary, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '${provider.documents.length} documents · '
                      '${provider.totalChunks} indexed chunks',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (provider.error != null)
              ErrorBanner(message: provider.error!, onRetry: provider.load),
            if (!isAdmin)
              const Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: Text(
                  'Read-only access. Only administrators can upload or delete documents.',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                ),
              ),
            if (provider.loading && provider.documents.isEmpty)
              const Padding(
                padding: EdgeInsets.all(48),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (provider.documents.isEmpty)
              const EmptyState(
                icon: Icons.library_books_outlined,
                title: 'Knowledge base is empty',
                message: 'Upload a PDF, DOCX, TXT, or MD file to get started.',
              )
            else
              ...provider.documents.map(
                (document) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _DocumentTile(
                    document: document,
                    canDelete: isAdmin,
                    onDelete: () => _confirmDelete(document),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _DocumentTile extends StatelessWidget {
  const _DocumentTile({
    required this.document,
    required this.canDelete,
    required this.onDelete,
  });

  final ProcurementDocument document;
  final bool canDelete;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.14),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                document.fileType.toUpperCase(),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  document.originalFilename,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${document.chunkCount} chunks · '
                  '${Formatters.fileSize(document.fileSize)} · '
                  '${Formatters.date(document.createdAt)}',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 10,
                  ),
                ),
                if (document.description != null &&
                    document.description!.trim().isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    document.description!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 10,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (canDelete)
            IconButton(
              tooltip: 'Delete',
              onPressed: onDelete,
              icon: const Icon(
                Icons.delete_outline,
                size: 18,
                color: AppColors.danger,
              ),
            ),
        ],
      ),
    );
  }
}

class _UploadingDialog extends StatelessWidget {
  const _UploadingDialog();

  @override
  Widget build(BuildContext context) {
    return const AlertDialog(
      backgroundColor: AppColors.surface,
      content: Row(
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          SizedBox(width: 16),
          Expanded(
            child: Text(
              'Uploading, extracting text, and building embeddings...',
              style: TextStyle(fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
