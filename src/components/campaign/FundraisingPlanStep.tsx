import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { JustifiedField, JustifiedArrayField } from './JustifiedField';
import { CampaignData, MarketingStrategy, RiskAssessment, ComplianceItem } from '@/types/campaign';

interface FundraisingPlanStepProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
}

export const FundraisingPlanStep: React.FC<FundraisingPlanStepProps> = ({
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

  const updateNestedField = (field: keyof CampaignData, subfield: string, value: any) => {
    const currentValue = data[field]?.value || {};
    onUpdate({
      [field]: {
        value: {
          ...currentValue,
          [subfield]: value,
        },
        justification: data[field]?.justification || '',
      },
    });
  };

  const updateMarketingStrategy = (channel: string, value: any) => {
    const currentStrategy = data.marketing_strategy?.value || {};
    updateField('marketing_strategy', {
      ...currentStrategy,
      [channel]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Fundraising Plan</h2>
        <p className="text-muted-foreground">
          Define your fundraising strategy, marketing approach, and compliance requirements
        </p>
      </div>

      {/* Fundraising Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Fundraising Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JustifiedField
            label="Fundraising Strategy"
            value={data.fundraising_strategy?.value}
            justification={data.fundraising_strategy?.justification || ''}
            onChange={(value) => updateField('fundraising_strategy', value)}
            type="textarea"
            rows={4}
            placeholder="Describe your overall fundraising approach and strategy"
          />

          <JustifiedField
            label="Target Investors"
            value={data.target_investors?.value}
            justification={data.target_investors?.justification || ''}
            onChange={(value) => updateField('target_investors', value)}
            type="textarea"
            rows={3}
            placeholder="Describe your target investor demographics and characteristics"
          />

          <JustifiedField
            label="Investment Terms"
            value={data.investment_terms?.value}
            justification={data.investment_terms?.justification || ''}
            onChange={(value) => updateField('investment_terms', value)}
            type="textarea"
            rows={3}
            placeholder="Outline the terms and conditions for investments"
          />
        </CardContent>
      </Card>

      {/* Marketing Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Marketing Channels</h4>
            </div>
            {Object.entries(data.marketing_strategy?.value || {}).map(([channel, strategy]) => (
              <div key={channel} className="space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={channel}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Channel name"
                    readOnly
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newStrategy = { ...data.marketing_strategy?.value };
                      delete newStrategy[channel];
                      updateField('marketing_strategy', newStrategy);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <textarea
                  value={typeof strategy === 'string' ? strategy : strategy?.description || ''}
                  onChange={(e) => updateMarketingStrategy(channel, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Describe the strategy for this channel"
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateMarketingStrategy('New Channel', '')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Marketing Channel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JustifiedArrayField
            label="Risk Factors"
            items={data.risk_assessment?.value || []}
            justification={data.risk_assessment?.justification || ''}
            onItemsChange={(items) => updateField('risk_assessment', items)}
            addButtonText="Add Risk Factor"
            onAddItem={() => ({ category: '', description: '', mitigation: '', likelihood: 'medium', impact: 'medium' })}
            renderItem={(risk: RiskAssessment, index, onUpdate, onRemove) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Risk Factor {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <input
                      type="text"
                      value={risk.category}
                      onChange={(e) => onUpdate({ ...risk, category: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Financial, Operational, Market"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={risk.description}
                      onChange={(e) => onUpdate({ ...risk, description: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder="Describe the risk factor"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mitigation Strategy</label>
                    <textarea
                      value={risk.mitigation}
                      onChange={(e) => onUpdate({ ...risk, mitigation: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder="How will this risk be mitigated?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Likelihood</label>
                      <select
                        value={risk.likelihood}
                        onChange={(e) => onUpdate({ ...risk, likelihood: e.target.value as 'low' | 'medium' | 'high' })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Impact</label>
                      <select
                        value={risk.impact}
                        onChange={(e) => onUpdate({ ...risk, impact: e.target.value as 'low' | 'medium' | 'high' })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          />
        </CardContent>
      </Card>

      {/* Compliance Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JustifiedField
            label="Regulatory Framework"
            value={data.regulatory_framework?.value}
            justification={data.regulatory_framework?.justification || ''}
            onChange={(value) => updateField('regulatory_framework', value)}
            type="textarea"
            rows={3}
            placeholder="Describe the regulatory framework and requirements"
          />

          <JustifiedArrayField
            label="Compliance Items"
            items={data.compliance_requirements?.value || []}
            justification={data.compliance_requirements?.justification || ''}
            onItemsChange={(items) => updateField('compliance_requirements', items)}
            addButtonText="Add Compliance Item"
            onAddItem={() => ({ requirement: '', status: 'pending', description: '', deadline: '' })}
            renderItem={(item: ComplianceItem, index, onUpdate, onRemove) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Compliance Item {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Requirement</label>
                    <input
                      type="text"
                      value={item.requirement}
                      onChange={(e) => onUpdate({ ...item, requirement: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Form D Filing"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={item.status}
                      onChange={(e) => onUpdate({ ...item, status: e.target.value as 'pending' | 'in_progress' | 'completed' })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Deadline</label>
                    <input
                      type="date"
                      value={item.deadline}
                      onChange={(e) => onUpdate({ ...item, deadline: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={item.description}
                      onChange={(e) => onUpdate({ ...item, description: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder="Additional details about this requirement"
                    />
                  </div>
                </div>
              </Card>
            )}
          />
        </CardContent>
      </Card>

      {/* SEC Filings */}
      <Card>
        <CardHeader>
          <CardTitle>SEC Filings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JustifiedField
            label="Filing Type"
            value={data.sec_filings?.value?.filing_type}
            justification={data.sec_filings?.justification || ''}
            onChange={(value) => updateNestedField('sec_filings', 'filing_type', value)}
            placeholder="e.g., Form D, Regulation CF"
          />

          <JustifiedField
            label="Filing Status"
            value={data.sec_filings?.value?.status}
            justification={data.sec_filings?.justification || ''}
            onChange={(value) => updateNestedField('sec_filings', 'status', value)}
            placeholder="e.g., Draft, Filed, Approved"
          />

          <JustifiedField
            label="Filing Date"
            value={data.sec_filings?.value?.filing_date}
            justification={data.sec_filings?.justification || ''}
            onChange={(value) => updateNestedField('sec_filings', 'filing_date', value)}
            type="date"
          />

          <JustifiedField
            label="Document URL"
            value={data.sec_filings?.value?.document_url}
            justification={data.sec_filings?.justification || ''}
            onChange={(value) => updateNestedField('sec_filings', 'document_url', value)}
            type="url"
            placeholder="https://example.com/sec-filing.pdf"
          />
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JustifiedArrayField
            label="Timeline Milestones"
            items={data.timeline?.value || []}
            justification={data.timeline?.justification || ''}
            onItemsChange={(items) => updateField('timeline', items)}
            addButtonText="Add Milestone"
            onAddItem={() => ({ date: '', milestone: '', description: '' })}
            renderItem={(milestone: any, index, onUpdate, onRemove) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Milestone {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date</label>
                    <input
                      type="date"
                      value={milestone.date}
                      onChange={(e) => onUpdate({ ...milestone, date: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Milestone</label>
                    <input
                      type="text"
                      value={milestone.milestone}
                      onChange={(e) => onUpdate({ ...milestone, milestone: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Campaign Launch"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={milestone.description}
                      onChange={(e) => onUpdate({ ...milestone, description: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder="Detailed description of this milestone"
                    />
                  </div>
                </div>
              </Card>
            )}
          />
        </CardContent>
      </Card>

      {/* Exit Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Exit Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JustifiedField
            label="Exit Strategy"
            value={data.exit_strategy?.value}
            justification={data.exit_strategy?.justification || ''}
            onChange={(value) => updateField('exit_strategy', value)}
            type="textarea"
            rows={4}
            placeholder="Describe the exit strategy for investors"
          />

          <JustifiedField
            label="Return Projections"
            value={data.return_projections?.value}
            justification={data.return_projections?.justification || ''}
            onChange={(value) => updateField('return_projections', value)}
            type="textarea"
            rows={3}
            placeholder="Projected returns for investors"
          />
        </CardContent>
      </Card>
    </div>
  );
};
