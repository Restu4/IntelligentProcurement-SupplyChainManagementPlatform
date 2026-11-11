import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../providers/supplier_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/common.dart';

class SuppliersScreen extends StatefulWidget {
  const SuppliersScreen({super.key});

  @override
  State<SuppliersScreen> createState() => _SuppliersScreenState();
}

class _SuppliersScreenState extends State<SuppliersScreen> {
  static const List<String> _filters = ['all', 'low', 'medium', 'high'];

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (!mounted) return;
      context.read<SupplierProvider>().load();
    });
  }

  Future<void> _openRiskSheet(Supplier supplier) async {
    final provider = context.read<SupplierProvider>();

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (sheetContext) {
        return _RiskSheet(
          supplier: supplier,
          future: provider.assessRisk(supplier.id),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SupplierProvider>();
    final suppliers = provider.filtered;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Suppliers'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => provider.load(),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: TextField(
              onChanged: provider.setQuery,
              decoration: const InputDecoration(
                hintText: 'Search suppliers...',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          SizedBox(
            height: 44,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: _filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final value = _filters[index];
                final selected = provider.riskFilter == value;
                return ChoiceChip(
                  label: Text(
                    value == 'all' ? 'All risk' : '${_capitalize(value)} risk',
                    style: TextStyle(
                      fontSize: 12,
                      color: selected ? Colors.black : Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  selected: selected,
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.surface,
                  side: const BorderSide(color: AppColors.border),
                  onSelected: (_) => provider.setRiskFilter(value),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: RefreshIndicator(
              onRefresh: provider.load,
              child: _buildList(provider, suppliers),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildList(SupplierProvider provider, List<Supplier> suppliers) {
    if (provider.loading && provider.suppliers.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (provider.error != null && provider.suppliers.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: [
          ErrorBanner(message: provider.error!, onRetry: provider.load),
        ],
      );
    }

    if (suppliers.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: const [
          SizedBox(height: 80),
          EmptyState(
            icon: Icons.business_outlined,
            title: 'No suppliers match your filters',
            message: 'Try a different search term or risk level.',
          ),
        ],
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      itemCount: suppliers.length,
      itemBuilder: (context, index) {
        final supplier = suppliers[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: InkWell(
            onTap: () => _openRiskSheet(supplier),
            borderRadius: BorderRadius.circular(18),
            child: SectionCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          supplier.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      StatusBadge(
                        label: supplier.riskLevel,
                        color: riskColor(supplier.riskLevel),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${supplier.category ?? 'Uncategorized'} · '
                    '${_capitalize(supplier.status)}',
                    style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: _ScoreBar(
                          label: 'Delivery',
                          score: supplier.deliveryScore,
                          color: AppColors.accent,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _ScoreBar(
                          label: 'Quality',
                          score: supplier.qualityScore,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  if (supplier.evaluationNotes != null &&
                      supplier.evaluationNotes!.trim().isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Text(
                      supplier.evaluationNotes!,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  String _capitalize(String value) {
    if (value.isEmpty) return value;
    return value[0].toUpperCase() + value.substring(1);
  }
}

class _ScoreBar extends StatelessWidget {
  const _ScoreBar({
    required this.label,
    required this.score,
    required this.color,
  });

  final String label;
  final double? score;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final normalized = ((score ?? 0) / 100).clamp(0.0, 1.0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: AppColors.textMuted,
                fontSize: 10,
              ),
            ),
            Text(
              score == null ? '-' : score!.toStringAsFixed(0),
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
            ),
          ],
        ),
        const SizedBox(height: 5),
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: LinearProgressIndicator(
            value: normalized.toDouble(),
            minHeight: 5,
            backgroundColor: AppColors.surfaceAlt,
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}

class _RiskSheet extends StatelessWidget {
  const _RiskSheet({required this.supplier, required this.future});

  final Supplier supplier;
  final Future<RiskAssessment> future;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        0,
        20,
        20 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: FutureBuilder<RiskAssessment>(
        future: future,
        builder: (context, snapshot) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                supplier.name,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                supplier.category ?? 'Uncategorized',
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 20),
              if (snapshot.connectionState == ConnectionState.waiting)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (snapshot.hasError)
                Text(
                  'Could not load risk assessment: ${snapshot.error}',
                  style: const TextStyle(color: AppColors.danger, fontSize: 12),
                )
              else if (snapshot.hasData) ...[
                Row(
                  children: [
                    StatusBadge(
                      label: snapshot.data!.riskLevel,
                      color: riskColor(snapshot.data!.riskLevel),
                    ),
                    const Spacer(),
                    Text(
                      'Risk score ${(snapshot.data!.riskScore * 100).toStringAsFixed(0)}%',
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'Contributing factors',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                ),
                const SizedBox(height: 8),
                if (snapshot.data!.factors.isEmpty)
                  const Text(
                    'No risk factors detected.',
                    style: TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 12,
                    ),
                  )
                else
                  ...snapshot.data!.factors.map(
                    (factor) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        children: [
                          const Icon(Icons.flag_outlined,
                              size: 14, color: AppColors.warning),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              factor.replaceAll('_', ' '),
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.surfaceAlt,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Close'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
