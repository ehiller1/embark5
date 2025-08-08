import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { JustifiedField, JustifiedArrayField } from './JustifiedField';
import { CampaignData, YearlyFinancials, FinancialAssumptions, KPIMetrics, ScenarioAnalysis } from '@/types/campaign';

interface FinancialsStepProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
}

export const FinancialsStep: React.FC<FinancialsStepProps> = ({
  data,
  onUpdate,
}) => {
  const updateField = (field: keyof CampaignData, value: any) => {
    onUpdate({
      [field]: {
        value,
        justification: data[field]?.justification || '',
      },
    });
  };

  const updateFinancialField = (field: string, value: any) => {
    const currentFinancials = data.pro_forma_financials || {};
    onUpdate({
      pro_forma_financials: {
        ...currentFinancials,
        [field]: {
          value,
          justification: currentFinancials[field]?.justification || '',
        },
      },
    });
  };

  const updateNestedFinancialField = (field: string, subfield: string, value: any) => {
    const currentFinancials = data.pro_forma_financials || {};
    const currentValue = currentFinancials[field]?.value || {};
    
    onUpdate({
      pro_forma_financials: {
        ...currentFinancials,
        [field]: {
          value: {
            ...currentValue,
            [subfield]: value,
          },
          justification: currentFinancials[field]?.justification || '',
        },
      },
    });
  };

  const updateFundingBreakdown = (category: string, amount: number) => {
    const currentBreakdown = data.funding_breakdown?.value || {};
    updateField('funding_breakdown', {
      ...currentBreakdown,
      [category]: amount,
    });
  };

  const updateImpactMetrics = (metric: string, value: string | number) => {
    const currentMetrics = data.impact_metrics?.value || {};
    updateField('impact_metrics', {
      ...currentMetrics,
      [metric]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Financial Projections</h2>
        <p className="text-muted-foreground">
          Define your funding needs, projections, and financial planning
        </p>
      </div>

      {/* Campaign Financials */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <JustifiedField
              label="Target Amount"
              value={data.target_amount?.value}
              justification={data.target_amount?.justification || ''}
              onChange={(value) => updateField('target_amount', value)}
              type="number"
              required
              placeholder="250000"
            />

            <JustifiedField
              label="Current Amount"
              value={data.current_amount?.value}
              justification={data.current_amount?.justification || ''}
              onChange={(value) => updateField('current_amount', value)}
              type="number"
              placeholder="78000"
            />

            <JustifiedField
              label="Minimum Investment"
              value={data.minimum_investment?.value}
              justification={data.minimum_investment?.justification || ''}
              onChange={(value) => updateField('minimum_investment', value)}
              type="number"
              required
              placeholder="500"
            />
          </div>

          <JustifiedField
            label="Campaign Start Date"
            value={data.campaign_start_date?.value}
            justification={data.campaign_start_date?.justification || ''}
            onChange={(value) => updateField('campaign_start_date', value)}
            type="date"
            required
          />

          <JustifiedField
            label="Campaign End Date"
            value={data.campaign_end_date?.value}
            justification={data.campaign_end_date?.justification || ''}
            onChange={(value) => updateField('campaign_end_date', value)}
            type="date"
            required
          />
        </CardContent>
      </Card>

      {/* Funding Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Use of Funds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JustifiedField
            label="Use of Funds Description"
            value={data.use_of_funds?.value}
            justification={data.use_of_funds?.justification || ''}
            onChange={(value) => updateField('use_of_funds', value)}
            type="textarea"
            rows={3}
            placeholder="Describe how the funds will be used"
          />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Funding Breakdown</h4>
            </div>
            {Object.entries(data.funding_breakdown?.value || {}).map(([category, amount]) => (
              <div key={category} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={category}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Category"
                  readOnly
                />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => updateFundingBreakdown(category, parseFloat(e.target.value) || 0)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Amount"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newBreakdown = { ...data.funding_breakdown?.value };
                    delete newBreakdown[category];
                    updateField('funding_breakdown', newBreakdown);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFundingBreakdown('New Category', 0)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Impact Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Impact Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(data.impact_metrics?.value || {}).map(([metric, value]) => (
            <div key={metric} className="flex gap-2 items-center">
              <input
                type="text"
                value={metric}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Metric name"
                readOnly
              />
              <input
                type="text"
                value={value}
                onChange={(e) => updateImpactMetrics(metric, e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Value"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newMetrics = { ...data.impact_metrics?.value };
                  delete newMetrics[metric];
                  updateField('impact_metrics', newMetrics);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateImpactMetrics('New Metric', '')}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Metric
          </Button>
        </CardContent>
      </Card>

      {/* Financial Assumptions */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Assumptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Growth Rate</label>
              <input
                type="number"
                step="0.01"
                value={data.pro_forma_financials?.assumptions?.value?.growth_rate || 0}
                onChange={(e) => updateNestedFinancialField('assumptions', 'growth_rate', parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0.10"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Donor Retention Rate</label>
              <input
                type="number"
                step="0.01"
                value={data.pro_forma_financials?.assumptions?.value?.donor_retention_rate || 0}
                onChange={(e) => updateNestedFinancialField('assumptions', 'donor_retention_rate', parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0.85"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Inflation Rate</label>
              <input
                type="number"
                step="0.01"
                value={data.pro_forma_financials?.assumptions?.value?.inflation_rate || 0}
                onChange={(e) => updateNestedFinancialField('assumptions', 'inflation_rate', parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0.03"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Program Expansion Rate</label>
              <input
                type="number"
                step="0.01"
                value={data.pro_forma_financials?.assumptions?.value?.program_expansion_rate || 0}
                onChange={(e) => updateNestedFinancialField('assumptions', 'program_expansion_rate', parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0.20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Program Ratio</label>
              <input
                type="number"
                step="0.01"
                value={data.pro_forma_financials?.kpi_metrics?.value?.program_ratio || 0}
                onChange={(e) => updateNestedFinancialField('kpi_metrics', 'program_ratio', parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0.74"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Admin Ratio</label>
              <input
                type="number"
                step="0.01"
                value={data.pro_forma_financials?.kpi_metrics?.value?.admin_ratio || 0}
                onChange={(e) => updateNestedFinancialField('kpi_metrics', 'admin_ratio', parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0.11"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fundraising Efficiency</label>
              <input
                type="number"
                step="0.01"
                value={data.pro_forma_financials?.kpi_metrics?.value?.fundraising_efficiency || 0}
                onChange={(e) => updateNestedFinancialField('kpi_metrics', 'fundraising_efficiency', parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0.06"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cash Reserve (Months)</label>
              <input
                type="number"
                step="0.1"
                value={data.pro_forma_financials?.kpi_metrics?.value?.cash_reserve_months || 0}
                onChange={(e) => updateNestedFinancialField('kpi_metrics', 'cash_reserve_months', parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="6.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Base Case</label>
            <textarea
              value={data.pro_forma_financials?.scenario_analysis?.value?.base_case || ''}
              onChange={(e) => updateNestedFinancialField('scenario_analysis', 'base_case', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              placeholder="Growth at 10% with stable donor retention, investorgroth and grant renewals."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Worst Case</label>
            <textarea
              value={data.pro_forma_financials?.scenario_analysis?.value?.worst_case || ''}
              onChange={(e) => updateNestedFinancialField('scenario_analysis', 'worst_case', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              placeholder="5% growth, 70% donor retention, no new grant funding."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Best Case</label>
            <textarea
              value={data.pro_forma_financials?.scenario_analysis?.value?.best_case || ''}
              onChange={(e) => updateNestedFinancialField('scenario_analysis', 'best_case', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              placeholder="15% growth, 95% donor retention, major new foundation partner."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
