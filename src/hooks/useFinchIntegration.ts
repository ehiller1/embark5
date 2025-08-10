import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  title: string;
}

interface PayrollData {
  employee_id: string;
  gross_pay: number;
  net_pay: number;
  deductions: {
    federal_tax: number;
    state_tax: number;
    social_security: number;
    medicare: number;
    health_insurance: number;
    retirement: number;
  };
  pay_period: string;
}

export const useFinchIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock employee data for development
  const mockEmployees: Employee[] = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@church.org',
      department: 'Administration',
      title: 'Church Administrator'
    },
    {
      id: '2',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@church.org',
      department: 'Music Ministry',
      title: 'Music Director'
    },
    {
      id: '3',
      first_name: 'Michael',
      last_name: 'Davis',
      email: 'michael.davis@church.org',
      department: 'Facilities',
      title: 'Facilities Manager'
    }
  ];

  // Mock payroll data
  const mockPayrollData: PayrollData[] = [
    {
      employee_id: '1',
      gross_pay: 4500,
      net_pay: 3200,
      deductions: {
        federal_tax: 675,
        state_tax: 225,
        social_security: 279,
        medicare: 65,
        health_insurance: 150,
        retirement: 225
      },
      pay_period: '2024-01-01 to 2024-01-15'
    },
    {
      employee_id: '2',
      gross_pay: 3800,
      net_pay: 2750,
      deductions: {
        federal_tax: 570,
        state_tax: 190,
        social_security: 235,
        medicare: 55,
        health_insurance: 125,
        retirement: 190
      },
      pay_period: '2024-01-01 to 2024-01-15'
    }
  ];

  const initiateConnection = async () => {
    setIsLoading(true);
    try {
      // In production, this would use the Finch Connect SDK
      // For now, we'll simulate the OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      toast({
        title: "Finch HR Connected",
        description: "Successfully connected to your HR system via Finch",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Finch HR. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmployees(mockEmployees);
      
      toast({
        title: "Employees Synced",
        description: `Successfully synced ${mockEmployees.length} employees`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync employee data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayrollData = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPayrollData(mockPayrollData);
      
      toast({
        title: "Payroll Data Synced",
        description: "Successfully synced payroll information",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync payroll data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    setIsLoading(true);
    try {
      // Simulate disconnection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConnected(false);
      setEmployees([]);
      setPayrollData([]);
      
      toast({
        title: "Finch HR Disconnected",
        description: "Successfully disconnected from Finch HR",
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect from Finch HR",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    employees,
    payrollData,
    isLoading,
    initiateConnection,
    fetchEmployees,
    fetchPayrollData,
    disconnect
  };
};
