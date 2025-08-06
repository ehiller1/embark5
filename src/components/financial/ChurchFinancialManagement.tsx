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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Download, 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Building,
  Heart,
  Users,
  Shield,
  PieChart,
  BarChart3
} from 'lucide-react';

// Mock data for church operations
const mockChurchTransactions = [
  { id: 1, date: '2025-07-01', description: 'Sunday Offering', category: 'Tithes & Offerings', amount: 3250.00, type: 'income', fund: 'General Fund' },
  { id: 2, date: '2025-07-02', description: 'Utility Bill', category: 'Facilities', amount: 450.75, type: 'expense', fund: 'General Fund' },
  { id: 3, date: '2025-07-03', description: 'Pastor Salary', category: 'Staff Salaries', amount: 4200.00, type: 'expense', fund: 'General Fund' },
  { id: 4, date: '2025-07-04', description: 'Building Fund Donation', category: 'Special Offerings', amount: 1500.00, type: 'income', fund: 'Building Fund' },
  { id: 5, date: '2025-07-05', description: 'Mission Trip Support', category: 'Missions', amount: 800.00, type: 'expense', fund: 'Mission Fund' },
];

const mockChurchBudget = {
  'General Fund': { budgeted: 45000, actual: 38250 },
  'Building Fund': { budgeted: 15000, actual: 12500 },
  'Mission Fund': { budgeted: 8000, actual: 6800 }
};

const churchFunds = ['General Fund', 'Building Fund', 'Mission Fund', 'Youth Fund', 'Emergency Fund'];
const churchIncomeCategories = ['Tithes & Offerings', 'Special Offerings', 'Building Fund', 'Mission Fund', 'Fundraising Events', 'Other'];
const churchExpenseCategories = ['Staff Salaries', 'Facilities', 'Administration', 'Education & Youth', 'Worship & Music', 'Missions', 'Other'];

interface ChurchFinancialManagementProps {
  onBack?: () => void;
}

