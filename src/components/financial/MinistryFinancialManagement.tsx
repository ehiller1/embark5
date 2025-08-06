import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Plus, Download, TrendingUp, TrendingDown, DollarSign, Target, Users, Star, BarChart3, PieChart
} from 'lucide-react';

// Mock ministry data with pro forma integration
const mockMinistryData = {
  campaigns: [
    {
      id: 1, title: 'Urban Youth Outreach', status: 'active', target_amount: 250000, raised_amount: 78000,
      start_date: '2025-01-15', end_date: '2025-12-31', donors: 45,
      pro_forma: {
        assumptions: { growth_rate: 0.1, donor_retention_rate: 0.85 },
        revenue_projection: [{ year: 2025, donations: 150000, grants: 50000, total_revenue: 200000 }],
        expense_projection: [{ year: 2025, staffing: 90000, program_costs: 70000, total_expenses: 190000 }]
      }
    },
    {
      id: 2, title: 'Community Food Bank', status: 'planning', target_amount: 150000, raised_amount: 25000,
      start_date: '2025-03-01', end_date: '2025-11-30', donors: 18,
      pro_forma: {
        assumptions: { growth_rate: 0.15, donor_retention_rate: 0.90 },
        revenue_projection: [{ year: 2025, donations: 100000, grants: 40000, total_revenue: 140000 }],
        expense_projection: [{ year: 2025, staffing: 60000, program_costs: 50000, total_expenses: 125000 }]
      }
    }
  ],
  transactions: [
    { id: 1, date: '2025-07-01', description: 'Major Donor Gift', category: 'Individual Donation', amount: 5000, type: 'income', campaign_id: 1 },
    { id: 2, date: '2025-07-02', description: 'Program Materials', category: 'Program Expenses', amount: 850, type: 'expense', campaign_id: 1 },
    { id: 3, date: '2025-07-03', description: 'Grant Payment', category: 'Foundation Grant', amount: 15000, type: 'income', campaign_id: 1 },
    { id: 4, date: '2025-07-04', description: 'Staff Training', category: 'Professional Development', amount: 1200, type: 'expense', campaign_id: 1 }
  ],
  donors: [
    { id: 1, name: 'John & Mary Smith', total_donated: 15000, last_donation: '2025-07-01', frequency: 'monthly', campaigns: [1, 2] },
    { id: 2, name: 'Grace Foundation', total_donated: 25000, last_donation: '2025-06-15', frequency: 'quarterly', campaigns: [1] }
  ]
};

const ministryIncomeCategories = ['Individual Donation', 'Foundation Grant', 'Corporate Sponsorship', 'Fundraising Events', 'Online Donations', 'Other'];
const ministryExpenseCategories = ['Program Expenses', 'Staff Salaries', 'Professional Development', 'Marketing & Outreach', 'Technology', 'Other'];

interface MinistryFinancialManagementProps {
  onBack?: () => void;
}

