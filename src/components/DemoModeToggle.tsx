import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { Settings, TestTube, Shield, Database } from 'lucide-react';

interface DemoModeToggleProps {
  variant?: 'compact' | 'full' | 'badge-only';
  className?: string;
}

export function DemoModeToggle({ variant = 'compact', className = '' }: DemoModeToggleProps) {
  const { isDemoMode, toggleDemoMode, demoConfig } = useDemoMode();

  if (variant === 'badge-only') {
    return (
      <Badge 
        variant={isDemoMode ? 'default' : 'secondary'} 
        className={`${className} ${isDemoMode ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
      >
        {isDemoMode ? '🚀 Demo Mode' : 'Production'}
      </Badge>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Switch
          id="demo-mode"
          checked={isDemoMode}
          onCheckedChange={toggleDemoMode}
        />
        <Label htmlFor="demo-mode" className="text-sm font-medium">
          Demo Mode
        </Label>
        {isDemoMode && (
          <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
            <TestTube className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )}
      </div>
    );
  }

  // Full variant with detailed configuration display
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5" />
          Demo Mode Configuration
        </CardTitle>
        <CardDescription>
          Control demo features and sample data across the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="demo-mode-full"
              checked={isDemoMode}
              onCheckedChange={toggleDemoMode}
            />
            <Label htmlFor="demo-mode-full" className="font-medium">
              Enable Demo Mode
            </Label>
          </div>
          <Badge 
            variant={isDemoMode ? 'default' : 'secondary'}
            className={isDemoMode ? 'bg-orange-500 hover:bg-orange-600' : ''}
          >
            {isDemoMode ? 'ENABLED' : 'DISABLED'}
          </Badge>
        </div>

        {isDemoMode && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="text-sm font-medium text-gray-700">Active Demo Features:</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <TestTube className="h-4 w-4 text-blue-500" />
                <span>Demo Modals & Sample Data</span>
                <Badge variant="outline" size="sm">ON</Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Enhanced Clergy Access</span>
                <Badge variant="outline" size="sm">ON</Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4 text-purple-500" />
                <span>Demo Church Data</span>
                <Badge variant="outline" size="sm">ON</Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4 text-orange-500" />
                <span>2FA Demonstration</span>
                <Badge variant="outline" size="sm">ON</Badge>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <strong>Demo Church ID:</strong> {demoConfig.demoChurchId}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
