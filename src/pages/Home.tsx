
import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  
  return (
    <MainLayout>
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to the Church Property Discernment Tool</h1>
          <p className="text-xl mb-8">
            Explore tools and resources to help your congregation make informed decisions
            about your church property.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Assessment</h2>
              <p className="mb-4">Evaluate your church and community context</p>
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => navigate('/assessment')}
              >
                Start Assessment
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Implementation</h2>
              <p className="mb-4">Map your congregation and plan interactions</p>
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => navigate('/implementation')}
              >
                Explore Implementation
              </Button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Resources</h2>
              <p className="mb-4">Access helpful resources and guidance</p>
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => navigate('/resource_library')}
              >
                Browse Resources
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
