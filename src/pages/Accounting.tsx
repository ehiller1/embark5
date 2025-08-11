import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Download, Upload, RefreshCw, DollarSign, CreditCard, FileText, ArrowLeft, AlertCircle } from 'lucide-react';
import { shouldShowDemoModals, shouldGrantClergyAccess } from '@/config/demoConfig';
import { TwoFactorAuthDemo } from '@/components/TwoFactorAuthDemo';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';

// Mock data for transactions
const mockTransactions = [
  { id: 1, date: '2025-07-01', description: 'Sunday Offering', category: 'Donations', amount: 3250.00, type: 'income' },
  { id: 2, date: '2025-07-02', description: 'Utility Bill', category: 'Utilities', amount: 450.75, type: 'expense' },
  { id: 3, date: '2025-07-03', description: 'Staff Salary', category: 'Salaries', amount: 2800.00, type: 'expense' },
  { id: 4, date: '2025-07-04', description: 'Building Fund Donation', category: 'Building Fund', amount: 1500.00, type: 'income' },
  { id: 5, date: '2025-07-05', description: 'Office Supplies', category: 'Supplies', amount: 125.50, type: 'expense' },
];

// Mock data for accounts
const mockAccounts = [
  { id: 1, name: 'Main Checking', balance: 15750.25, type: 'checking' },
  { id: 2, name: 'Savings', balance: 45000.00, type: 'savings' },
  { id: 3, name: 'Building Fund', balance: 78500.00, type: 'savings' },
  { id: 4, name: 'Mission Fund', balance: 12350.75, type: 'checking' },
];

// Categories for church accounting
const expenseCategories = [
  'Salaries', 'Utilities', 'Maintenance', 'Supplies', 'Insurance', 
  'Missions', 'Education', 'Worship', 'Administration', 'Other'
];

const incomeCategories = [
  'Donations', 'Tithes', 'Building Fund', 'Mission Fund', 'Special Offerings',
  'Fundraising', 'Rental Income', 'Investment Income', 'Other'
];

