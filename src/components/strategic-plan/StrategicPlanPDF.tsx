import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#059669',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    borderBottom: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 5,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    marginTop: 15,
  },
  text: {
    fontSize: 11,
    color: '#4B5563',
    marginBottom: 8,
    textAlign: 'justify',
  },
  bulletPoint: {
    fontSize: 11,
    color: '#4B5563',
    marginBottom: 4,
    marginLeft: 15,
  },
  table: {
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#F9FAFB',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: '#4B5563',
    paddingHorizontal: 8,
  },
  swotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  swotQuadrant: {
    width: '48%',
    marginBottom: 15,
    marginRight: '2%',
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  swotTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#9CA3AF',
  },
});

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

interface StrategicPlanPDFProps {
  plan: StrategicPlan;
}

export function StrategicPlanPDF({ plan }: StrategicPlanPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Strategic Plan</Text>
          <Text style={styles.subtitle}>{plan.plan_metadata.church_name}</Text>
          <View style={styles.metadata}>
            <Text>Date: {plan.plan_metadata.plan_date}</Text>
            <Text>Version: {plan.plan_metadata.version}</Text>
            <Text>Author: {plan.plan_metadata.author}</Text>
          </View>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.text}>{plan.executive_summary}</Text>
        </View>

        {/* Mission, Vision & Values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mission, Vision & Values</Text>
          
          <Text style={styles.subsectionTitle}>Mission Statement</Text>
          <Text style={styles.text}>{plan.mission_vision_values.mission}</Text>
          
          <Text style={styles.subsectionTitle}>Vision Statement</Text>
          <Text style={styles.text}>{plan.mission_vision_values.vision}</Text>
          
          <Text style={styles.subsectionTitle}>Core Values</Text>
          {plan.mission_vision_values.values.map((value, index) => (
            <Text key={index} style={styles.bulletPoint}>• {value}</Text>
          ))}
          
          {plan.narrative.mission_vision_values && (
            <>
              <Text style={styles.subsectionTitle}>Narrative</Text>
              <Text style={styles.text}>{plan.narrative.mission_vision_values}</Text>
            </>
          )}
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>

      <Page size="A4" style={styles.page}>
        {/* Community & Membership Transformation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community & Membership Transformation</Text>
          
          <Text style={styles.subsectionTitle}>Current Membership Definition</Text>
          <Text style={styles.text}>{plan.community_membership_transformation.current_definition}</Text>
          
          <Text style={styles.subsectionTitle}>Redefined Membership Strategy</Text>
          <Text style={styles.text}>{plan.community_membership_transformation.redefined_membership_strategy}</Text>
          
          <Text style={styles.subsectionTitle}>Engagement Methods</Text>
          {plan.community_membership_transformation.engagement_methods.map((method, index) => (
            <Text key={index} style={styles.bulletPoint}>• {method}</Text>
          ))}
          
          <Text style={styles.subsectionTitle}>Community Demographics</Text>
          <Text style={styles.text}>{plan.community_membership_transformation.community_demographics}</Text>
          
          <Text style={styles.subsectionTitle}>Target Outcomes</Text>
          <Text style={styles.text}>{plan.community_membership_transformation.target_outcomes}</Text>
          
          {plan.narrative.community_membership_transformation && (
            <>
              <Text style={styles.subsectionTitle}>Narrative</Text>
              <Text style={styles.text}>{plan.narrative.community_membership_transformation}</Text>
            </>
          )}
        </View>

        {/* Economic Sustainability Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Economic Sustainability Plan</Text>
          
          <Text style={styles.subsectionTitle}>Current Financial Challenges</Text>
          <Text style={styles.text}>{plan.economic_sustainability_plan.current_financial_challenges}</Text>
          
          <Text style={styles.subsectionTitle}>Proposed Revenue Streams</Text>
          {plan.economic_sustainability_plan.proposed_revenue_streams.map((stream, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={styles.bulletPoint}>• {stream.type}</Text>
              <Text style={[styles.text, { marginLeft: 25, fontSize: 10 }]}>{stream.description}</Text>
              <Text style={[styles.text, { marginLeft: 25, fontSize: 10, fontStyle: 'italic' }]}>
                Expected Outcomes: {stream.expected_outcomes}
              </Text>
            </View>
          ))}
          
          <Text style={styles.subsectionTitle}>Sustainability Measures</Text>
          <Text style={styles.text}>{plan.economic_sustainability_plan.sustainability_measures}</Text>
          
          {plan.narrative.economic_sustainability_plan && (
            <>
              <Text style={styles.subsectionTitle}>Narrative</Text>
              <Text style={styles.text}>{plan.narrative.economic_sustainability_plan}</Text>
            </>
          )}
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>

      <Page size="A4" style={styles.page}>
        {/* Innovative Ministry Development */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Innovative Ministry Development</Text>
          
          <Text style={styles.subsectionTitle}>Traditional Ministry Limitations</Text>
          <Text style={styles.text}>{plan.innovative_ministry_development.traditional_ministry_limitations}</Text>
          
          <Text style={styles.subsectionTitle}>Proposed Innovations</Text>
          {plan.innovative_ministry_development.proposed_innovations.map((innovation, index) => (
            <View key={index} style={{ marginBottom: 15 }}>
              <Text style={styles.bulletPoint}>• {innovation.name}</Text>
              <Text style={[styles.text, { marginLeft: 25, fontSize: 10 }]}>{innovation.description}</Text>
              <Text style={[styles.text, { marginLeft: 25, fontSize: 10 }]}>
                Implementation: {innovation.implementation_steps}
              </Text>
              <Text style={[styles.text, { marginLeft: 25, fontSize: 10, fontStyle: 'italic' }]}>
                Impact: {innovation.impact}
              </Text>
            </View>
          ))}
          
          {plan.narrative.innovative_ministry_development && (
            <>
              <Text style={styles.subsectionTitle}>Narrative</Text>
              <Text style={styles.text}>{plan.narrative.innovative_ministry_development}</Text>
            </>
          )}
        </View>

        {/* Environmental Scan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environmental Scan</Text>
          
          <Text style={styles.subsectionTitle}>SWOT Analysis</Text>
          <View style={styles.swotGrid}>
            <View style={styles.swotQuadrant}>
              <Text style={styles.swotTitle}>Strengths</Text>
              {plan.environmental_scan.swot.strengths.map((strength, index) => (
                <Text key={index} style={styles.bulletPoint}>• {strength}</Text>
              ))}
            </View>
            <View style={styles.swotQuadrant}>
              <Text style={styles.swotTitle}>Weaknesses</Text>
              {plan.environmental_scan.swot.weaknesses.map((weakness, index) => (
                <Text key={index} style={styles.bulletPoint}>• {weakness}</Text>
              ))}
            </View>
            <View style={styles.swotQuadrant}>
              <Text style={styles.swotTitle}>Opportunities</Text>
              {plan.environmental_scan.swot.opportunities.map((opportunity, index) => (
                <Text key={index} style={styles.bulletPoint}>• {opportunity}</Text>
              ))}
            </View>
            <View style={styles.swotQuadrant}>
              <Text style={styles.swotTitle}>Threats</Text>
              {plan.environmental_scan.swot.threats.map((threat, index) => (
                <Text key={index} style={styles.bulletPoint}>• {threat}</Text>
              ))}
            </View>
          </View>
          
          <Text style={styles.subsectionTitle}>External Context</Text>
          <Text style={styles.bulletPoint}>• Social: {plan.environmental_scan.external_context.social}</Text>
          <Text style={styles.bulletPoint}>• Cultural: {plan.environmental_scan.external_context.cultural}</Text>
          <Text style={styles.bulletPoint}>• Economic: {plan.environmental_scan.external_context.economic}</Text>
          <Text style={styles.bulletPoint}>• Technological: {plan.environmental_scan.external_context.technological}</Text>
          <Text style={styles.bulletPoint}>• Political/Legal: {plan.environmental_scan.external_context.political_legal}</Text>
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>

      <Page size="A4" style={styles.page}>
        {/* Implementation Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Implementation Timeline</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Initiative</Text>
              <Text style={styles.tableCell}>Timeline</Text>
              <Text style={styles.tableCell}>Owner</Text>
            </View>
            {plan.implementation_timeline.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.initiative}</Text>
                <Text style={styles.tableCell}>{item.timeline}</Text>
                <Text style={styles.tableCell}>{item.owner}</Text>
              </View>
            ))}
          </View>
          
          {plan.narrative.implementation_timeline && (
            <>
              <Text style={styles.subsectionTitle}>Narrative</Text>
              <Text style={styles.text}>{plan.narrative.implementation_timeline}</Text>
            </>
          )}
        </View>

        {/* Scenario Planning & Risk Mitigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario Planning & Risk Mitigation</Text>
          {plan.scenario_planning_risk_mitigation.map((scenario, index) => (
            <View key={index} style={{ marginBottom: 15 }}>
              <Text style={styles.subsectionTitle}>Scenario {index + 1}: {scenario.scenario}</Text>
              <Text style={styles.text}>Implications: {scenario.implications}</Text>
              <Text style={styles.subsectionTitle}>Contingency Strategies:</Text>
              {scenario.contingency_strategies.map((strategy, strategyIndex) => (
                <Text key={strategyIndex} style={styles.bulletPoint}>• {strategy}</Text>
              ))}
            </View>
          ))}
          
          {plan.narrative.scenario_planning_risk_mitigation && (
            <>
              <Text style={styles.subsectionTitle}>Narrative</Text>
              <Text style={styles.text}>{plan.narrative.scenario_planning_risk_mitigation}</Text>
            </>
          )}
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>

      <Page size="A4" style={styles.page}>
        {/* Measurement, Evaluation & Adjustment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurement, Evaluation & Adjustment</Text>
          
          <Text style={styles.subsectionTitle}>Key Performance Indicators</Text>
          {plan.measurement_evaluation_adjustment.key_performance_indicators.map((kpi, index) => (
            <Text key={index} style={styles.bulletPoint}>• {kpi}</Text>
          ))}
          
          <Text style={styles.subsectionTitle}>Monitoring Process</Text>
          <Text style={styles.text}>{plan.measurement_evaluation_adjustment.monitoring_process}</Text>
          
          <Text style={styles.subsectionTitle}>Review Frequency</Text>
          <Text style={styles.text}>{plan.measurement_evaluation_adjustment.review_frequency}</Text>
          
          <Text style={styles.subsectionTitle}>Adjustment Process</Text>
          <Text style={styles.text}>{plan.measurement_evaluation_adjustment.adjustment_process}</Text>
          
          {plan.narrative.measurement_evaluation_adjustment && (
            <>
              <Text style={styles.subsectionTitle}>Narrative</Text>
              <Text style={styles.text}>{plan.narrative.measurement_evaluation_adjustment}</Text>
            </>
          )}
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
}