const MinistryFinancialManagement: React.FC<MinistryFinancialManagementProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(1);
  const [ministryData, setMinistryData] = useState(mockMinistryData);
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false);
  const [showCampaignDetailsDialog, setShowCampaignDetailsDialog] = useState(false);
  const [detailsCampaignId, setDetailsCampaignId] = useState<number | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '', category: '', amount: '', type: 'expense', campaign_id: selectedCampaign || 1
  });

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  // Calculate metrics
  const totalRaised = ministryData.campaigns.reduce((sum, campaign) => sum + campaign.raised_amount, 0);
  const totalTarget = ministryData.campaigns.reduce((sum, campaign) => sum + campaign.target_amount, 0);
  const activeCampaigns = ministryData.campaigns.filter(c => c.status === 'active').length;
  const selectedCampaignData = ministryData.campaigns.find(c => c.id === selectedCampaign);
  const campaignTransactions = ministryData.transactions.filter(t => t.campaign_id === selectedCampaign);
  const campaignIncome = campaignTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const campaignExpenses = campaignTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const handleSubmitTransaction = () => {
    if (!newTransaction.description || !newTransaction.category || !newTransaction.amount) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    const transaction = { id: ministryData.transactions.length + 1, ...newTransaction, amount };
    setMinistryData(prev => ({ ...prev, transactions: [transaction, ...prev.transactions] }));
    setShowNewTransactionDialog(false);
    setNewTransaction({ date: new Date().toISOString().split('T')[0], description: '', category: '', amount: '', type: 'expense', campaign_id: selectedCampaign || 1 });
    toast({ title: "Success", description: "Transaction added successfully" });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ministry Financial Management</h1>
            <p className="text-gray-600">Track and manage your ministry campaigns and fundraising activities</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => {
          toast({ title: "Export Started", description: "Ministry financial data is being prepared for download" });
          // TODO: Implement actual export functionality
        }}><Download className="h-4 w-4 mr-2" />Export Data</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="donors">Donors/Investors</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRaised)}</div>
                <p className="text-xs text-muted-foreground">{formatPercentage(totalRaised / totalTarget)} of total goal</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{activeCampaigns}</div>
                <p className="text-xs text-muted-foreground">{ministryData.campaigns.length} total campaigns</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{ministryData.donors.length}</div>
                <p className="text-xs text-muted-foreground">Across all campaigns</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Donation</CardTitle>
                <Star className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalRaised / ministryData.donors.length)}</div>
                <p className="text-xs text-muted-foreground">Per donor</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Overview</CardTitle>
              <CardDescription>Current status of all ministry campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ministryData.campaigns.map((campaign) => {
                  const progress = (campaign.raised_amount / campaign.target_amount) * 100;
                  const remaining = campaign.target_amount - campaign.raised_amount;
                  return (
                    <div key={campaign.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{campaign.title}</h3>
                          <p className="text-sm text-muted-foreground">{campaign.start_date} to {campaign.end_date}</p>
                        </div>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>{campaign.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{formatCurrency(campaign.raised_amount)} / {formatCurrency(campaign.target_amount)}</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{progress.toFixed(1)}% funded</span>
                          <span>{formatCurrency(remaining)} remaining</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Donors: {campaign.donors}</span>
                        <Button variant="outline" size="sm" onClick={() => {
                          setDetailsCampaignId(campaign.id);
                          setShowCampaignDetailsDialog(true);
                        }}>View Details</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Campaign Management</h2>
            <Button onClick={() => {
              toast({ title: "Campaign Creation", description: "New campaign creation feature coming soon" });
              // TODO: Implement campaign creation dialog or redirect to campaign wizard
            }}><Plus className="h-4 w-4 mr-2" />New Campaign</Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Select Campaign</CardTitle>
              <CardDescription>Choose a campaign to view detailed financial information</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedCampaign?.toString()} onValueChange={(value) => setSelectedCampaign(parseInt(value))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select a campaign" /></SelectTrigger>
                <SelectContent>
                  {ministryData.campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.title} - {formatCurrency(campaign.raised_amount)} / {formatCurrency(campaign.target_amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          {selectedCampaignData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedCampaignData.title}</CardTitle>
                  <CardDescription>Campaign Financial Overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Target Amount</p>
                      <p className="text-2xl font-bold">{formatCurrency(selectedCampaignData.target_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Raised Amount</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCampaignData.raised_amount)}</p>
                    </div>
                  </div>
                  <Progress value={(selectedCampaignData.raised_amount / selectedCampaignData.target_amount) * 100} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Campaign Income</p>
                      <p className="font-medium text-green-600">{formatCurrency(campaignIncome)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Campaign Expenses</p>
                      <p className="font-medium text-red-600">{formatCurrency(campaignExpenses)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Pro Forma Projections</CardTitle>
                  <CardDescription>Financial forecasts and assumptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCampaignData.pro_forma && (
                    <>
                      <div>
                        <h4 className="font-medium mb-2">Key Assumptions</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Growth Rate: {formatPercentage(selectedCampaignData.pro_forma.assumptions.growth_rate)}</div>
                          <div>Retention: {formatPercentage(selectedCampaignData.pro_forma.assumptions.donor_retention_rate)}</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Revenue Projections</h4>
                        <div className="space-y-2">
                          {selectedCampaignData.pro_forma.revenue_projection.map((year, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{year.year}</span>
                              <span className="font-medium">{formatCurrency(year.total_revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Expense Projections</h4>
                        <div className="space-y-2">
                          {selectedCampaignData.pro_forma.expense_projection.map((year, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{year.year}</span>
                              <span className="font-medium">{formatCurrency(year.total_expenses)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assumptions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Campaign Assumptions</h2>
            <Button onClick={() => {
              toast({ title: "Assumptions Saved", description: "Campaign assumptions have been updated successfully" });
            }}>Save Changes</Button>
          </div>
          
          {selectedCampaignData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Assumptions</CardTitle>
                  <CardDescription>Edit key financial parameters for {selectedCampaignData.title}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="target-amount">Campaign Target Amount</Label>
                    <Input 
                      id="target-amount"
                      type="number" 
                      value={selectedCampaignData.target_amount}
                      onChange={(e) => {
                        const newAmount = parseInt(e.target.value) || 0;
                        setMinistryData(prev => ({
                          ...prev,
                          campaigns: prev.campaigns.map(c => 
                            c.id === selectedCampaign ? { ...c, target_amount: newAmount } : c
                          )
                        }));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="growth-rate">Expected Growth Rate (%)</Label>
                    <Input 
                      id="growth-rate"
                      type="number" 
                      step="0.01"
                      value={(selectedCampaignData.pro_forma.assumptions.growth_rate * 100).toFixed(2)}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value) / 100 || 0;
                        setMinistryData(prev => ({
                          ...prev,
                          campaigns: prev.campaigns.map(c => 
                            c.id === selectedCampaign ? {
                              ...c,
                              pro_forma: {
                                ...c.pro_forma,
                                assumptions: { ...c.pro_forma.assumptions, growth_rate: newRate }
                              }
                            } : c
                          )
                        }));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retention-rate">Donor Retention Rate (%)</Label>
                    <Input 
                      id="retention-rate"
                      type="number" 
                      step="0.01"
                      value={(selectedCampaignData.pro_forma.assumptions.donor_retention_rate * 100).toFixed(2)}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value) / 100 || 0;
                        setMinistryData(prev => ({
                          ...prev,
                          campaigns: prev.campaigns.map(c => 
                            c.id === selectedCampaign ? {
                              ...c,
                              pro_forma: {
                                ...c.pro_forma,
                                assumptions: { ...c.pro_forma.assumptions, donor_retention_rate: newRate }
                              }
                            } : c
                          )
                        }));
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Projections</CardTitle>
                  <CardDescription>Adjust expected revenue streams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCampaignData.pro_forma.revenue_projection.map((year, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold">Year {year.year}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`donations-${index}`}>Donations</Label>
                          <Input 
                            id={`donations-${index}`}
                            type="number" 
                            value={year.donations}
                            onChange={(e) => {
                              const newDonations = parseInt(e.target.value) || 0;
                              setMinistryData(prev => ({
                                ...prev,
                                campaigns: prev.campaigns.map(c => 
                                  c.id === selectedCampaign ? {
                                    ...c,
                                    pro_forma: {
                                      ...c.pro_forma,
                                      revenue_projection: c.pro_forma.revenue_projection.map((r, i) => 
                                        i === index ? { ...r, donations: newDonations, total_revenue: newDonations + r.grants } : r
                                      )
                                    }
                                  } : c
                                )
                              }));
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`grants-${index}`}>Grants</Label>
                          <Input 
                            id={`grants-${index}`}
                            type="number" 
                            value={year.grants}
                            onChange={(e) => {
                              const newGrants = parseInt(e.target.value) || 0;
                              setMinistryData(prev => ({
                                ...prev,
                                campaigns: prev.campaigns.map(c => 
                                  c.id === selectedCampaign ? {
                                    ...c,
                                    pro_forma: {
                                      ...c.pro_forma,
                                      revenue_projection: c.pro_forma.revenue_projection.map((r, i) => 
                                        i === index ? { ...r, grants: newGrants, total_revenue: r.donations + newGrants } : r
                                      )
                                    }
                                  } : c
                                )
                              }));
                            }}
                          />
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between font-semibold">
                          <span>Total Revenue:</span>
                          <span>{formatCurrency(year.total_revenue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
          
          {!selectedCampaignData && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Please select a campaign from the Campaigns tab to edit assumptions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Transaction Management</h2>
            <Dialog open={showNewTransactionDialog} onOpenChange={setShowNewTransactionDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Transaction</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                  <DialogDescription>Record a new income or expense transaction</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Campaign</Label>
                    <div className="col-span-3">
                      <Select value={newTransaction.campaign_id.toString()} onValueChange={(value) => setNewTransaction({ ...newTransaction, campaign_id: parseInt(value) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ministryData.campaigns.map(campaign => <SelectItem key={campaign.id} value={campaign.id.toString()}>{campaign.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Type</Label>
                    <div className="col-span-3">
                      <Select value={newTransaction.type} onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Category</Label>
                    <div className="col-span-3">
                      <Select value={newTransaction.category} onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {(newTransaction.type === 'income' ? ministryIncomeCategories : ministryExpenseCategories).map(cat => 
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Description</Label>
                    <Input className="col-span-3" value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Amount</Label>
                    <Input type="number" step="0.01" min="0" className="col-span-3" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Date</Label>
                    <Input type="date" className="col-span-3" value={newTransaction.date} onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewTransactionDialog(false)}>Cancel</Button>
                  <Button onClick={handleSubmitTransaction}>Save Transaction</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ministryData.transactions.map((transaction) => {
                    const campaign = ministryData.campaigns.find(c => c.id === transaction.campaign_id);
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{campaign?.title}</TableCell>
                        <TableCell className="font-medium">{transaction.description}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell><Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>{transaction.type}</Badge></TableCell>
                        <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donors" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Donor Management</h2>
            <Button onClick={() => {
              toast({ title: "Donor Management", description: "Add donor feature coming soon" });
              // TODO: Implement donor creation dialog
            }}><Plus className="h-4 w-4 mr-2" />Add Donor</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ministryData.donors.map((donor) => (
              <Card key={donor.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {donor.name}
                    <Badge>{donor.frequency}</Badge>
                  </CardTitle>
                  <CardDescription>Total Donated: {formatCurrency(donor.total_donated)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Donation</span>
                      <span>{donor.last_donation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Campaigns</span>
                      <span>{donor.campaigns.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <h2 className="text-2xl font-bold">Financial Forecasting</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Revenue Forecast</span>
                </CardTitle>
                <CardDescription>Projected income based on current trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{formatCurrency(totalRaised * 1.2)}</div>
                    <p className="text-sm text-muted-foreground">Projected 12-month revenue</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Monthly Avg</span>
                      <span>{formatCurrency(totalRaised / 6)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Projected Growth</span>
                      <span className="text-green-600">+20%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  <span>Expense Forecast</span>
                </CardTitle>
                <CardDescription>Projected expenses and budget allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{formatCurrency(campaignExpenses * 1.15)}</div>
                    <p className="text-sm text-muted-foreground">Projected 12-month expenses</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Monthly Avg</span>
                      <span>{formatCurrency(campaignExpenses / 6)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Projected Growth</span>
                      <span className="text-red-600">+15%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-2xl font-bold">Financial Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Donor Retention Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">85%</div>
                <p className="text-sm text-muted-foreground">Average across all campaigns</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cost Per Dollar Raised</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">$0.15</div>
                <p className="text-sm text-muted-foreground">Fundraising efficiency</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Campaign Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">75%</div>
                <p className="text-sm text-muted-foreground">Campaigns meeting goals</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Campaign Details Modal */}
      <Dialog open={showCampaignDetailsDialog} onOpenChange={setShowCampaignDetailsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Details</DialogTitle>
            <DialogDescription>
              {detailsCampaignId && ministryData.campaigns.find(c => c.id === detailsCampaignId)?.title}
            </DialogDescription>
          </DialogHeader>
          {detailsCampaignId && (() => {
            const campaign = ministryData.campaigns.find(c => c.id === detailsCampaignId);
            if (!campaign) return null;
            
            const progress = (campaign.raised_amount / campaign.target_amount) * 100;
            const remaining = campaign.target_amount - campaign.raised_amount;
            const campaignTransactions = ministryData.transactions.filter(t => t.campaign_id === campaign.id);
            const campaignIncome = campaignTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const campaignExpenses = campaignTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            
            return (
              <div className="space-y-6">
                {/* Campaign Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Donors</h4>
                    <p className="text-lg font-semibold">{campaign.donors}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Start Date</h4>
                    <p className="text-sm">{new Date(campaign.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">End Date</h4>
                    <p className="text-sm">{new Date(campaign.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {/* Financial Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Financial Progress</h4>
                    <span className="text-sm text-muted-foreground">{progress.toFixed(1)}% funded</span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-3" />
                  <div className="flex justify-between text-sm">
                    <span>Raised: {formatCurrency(campaign.raised_amount)}</span>
                    <span>Target: {formatCurrency(campaign.target_amount)}</span>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    {remaining > 0 ? `${formatCurrency(remaining)} remaining` : 'Goal exceeded!'}
                  </div>
                </div>
                
                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-green-600">{formatCurrency(campaignIncome)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-red-600">{formatCurrency(campaignExpenses)}</div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Pro Forma Data */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Financial Assumptions</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Growth Rate:</span>
                      <span className="ml-2 font-medium">{formatPercentage(campaign.pro_forma.assumptions.growth_rate)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Donor Retention:</span>
                      <span className="ml-2 font-medium">{formatPercentage(campaign.pro_forma.assumptions.donor_retention_rate)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Recent Transactions */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Recent Transactions</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {campaignTransactions.slice(0, 5).map(transaction => (
                      <div key={transaction.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-muted-foreground text-xs">{transaction.category}</div>
                        </div>
                        <div className={`font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    ))}
                    {campaignTransactions.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-4">No transactions recorded</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowCampaignDetailsDialog(false);
              setActiveTab('assumptions');
              if (detailsCampaignId) {
                setSelectedCampaign(detailsCampaignId);
              }
            }}>
              Edit Assumptions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinistryFinancialManagement;
