import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface StrategicPlan {
  plan_metadata: {
    church_name: string;
    plan_date: string;
    author: string;
    version: string;
  };
  executive_summary: string;
  mission_vision_values: {
    mission: string;
    vision: string;
    values: string[];
  };
  community_membership_transformation: {
    current_definition: string;
    redefined_membership_strategy: string;
    engagement_methods: string[];
    community_demographics: string;
    target_outcomes: string;
  };
  economic_sustainability_plan: {
    current_financial_challenges: string;
    proposed_revenue_streams: Array<{
      type: string;
      description: string;
      expected_outcomes: string;
    }>;
    sustainability_measures: string;
  };
  innovative_ministry_development: {
    traditional_ministry_limitations: string;
    proposed_innovations: Array<{
      name: string;
      description: string;
      implementation_steps: string;
      impact: string;
    }>;
  };
  environmental_scan: {
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    external_context: {
      social: string;
      cultural: string;
      economic: string;
      technological: string;
      political_legal: string;
    };
  };
  implementation_timeline: Array<{
    initiative: string;
    timeline: string;
    owner: string;
  }>;
  scenario_planning_risk_mitigation: Array<{
    scenario: string;
    implications: string;
    contingency_strategies: string[];
  }>;
  measurement_evaluation_adjustment: {
    key_performance_indicators: string[];
    monitoring_process: string;
    review_frequency: string;
    adjustment_process: string;
  };
  narrative: {
    mission_vision_values: string;
    community_membership_transformation: string;
    economic_sustainability_plan: string;
    innovative_ministry_development: string;
    environmental_scan: string;
    implementation_timeline: string;
    scenario_planning_risk_mitigation: string;
    measurement_evaluation_adjustment: string;
  };
}

interface StrategicPlanEditorProps {
  plan: StrategicPlan;
  onPlanChange: (plan: StrategicPlan) => void;
}