const ChurchFinancialManagement: React.FC<ChurchFinancialManagementProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState(mockChurchTransactions);
  const [budget] = useState(mockChurchBudget);
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date(),
    description: '',
    category: '',
    amount: '',
    type: 'expense',
    fund: 'General Fund'
  });

  // Calculate financial metrics
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalIncome - totalExpenses;
  const totalBudgeted = Object.values(budget).reduce((sum, fund) => sum + fund.budgeted, 0);
  const totalActual = Object.values(budget).reduce((sum, fund) => sum + fund.actual, 0);
  const budgetVariance = ((totalActual - totalBudgeted) / totalBudgeted) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleSubmitTransaction = () => {
    if (!newTransaction.description || !newTransaction.category || !newTransaction.amount) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const amount = parseFloat(newTransaction.amount as string);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const transaction = {
      id: transactions.length + 1,
      date: format(newTransaction.date, 'yyyy-MM-dd'),
      description: newTransaction.description,
      category: newTransaction.category,
      amount: amount,
      type: newTransaction.type,
      fund: newTransaction.fund
    };

    setTransactions([transaction, ...transactions]);
    setShowNewTransactionDialog(false);
    setNewTransaction({ date: new Date(), description: '', category: '', amount: '', type: 'expense', fund: 'General Fund' });
    toast({ title: "Success", description: "Transaction added successfully" });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Church Financial Management</h1>
            <p className="text-gray-600">Comprehensive financial oversight for your church operations</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => {
          toast({ title: "Export Started", description: "Financial reports are being prepared for download" });
          // TODO: Implement actual export functionality
        }}>
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="funds">Funds</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netIncome)}
                </div>
                <p className="text-xs text-muted-foreground">{netIncome >= 0 ? 'Surplus' : 'Deficit'} this period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Performance</CardTitle>
                <Target className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${budgetVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {budgetVariance > 0 ? '+' : ''}{budgetVariance.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">vs. budgeted amount</p>
              </CardContent>
            </Card>
          </div>

          {/* Fund Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Fund Overview</CardTitle>
              <CardDescription>Current status of all church funds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(budget).map(([fundName, fundData]) => {
                  const percentage = (fundData.actual / fundData.budgeted) * 100;
                  return (
                    <div key={fundName} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{fundName}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(fundData.actual)} / {formatCurrency(fundData.budgeted)}
                        </span>
                      </div>
                      <Progress value={Math.min(percentage, 100)} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{percentage.toFixed(1)}% of budget</span>
                        <span className={percentage > 100 ? 'text-red-600' : 'text-green-600'}>
                          {percentage > 100 ? 'Over budget' : 'On track'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {transaction.type === 'income' ? 
                          <TrendingUp className="h-4 w-4 text-green-600" /> :
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{transaction.category} • {transaction.fund}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
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
                  <DialogDescription>Enter the details for the new transaction.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="transaction-date" className="text-right">Date</Label>
                    <div className="col-span-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(newTransaction.date, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newTransaction.date}
                            onSelect={(date) => date && setNewTransaction({ ...newTransaction, date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Type</Label>
                    <div className="col-span-3">
                      <Select value={newTransaction.type} onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value })}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Fund</Label>
                    <div className="col-span-3">
                      <Select value={newTransaction.fund} onValueChange={(value) => setNewTransaction({ ...newTransaction, fund: value })}>
                        <SelectTrigger><SelectValue placeholder="Select fund" /></SelectTrigger>
                        <SelectContent>
                          {churchFunds.map(fund => <SelectItem key={fund} value={fund}>{fund}</SelectItem>)}
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
                          {(newTransaction.type === 'income' ? churchIncomeCategories : churchExpenseCategories).map(cat => 
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Description</Label>
                    <Input
                      className="col-span-3"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="col-span-3"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    />
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
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Fund</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.fund}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Budget Management</h2>
            <Button onClick={() => {
              toast({ title: "Budget Creation", description: "Budget creation feature coming soon" });
              // TODO: Implement budget creation dialog
            }}><Plus className="h-4 w-4 mr-2" />Create Budget</Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(budget).map(([fundName, fundData]) => (
              <Card key={fundName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {fundName}
                    <Badge variant={fundData.actual <= fundData.budgeted ? 'default' : 'destructive'}>
                      {((fundData.actual / fundData.budgeted) * 100).toFixed(1)}%
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {formatCurrency(fundData.actual)} of {formatCurrency(fundData.budgeted)} budgeted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={Math.min((fundData.actual / fundData.budgeted) * 100, 100)} className="mb-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Funds Tab */}
        <TabsContent value="funds" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Fund Management</h2>
            <Button onClick={() => {
              toast({ title: "Fund Creation", description: "Fund creation feature coming soon" });
              // TODO: Implement fund creation dialog
            }}><Plus className="h-4 w-4 mr-2" />Create Fund</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {churchFunds.map((fund) => {
              const fundTransactions = transactions.filter(t => t.fund === fund);
              const fundIncome = fundTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
              const fundExpenses = fundTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
              const fundBalance = fundIncome - fundExpenses;

              return (
                <Card key={fund}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="p-2 rounded-full bg-blue-100">
                        {fund === 'General Fund' && <Building className="h-4 w-4 text-blue-600" />}
                        {fund === 'Building Fund' && <Building className="h-4 w-4 text-blue-600" />}
                        {fund === 'Mission Fund' && <Heart className="h-4 w-4 text-blue-600" />}
                        {fund === 'Youth Fund' && <Users className="h-4 w-4 text-blue-600" />}
                        {fund === 'Emergency Fund' && <Shield className="h-4 w-4 text-blue-600" />}
                      </div>
                      <span>{fund}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Balance</span>
                        <span className={`font-medium ${fundBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(fundBalance)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Income</span>
                        <span className="text-green-600">{formatCurrency(fundIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Expenses</span>
                        <span className="text-red-600">{formatCurrency(fundExpenses)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Financial Reports</h2>
            <Button variant="outline" onClick={() => {
              toast({ title: "PDF Export", description: "Generating PDF report..." });
              // TODO: Implement PDF export functionality
            }}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  <span>Income Statement</span>
                </CardTitle>
                <CardDescription>Detailed breakdown of income and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => {
                  toast({ title: "Report Generated", description: "Income statement report is ready" });
                  // TODO: Implement income statement report generation
                }}>Generate Report</Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span>Budget vs Actual</span>
                </CardTitle>
                <CardDescription>Compare budgeted amounts with actual spending</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => {
                  toast({ title: "Report Generated", description: "Budget vs Actual report is ready" });
                  // TODO: Implement budget vs actual report generation
                }}>Generate Report</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChurchFinancialManagement;
