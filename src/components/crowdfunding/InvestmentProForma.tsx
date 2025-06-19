import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  PieChart,
  AlertTriangle
} from 'lucide-react';
import { Ministry } from '@/types/Crowdfunding';

interface InvestmentProFormaProps {
  ministry: Ministry;
}

export const InvestmentProForma = ({ ministry }: InvestmentProFormaProps) => {
  // Calculate financial projections
  const estimatedROI = 6.5; // Example ROI
  const projectedAnnualRevenue = ministry.target_amount * 0.15;
  const operatingExpenses = projectedAnnualRevenue * 0.7;
  const netIncome = projectedAnnualRevenue - operatingExpenses;

  const yearlyProjections = [
    { year: 1, revenue: projectedAnnualRevenue * 0.8, expenses: operatingExpenses * 0.75, netIncome: projectedAnnualRevenue * 0.8 - operatingExpenses * 0.75 },
    { year: 2, revenue: projectedAnnualRevenue, expenses: operatingExpenses, netIncome },
    { year: 3, revenue: projectedAnnualRevenue * 1.1, expenses: operatingExpenses * 1.05, netIncome: projectedAnnualRevenue * 1.1 - operatingExpenses * 1.05 },
    { year: 4, revenue: projectedAnnualRevenue * 1.2, expenses: operatingExpenses * 1.1, netIncome: projectedAnnualRevenue * 1.2 - operatingExpenses * 1.1 },
    { year: 5, revenue: projectedAnnualRevenue * 1.3, expenses: operatingExpenses * 1.15, netIncome: projectedAnnualRevenue * 1.3 - operatingExpenses * 1.15 },
  ];

  return (
    <div className="space-y-6">
      {/* Investment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Investment Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">${ministry.target_amount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Target Amount</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">{estimatedROI}%</div>
              <div className="text-sm text-muted-foreground">Expected ROI</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Calendar className="h-6 w-6 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-purple-600">5</div>
              <div className="text-sm text-muted-foreground">Years Term</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto text-orange-600 mb-2" />
              <div className="text-2xl font-bold text-orange-600">${ministry.minimum_investment.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Min Investment</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Projections */}
      <Card>
        <CardHeader>
          <CardTitle>5-Year Financial Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Year</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Expenses</th>
                  <th className="text-right py-2">Net Income</th>
                  <th className="text-right py-2">ROI</th>
                </tr>
              </thead>
              <tbody>
                {yearlyProjections.map((projection) => (
                  <tr key={projection.year} className="border-b">
                    <td className="py-3 font-medium">Year {projection.year}</td>
                    <td className="text-right py-3">${projection.revenue.toLocaleString()}</td>
                    <td className="text-right py-3">${projection.expenses.toLocaleString()}</td>
                    <td className="text-right py-3 font-medium">
                      ${projection.netIncome.toLocaleString()}
                    </td>
                    <td className="text-right py-3">
                      <Badge variant="outline" className="text-green-600">
                        {((projection.netIncome / ministry.target_amount) * 100).toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Use of Funds */}
      <Card>
        <CardHeader>
          <CardTitle>Use of Funds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Ministry Program Development</span>
              <span className="font-medium">40%</span>
            </div>
            <Progress value={40} className="h-2" />
            
            <div className="flex justify-between items-center">
              <span>Facility Improvements</span>
              <span className="font-medium">25%</span>
            </div>
            <Progress value={25} className="h-2" />
            
            <div className="flex justify-between items-center">
              <span>Staff & Training</span>
              <span className="font-medium">20%</span>
            </div>
            <Progress value={20} className="h-2" />
            
            <div className="flex justify-between items-center">
              <span>Equipment & Technology</span>
              <span className="font-medium">10%</span>
            </div>
            <Progress value={10} className="h-2" />
            
            <div className="flex justify-between items-center">
              <span>Administrative & Legal</span>
              <span className="font-medium">5%</span>
            </div>
            <Progress value={5} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            Risk Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 rounded-lg">
              <h4 className="font-medium text-amber-800">Community Engagement Risk</h4>
              <p className="text-sm text-amber-700 mt-1">
                Success depends on community participation and ongoing engagement with ministry programs.
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Funding Timeline Risk</h4>
              <p className="text-sm text-blue-700 mt-1">
                Delays in reaching funding goals may impact program launch timelines.
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800">Operational Risk</h4>
              <p className="text-sm text-purple-700 mt-1">
                Ministry effectiveness depends on successful implementation and ongoing operational management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Returns */}
      <Card>
        <CardHeader>
          <CardTitle>Expected Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Financial Returns</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Annual dividend payments: 4-6%</li>
                <li>• Capital appreciation: 2-4% annually</li>
                <li>• Total expected return: 6-10% over 5 years</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Social Impact Returns</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Direct community benefit through ministry programs</li>
                <li>• Measurable social impact metrics</li>
                <li>• Regular impact reporting and updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