export function StrategicPlanEditor({ plan, onPlanChange }: StrategicPlanEditorProps) {
  const updatePlan = (updates: Partial<StrategicPlan>) => {
    onPlanChange({ ...plan, ...updates });
  };

  const updateNestedField = (section: keyof StrategicPlan, field: string, value: any) => {
    updatePlan({
      [section]: {
        ...(plan[section] as any),
        [field]: value
      }
    });
  };

  const addArrayItem = (section: keyof StrategicPlan, field: string, item: any) => {
    const currentArray = (plan[section] as any)[field] || [];
    updateNestedField(section, field, [...currentArray, item]);
  };

  const removeArrayItem = (section: keyof StrategicPlan, field: string, index: number) => {
    const currentArray = (plan[section] as any)[field] || [];
    updateNestedField(section, field, currentArray.filter((_: any, i: number) => i !== index));
  };

  const updateArrayItem = (section: keyof StrategicPlan, field: string, index: number, value: any) => {
    const currentArray = (plan[section] as any)[field] || [];
    const updatedArray = [...currentArray];
    updatedArray[index] = value;
    updateNestedField(section, field, updatedArray);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mission">Mission</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="economic">Economic</TabsTrigger>
          <TabsTrigger value="ministry">Ministry</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="implementation">Timeline</TabsTrigger>
          <TabsTrigger value="measurement">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Overview</CardTitle>
              <CardDescription>Basic information about your strategic plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="church_name">Community Name</Label>
                  <Input
                    id="church_name"
                    value={plan.plan_metadata.church_name}
                    onChange={(e) => updateNestedField('plan_metadata', 'church_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="plan_date">Plan Date</Label>
                  <Input
                    id="plan_date"
                    type="date"
                    value={plan.plan_metadata.plan_date}
                    onChange={(e) => updateNestedField('plan_metadata', 'plan_date', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
              <CardDescription>High-level overview of your strategic plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={plan.executive_summary}
                onChange={(e) => updatePlan({ executive_summary: e.target.value })}
                rows={6}
                placeholder="Provide a comprehensive executive summary..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mission" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mission, Vision & Values</CardTitle>
              <CardDescription>Core organizational elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mission">Mission Statement</Label>
                <Textarea
                  id="mission"
                  value={plan.mission_vision_values.mission}
                  onChange={(e) => updateNestedField('mission_vision_values', 'mission', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="vision">Vision Statement</Label>
                <Textarea
                  id="vision"
                  value={plan.mission_vision_values.vision}
                  onChange={(e) => updateNestedField('mission_vision_values', 'vision', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Core Values</Label>
                {plan.mission_vision_values.values.map((value, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={value}
                      onChange={(e) => updateArrayItem('mission_vision_values', 'values', index, e.target.value)}
                      placeholder="Enter a core value"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('mission_vision_values', 'values', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('mission_vision_values', 'values', '')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Value
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mission & Vision Narrative</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={plan.narrative.mission_vision_values}
                onChange={(e) => updateNestedField('narrative', 'mission_vision_values', e.target.value)}
                rows={4}
                placeholder="Detailed explanation of mission and vision..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Community & Membership Transformation</CardTitle>
              <CardDescription>Strategies for community engagement and membership</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current_definition">Current Membership Definition</Label>
                <Textarea
                  id="current_definition"
                  value={plan.community_membership_transformation.current_definition}
                  onChange={(e) => updateNestedField('community_membership_transformation', 'current_definition', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="redefined_strategy">Redefined Membership Strategy</Label>
                <Textarea
                  id="redefined_strategy"
                  value={plan.community_membership_transformation.redefined_membership_strategy}
                  onChange={(e) => updateNestedField('community_membership_transformation', 'redefined_membership_strategy', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Engagement Methods</Label>
                {plan.community_membership_transformation.engagement_methods.map((method, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={method}
                      onChange={(e) => updateArrayItem('community_membership_transformation', 'engagement_methods', index, e.target.value)}
                      placeholder="Enter engagement method"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('community_membership_transformation', 'engagement_methods', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('community_membership_transformation', 'engagement_methods', '')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Economic Sustainability Plan</CardTitle>
              <CardDescription>Financial planning and revenue strategies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="financial_challenges">Current Financial Challenges</Label>
                <Textarea
                  id="financial_challenges"
                  value={plan.economic_sustainability_plan.current_financial_challenges}
                  onChange={(e) => updateNestedField('economic_sustainability_plan', 'current_financial_challenges', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Proposed Revenue Streams</Label>
                {plan.economic_sustainability_plan.proposed_revenue_streams.map((stream, index) => (
                  <Card key={index} className="p-4 mb-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Revenue Stream {index + 1}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('economic_sustainability_plan', 'proposed_revenue_streams', index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Type"
                        value={stream.type}
                        onChange={(e) => {
                          const updated = [...plan.economic_sustainability_plan.proposed_revenue_streams];
                          updated[index] = { ...updated[index], type: e.target.value };
                          updateNestedField('economic_sustainability_plan', 'proposed_revenue_streams', updated);
                        }}
                      />
                      <Textarea
                        placeholder="Description"
                        value={stream.description}
                        onChange={(e) => {
                          const updated = [...plan.economic_sustainability_plan.proposed_revenue_streams];
                          updated[index] = { ...updated[index], description: e.target.value };
                          updateNestedField('economic_sustainability_plan', 'proposed_revenue_streams', updated);
                        }}
                        rows={2}
                      />
                      <Textarea
                        placeholder="Expected Outcomes"
                        value={stream.expected_outcomes}
                        onChange={(e) => {
                          const updated = [...plan.economic_sustainability_plan.proposed_revenue_streams];
                          updated[index] = { ...updated[index], expected_outcomes: e.target.value };
                          updateNestedField('economic_sustainability_plan', 'proposed_revenue_streams', updated);
                        }}
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('economic_sustainability_plan', 'proposed_revenue_streams', {
                    type: '',
                    description: '',
                    expected_outcomes: ''
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Revenue Stream
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ministry" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Innovative Ministry Development</CardTitle>
              <CardDescription>New approaches to ministry and innovation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ministry_limitations">Traditional Ministry Limitations</Label>
                <Textarea
                  id="ministry_limitations"
                  value={plan.innovative_ministry_development.traditional_ministry_limitations}
                  onChange={(e) => updateNestedField('innovative_ministry_development', 'traditional_ministry_limitations', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Proposed Innovations</Label>
                {plan.innovative_ministry_development.proposed_innovations.map((innovation, index) => (
                  <Card key={index} className="p-4 mb-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Innovation {index + 1}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem('innovative_ministry_development', 'proposed_innovations', index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Name"
                        value={innovation.name}
                        onChange={(e) => {
                          const updated = [...plan.innovative_ministry_development.proposed_innovations];
                          updated[index] = { ...updated[index], name: e.target.value };
                          updateNestedField('innovative_ministry_development', 'proposed_innovations', updated);
                        }}
                      />
                      <Textarea
                        placeholder="Description"
                        value={innovation.description}
                        onChange={(e) => {
                          const updated = [...plan.innovative_ministry_development.proposed_innovations];
                          updated[index] = { ...updated[index], description: e.target.value };
                          updateNestedField('innovative_ministry_development', 'proposed_innovations', updated);
                        }}
                        rows={2}
                      />
                      <Textarea
                        placeholder="Implementation Steps"
                        value={innovation.implementation_steps}
                        onChange={(e) => {
                          const updated = [...plan.innovative_ministry_development.proposed_innovations];
                          updated[index] = { ...updated[index], implementation_steps: e.target.value };
                          updateNestedField('innovative_ministry_development', 'proposed_innovations', updated);
                        }}
                        rows={2}
                      />
                      <Textarea
                        placeholder="Expected Impact"
                        value={innovation.impact}
                        onChange={(e) => {
                          const updated = [...plan.innovative_ministry_development.proposed_innovations];
                          updated[index] = { ...updated[index], impact: e.target.value };
                          updateNestedField('innovative_ministry_development', 'proposed_innovations', updated);
                        }}
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('innovative_ministry_development', 'proposed_innovations', {
                    name: '',
                    description: '',
                    implementation_steps: '',
                    impact: ''
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Innovation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Environmental Scan</CardTitle>
              <CardDescription>SWOT analysis and external context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Strengths</Label>
                  {plan.environmental_scan.swot.strengths.map((strength, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={strength}
                        onChange={(e) => updateArrayItem('environmental_scan', 'swot', index, {
                          ...plan.environmental_scan.swot,
                          strengths: plan.environmental_scan.swot.strengths.map((s, i) => i === index ? e.target.value : s)
                        })}
                        placeholder="Enter strength"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updated = plan.environmental_scan.swot.strengths.filter((_, i) => i !== index);
                          updateNestedField('environmental_scan', 'swot', {
                            ...plan.environmental_scan.swot,
                            strengths: updated
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateNestedField('environmental_scan', 'swot', {
                        ...plan.environmental_scan.swot,
                        strengths: [...plan.environmental_scan.swot.strengths, '']
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Strength
                  </Button>
                </div>
                <div>
                  <Label>Weaknesses</Label>
                  {plan.environmental_scan.swot.weaknesses.map((weakness, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={weakness}
                        onChange={(e) => {
                          const updated = plan.environmental_scan.swot.weaknesses.map((w, i) => i === index ? e.target.value : w);
                          updateNestedField('environmental_scan', 'swot', {
                            ...plan.environmental_scan.swot,
                            weaknesses: updated
                          });
                        }}
                        placeholder="Enter weakness"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updated = plan.environmental_scan.swot.weaknesses.filter((_, i) => i !== index);
                          updateNestedField('environmental_scan', 'swot', {
                            ...plan.environmental_scan.swot,
                            weaknesses: updated
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateNestedField('environmental_scan', 'swot', {
                        ...plan.environmental_scan.swot,
                        weaknesses: [...plan.environmental_scan.swot.weaknesses, '']
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Weakness
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Timeline</CardTitle>
              <CardDescription>Actionable steps with timelines and ownership</CardDescription>
            </CardHeader>
            <CardContent>
              {plan.implementation_timeline.map((item, index) => (
                <Card key={index} className="p-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Initiative {index + 1}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('implementation_timeline', '', index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Initiative"
                      value={item.initiative}
                      onChange={(e) => updateArrayItem('implementation_timeline', '', index, {
                        ...item,
                        initiative: e.target.value
                      })}
                    />
                    <Input
                      placeholder="Timeline"
                      value={item.timeline}
                      onChange={(e) => updateArrayItem('implementation_timeline', '', index, {
                        ...item,
                        timeline: e.target.value
                      })}
                    />
                    <Input
                      placeholder="Owner"
                      value={item.owner}
                      onChange={(e) => updateArrayItem('implementation_timeline', '', index, {
                        ...item,
                        owner: e.target.value
                      })}
                    />
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addArrayItem('implementation_timeline', '', {
                  initiative: '',
                  timeline: '',
                  owner: ''
                })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Initiative
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Measurement, Evaluation & Adjustment</CardTitle>
              <CardDescription>KPIs, monitoring, and adjustment processes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Key Performance Indicators</Label>
                {plan.measurement_evaluation_adjustment.key_performance_indicators.map((kpi, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={kpi}
                      onChange={(e) => updateArrayItem('measurement_evaluation_adjustment', 'key_performance_indicators', index, e.target.value)}
                      placeholder="Enter KPI"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('measurement_evaluation_adjustment', 'key_performance_indicators', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('measurement_evaluation_adjustment', 'key_performance_indicators', '')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add KPI
                </Button>
              </div>
              <div>
                <Label htmlFor="monitoring_process">Monitoring Process</Label>
                <Textarea
                  id="monitoring_process"
                  value={plan.measurement_evaluation_adjustment.monitoring_process}
                  onChange={(e) => updateNestedField('measurement_evaluation_adjustment', 'monitoring_process', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="adjustment_process">Adjustment Process</Label>
                <Textarea
                  id="adjustment_process"
                  value={plan.measurement_evaluation_adjustment.adjustment_process}
                  onChange={(e) => updateNestedField('measurement_evaluation_adjustment', 'adjustment_process', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
