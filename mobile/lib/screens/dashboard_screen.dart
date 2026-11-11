import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../providers/auth_provider.dart';
import '../providers/document_provider.dart';
import '../providers/supplier_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, required this.onNavigate});

  final ValueChanged<int> onNavigate;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  HealthStatus? _health;
  bool _healthLoading = true;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    if (!mounted) return;
    final suppliers = context.read<SupplierProvider>();
    final documents = context.read<DocumentProvider>();

    await Future.wait([
      suppliers.load(),
      documents.load(),
    ]);

    try {
      final health = await ApiService.instance.health();
      if (mounted) {
        setState(() {
          _health = health;
          _healthLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _healthLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final suppliers = context.watch<SupplierProvider>();
    final documents = context.watch<DocumentProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _load,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
          children: [
            Text(
              'Welcome back, ${user?.displayName ?? 'there'}',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            const Text(
              "Here's your procurement overview.",
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 20),

            if (suppliers.error != null)
              ErrorBanner(message: suppliers.error!, onRetry: _load),

            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.2,
              children: [
                StatTile(
                  label: 'Active Suppliers',
                  value: '${suppliers.activeCount}',
                  icon: Icons.business,
                  color: AppColors.accent,
                ),
                StatTile(
                  label: 'High Risk',
                  value: '${suppliers.highRiskCount}',
                  icon: Icons.warning_amber_rounded,
                  color: AppColors.danger,
                ),
                StatTile(
                  label: 'Documents',
                  value: '${documents.documents.length}',
                  icon: Icons.description_outlined,
                  color: AppColors.primary,
                ),
                StatTile(
                  label: 'Indexed Chunks',
                  value: '${documents.totalChunks}',
                  icon: Icons.auto_awesome,
                  color: const Color(0xFFA78BFA),
                ),
              ],
            ),
            const SizedBox(height: 20),

            SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'System Status',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  const SizedBox(height: 12),
                  if (_healthLoading)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(8),
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      ),
                    )
                  else if (_health == null)
                    const Text(
                      'Backend not reachable.',
                      style: TextStyle(color: AppColors.danger, fontSize: 12),
                    )
                  else ...[
                    _StatusRow(label: 'API', value: _health!.status),
                    _StatusRow(label: 'Database', value: _health!.database),
                    _StatusRow(label: 'Vector DB', value: _health!.chromadb),
                    _StatusRow(label: 'Gemini', value: _health!.gemini),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Supplier Health',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                ),
                TextButton(
                  onPressed: () => widget.onNavigate(2),
                  child: const Text('View all'),
                ),
              ],
            ),
            if (suppliers.loading && suppliers.suppliers.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (suppliers.suppliers.isEmpty)
              const EmptyState(
                icon: Icons.business_outlined,
                title: 'No suppliers yet',
                message: 'Seed the database to see demo suppliers.',
              )
            else
              ...suppliers.suppliers.take(4).map(
                    (supplier) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _SupplierRow(supplier: supplier),
                    ),
                  ),
            const SizedBox(height: 12),

            SectionCard(
              child: Column(
                children: [
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Quick Actions',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _QuickAction(
                    icon: Icons.chat_bubble_outline,
                    label: 'Ask SmartProcure AI',
                    onTap: () => widget.onNavigate(1),
                  ),
                  _QuickAction(
                    icon: Icons.upload_file_outlined,
                    label: 'Upload a document',
                    onTap: () => widget.onNavigate(3),
                  ),
                  _QuickAction(
                    icon: Icons.business_outlined,
                    label: 'Review suppliers',
                    onTap: () => widget.onNavigate(2),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  const _StatusRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final healthy = value.toLowerCase().contains('connect') ||
        value.toLowerCase().contains('configur') ||
        value.toLowerCase() == 'healthy';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Icon(
            healthy ? Icons.check_circle : Icons.error_outline,
            size: 16,
            color: healthy ? AppColors.success : AppColors.danger,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 13),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textMuted,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _SupplierRow extends StatelessWidget {
  const _SupplierRow({required this.supplier});

  final Supplier supplier;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.surfaceAlt,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.storefront_outlined,
                size: 20, color: AppColors.textMuted),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  supplier.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${supplier.category ?? 'Uncategorized'} · '
                  'Score ${supplier.averageScore.toStringAsFixed(0)}',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          StatusBadge(
            label: supplier.riskLevel,
            color: riskColor(supplier.riskLevel),
          ),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppColors.primary),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 13))),
            const Icon(Icons.chevron_right,
                size: 18, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}
