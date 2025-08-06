import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image,
  Font,
  pdf
} from '@react-pdf/renderer';

// Register fonts for better typography
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2', fontWeight: 'bold' }
  ]
});

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 1.5,
  },
  
  // Header styles
  header: {
    marginBottom: 30,
    textAlign: 'center',
    borderBottom: '2 solid #E5E7EB',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  
  // Logo and branding
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  
  // Section styles
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    borderBottom: '1 solid #E5E7EB',
    paddingBottom: 4,
  },
  sectionContent: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  
  // Financial table styles
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 15,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#F9FAFB',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    fontSize: 10,
  },
  tableCellHeader: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tableCellData: {
    flex: 1,
  },
  
  // Image styles
  imageContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  communityImage: {
    width: '100%',
    maxWidth: 400,
    height: 200,
    objectFit: 'cover',
    borderRadius: 8,
  },
  
  // List styles
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletText: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
    marginLeft: 8,
  },
  bullet: {
    fontSize: 11,
    color: '#6B7280',
    width: 8,
  },
  
  // Highlight boxes
  highlightBox: {
    backgroundColor: '#EFF6FF',
    border: '1 solid #DBEAFE',
    borderRadius: 6,
    padding: 12,
    marginVertical: 10,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 10,
    color: '#1E3A8A',
    lineHeight: 1.4,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#6B7280',
    borderTop: '1 solid #E5E7EB',
    paddingTop: 10,
  },
  
  // Two column layout
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
  
  // Financial metrics
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
  },
});

interface ProspectusSection {
  id: string;
  type: 'text' | 'image' | 'chart' | 'header' | 'financial_table';
  title: string;
  content: string;
  imageUrl?: string;
  order: number;
}

interface ProspectusData {
  title: string;
  subtitle: string;
  sections: ProspectusSection[];
  logos: string[];
  communityPhotos: string[];
  campaignData?: any;
}

interface ProspectusPDFProps {
  data: ProspectusData;
}

// Component to render financial table
const FinancialTable: React.FC<{ data: any }> = ({ data }) => (
  <View style={styles.table}>
    <View style={styles.tableRow}>
      <View style={[styles.tableHeader, styles.tableCellHeader]}>
        <Text>Financial Metric</Text>
      </View>
      <View style={[styles.tableHeader, styles.tableCellHeader]}>
        <Text>Amount</Text>
      </View>
    </View>
    
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, styles.tableCellData]}>
        <Text>Target Amount</Text>
      </View>
      <View style={[styles.tableCell, styles.tableCellData]}>
        <Text>${data?.target_amount?.toLocaleString() || 'N/A'}</Text>
      </View>
    </View>
    
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, styles.tableCellData]}>
        <Text>Minimum Investment</Text>
      </View>
      <View style={[styles.tableCell, styles.tableCellData]}>
        <Text>${data?.minimum_investment?.toLocaleString() || 'N/A'}</Text>
      </View>
    </View>
    
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, styles.tableCellData]}>
        <Text>Campaign Duration</Text>
      </View>
      <View style={[styles.tableCell, styles.tableCellData]}>
        <Text>90 days</Text>
      </View>
    </View>
  </View>
);

// Component to render bullet points
const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <View>
    {items.map((item, index) => (
      <View key={index} style={styles.bulletPoint}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);

// Main PDF Document Component
const ProspectusPDF: React.FC<ProspectusPDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with Logo */}
      <View style={styles.header}>
        {data.logos.length > 0 && (
          <View style={styles.logoContainer}>
            <Image style={styles.logo} src={data.logos[0]} />
          </View>
        )}
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.subtitle}>{data.subtitle}</Text>
      </View>

      {/* Dynamic Sections */}
      {data.sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          
          {section.type === 'text' && (
            <Text style={styles.sectionContent}>{section.content}</Text>
          )}
          
          {section.type === 'image' && section.imageUrl && (
            <View style={styles.imageContainer}>
              <Image style={styles.communityImage} src={section.imageUrl} />
            </View>
          )}
          
          {section.type === 'financial_table' && (
            <FinancialTable data={data.campaignData} />
          )}
          
          {section.type === 'header' && (
            <View style={styles.highlightBox}>
              <Text style={styles.highlightTitle}>{section.title}</Text>
              <Text style={styles.highlightText}>{section.content}</Text>
            </View>
          )}
        </View>
      ))}

      {/* Financial Summary Section */}
      {data.campaignData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Summary</Text>
          <View style={styles.highlightBox}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Target Funding:</Text>
              <Text style={styles.metricValue}>
                ${data.campaignData.target_amount?.toLocaleString() || 'N/A'}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Minimum Investment:</Text>
              <Text style={styles.metricValue}>
                ${data.campaignData.minimum_investment?.toLocaleString() || 'N/A'}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Expected ROI:</Text>
              <Text style={styles.metricValue}>Community Impact + Spiritual Growth</Text>
            </View>
          </View>
        </View>
      )}

      {/* Community Photos Section */}
      {data.communityPhotos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Impact</Text>
          <View style={styles.imageContainer}>
            <Image style={styles.communityImage} src={data.communityPhotos[0]} />
          </View>
          <Text style={styles.sectionContent}>
            Visual representation of our community outreach and the lives we're impacting 
            through this ministry initiative.
          </Text>
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        This prospectus contains forward-looking statements. Past performance does not guarantee future results. 
        Please read all risk factors carefully before investing.
      </Text>
    </Page>

    {/* Additional pages for longer content */}
    {data.sections.length > 8 && (
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Additional Information</Text>
        </View>
        
        {data.sections.slice(8).map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
        
        <Text style={styles.footer}>
          Page 2 - {data.title}
        </Text>
      </Page>
    )}
  </Document>
);

// Export function to generate and download PDF
export const generateProspectusPDF = async (data: ProspectusData): Promise<Blob> => {
  const doc = <ProspectusPDF data={data} />;
  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();
  return blob;
};

// Function to download PDF
export const downloadProspectusPDF = async (data: ProspectusData, filename?: string) => {
  try {
    const blob = await generateProspectusPDF(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${data.title.replace(/\s+/g, '_')}_Prospectus.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export default ProspectusPDF;