const Accounting: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState(mockTransactions);
  const [accounts, setAccounts] = useState(mockAccounts);
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date(),
    description: '',
    category: '',
    amount: '',
    type: 'expense',
    account: ''
  });
  const [bankConnected, setBankConnected] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [show2FADemo, setShow2FADemo] = useState(false);
  const { profile } = useUserProfile();
  
  // Show demo modal after component mounts if demo mode is enabled
  useEffect(() => {
    if (shouldShowDemoModals()) {
      const timer = setTimeout(() => {
        setShowDemoModal(true);
      }, 100); // Small delay to ensure component is fully mounted
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Show 2FA demo for clergy users in demo mode after demo modal is dismissed
  const handle2FADemo = () => {
    if (profile?.role === 'Clergy' && shouldGrantClergyAccess()) {
      setTimeout(() => {
        setShow2FADemo(true);
      }, 500); // Small delay after demo modal closes
    }
  };

  const handleDemoModalClose = () => {
    setShowDemoModal(false);
    handle2FADemo();
  };

  const handle2FASuccess = () => {
    console.log('[Accounting] 2FA Demo completed successfully');
    // In a real implementation, this would update user security settings
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate total income, expenses, and balance
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
    
  const balance = totalIncome - totalExpenses;

  // Handle new transaction submission
  const handleSubmitTransaction = () => {
    if (!newTransaction.description || !newTransaction.category || !newTransaction.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(newTransaction.amount as string);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    const newTransactionItem = {
      id: transactions.length + 1,
      date: format(newTransaction.date, 'yyyy-MM-dd'),
      description: newTransaction.description,
      category: newTransaction.category,
      amount: amount,
      type: newTransaction.type
    };

    setTransactions([...transactions, newTransactionItem]);
    setShowNewTransactionDialog(false);
    setNewTransaction({
      date: new Date(),
      description: '',
      category: '',
      amount: '',
      type: 'expense',
      account: ''
    });

    toast({
      title: "Success",
      description: "Transaction added successfully"
    });
  };

  // Handle bank connection
  const connectToBank = () => {
    // In a real implementation, this would integrate with Fintoc API
    toast({
      title: "Connecting to bank...",
      description: "Please wait while we establish a secure connection"
    });
    
    // Simulate API call delay
    setTimeout(() => {
      setBankConnected(true);
      toast({
        title: "Success",
        description: "Bank account connected successfully"
      });
    }, 2000);
  };

  // Generate financial report
  const generateReport = () => {
    toast({
      title: "Generating Report",
      description: "Your financial report is being prepared"
    });
    
    // Generate actual CSV report and download it
    setTimeout(() => {
      try {
        // Create CSV content
        const csvHeader = 'Date,Description,Category,Type,Amount\n';
        const csvRows = transactions.map(t => 
          `${t.date},"${t.description}",${t.category},${t.type},${t.amount}`
        ).join('\n');
        
        // Add summary at the end
        const summary = `\n\nSUMMARY\nTotal Income,${totalIncome}\nTotal Expenses,${totalExpenses}\nNet Balance,${balance}`;
        const csvContent = csvHeader + csvRows + summary;
        
        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Report Downloaded",
          description: "Your financial report has been downloaded to your computer"
        });
      } catch (error) {
        console.error('Error generating report:', error);
        toast({
          title: "Download Failed",
          description: "There was an error downloading the report. Please try again.",
          variant: "destructive"
        });
      }
    }, 1500);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/clergy-home')}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Home</span>
          </Button>

        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateReport}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          {!bankConnected ? (
            <Button onClick={connectToBank}>
              <CreditCard className="mr-2 h-4 w-4" />
              Connect Bank Account
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setBankConnected(false)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Bank Data
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                  Income
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold">{formatCurrency(totalIncome)}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-red-600" />
                  Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-blue-600" />
                  Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(balance)}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activities</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 5).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className={`text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setActiveTab('transactions')}>
                  View All
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Accounts Overview</CardTitle>
                <CardDescription>Your financial accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>{account.name}</TableCell>
                        <TableCell className="capitalize">{account.type}</TableCell>
                        <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>Manage your financial transactions</CardDescription>
              </div>
              <Button onClick={() => setShowNewTransactionDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Transaction
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell className={`capitalize ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total: {transactions.length} transactions
                </p>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Financial Accounts</CardTitle>
              <CardDescription>Manage your church accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="capitalize">{account.type}</TableCell>
                      <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>Generate and view financial reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select defaultValue="income-statement">
                    <SelectTrigger id="report-type">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income-statement">Income Statement</SelectItem>
                      <SelectItem value="balance-sheet">Balance Sheet</SelectItem>
                      <SelectItem value="cash-flow">Cash Flow Statement</SelectItem>
                      <SelectItem value="budget-comparison">Budget Comparison</SelectItem>
                      <SelectItem value="donation-summary">Donation Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="date-range">Date Range</Label>
                  <Select defaultValue="current-month">
                    <SelectTrigger id="date-range">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current-month">Current Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="quarter">Current Quarter</SelectItem>
                      <SelectItem value="year-to-date">Year to Date</SelectItem>
                      <SelectItem value="last-year">Last Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select defaultValue="pdf">
                    <SelectTrigger id="format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={generateReport}>
                  Generate Report
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Saved Reports</CardTitle>
                <CardDescription>Access your previously generated reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Date Generated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Q2 2025 Income Statement</TableCell>
                      <TableCell>July 1, 2025</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>June 2025 Balance Sheet</TableCell>
                      <TableCell>July 1, 2025</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>YTD Donation Summary</TableCell>
                      <TableCell>July 1, 2025</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Transaction Dialog */}
      <Dialog open={showNewTransactionDialog} onOpenChange={setShowNewTransactionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Enter the details of your new financial transaction
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction-date" className="text-right">
                Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTransaction.date ? format(newTransaction.date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newTransaction.date}
                      onSelect={(date) => setNewTransaction({ ...newTransaction, date: date || new Date() })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction-type" className="text-right">
                Type
              </Label>
              <div className="col-span-3">
                <Select 
                  value={newTransaction.type} 
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value })}
                >
                  <SelectTrigger id="transaction-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction-description" className="text-right">
                Description
              </Label>
              <Input
                id="transaction-description"
                className="col-span-3"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction-category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <Select 
                  value={newTransaction.category} 
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                >
                  <SelectTrigger id="transaction-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {newTransaction.type === 'income' 
                      ? incomeCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))
                      : expenseCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="transaction-amount"
                type="number"
                step="0.01"
                min="0"
                className="col-span-3"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transaction-account" className="text-right">
                Account
              </Label>
              <div className="col-span-3">
                <Select 
                  value={newTransaction.account} 
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, account: value })}
                >
                  <SelectTrigger id="transaction-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id.toString()}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTransactionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTransaction}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demo Modal */}
      {showDemoModal && (
        <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Demo Data Notice
              </DialogTitle>
              <DialogDescription className="text-left">
                For demo purposes we are showing you sample financial data that will be replaced when you connect your actual bank accounts and enter real transactions.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleDemoModalClose} className="w-full">
                Continue with Demo Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Two-Factor Authentication Demo */}
      <TwoFactorAuthDemo
        isOpen={show2FADemo}
        onClose={() => setShow2FADemo(false)}
        onSuccess={handle2FASuccess}
        userRole={profile?.role || undefined}
      />
    </div>
  );
};

export default Accounting;
