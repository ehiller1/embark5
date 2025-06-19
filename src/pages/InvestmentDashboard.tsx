import { MainLayout } from '@/components/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const InvestmentDashboard = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Investor Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">This is a placeholder for the investor dashboard. Display investments, returns, and other relevant info here.</p>
            {/* Add more dashboard content here as needed */}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default InvestmentDashboard;
