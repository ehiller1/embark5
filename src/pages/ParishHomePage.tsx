import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Newspaper, MessageSquare, ShoppingCart, ArrowRight } from 'lucide-react';

// MainLayout will be applied by the router, so no need to include it here.

const ParishHomePage: React.FC = () => {
  // In a real app, you might fetch church-specific info here based on user's church_id
  const churchName = "Your Church Community"; // Placeholder

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 pb-6 border-b border-gray-200">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl gradient-text">
          Welcome to {churchName}!
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-3xl">
          Connect with your church, share your voice, and support our community's growth.
        </p>
      </header>

      <div className="space-y-12">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
          {/* Step 1 */}
          <div className="flex flex-col items-center w-full md:w-1/3">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">1</div>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-semibold">
                  <Newspaper className="mr-3 h-7 w-7 text-primary" />
                  Step One: Share Your View
                </CardTitle>
                <CardDescription>
                  Share your valuable perspective on your faith community and its future.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center mt-auto">
                <Newspaper className="h-16 w-16 text-primary mb-4" />
                <Link to="/conversation-parish-survey" className="w-full">
                  <Button className="w-full bg-gradient-journey hover:opacity-90">Take the Survey</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center text-primary">
            <ArrowRight className="h-12 w-12" />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center w-full md:w-1/3 mt-8 md:mt-0">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">2</div>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-semibold">
                  <MessageSquare className="mr-3 h-7 w-7 text-primary" />
                  Step Two: React to the Plan
                </CardTitle>
                <CardDescription>
                  Participate in discussions about the findings, opportunities and plans for the future.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center mt-auto">
                <MessageSquare className="h-16 w-16 text-primary mb-4" />
                <Link to="/conversation-parish" className="w-full">
                  <Button className="w-full bg-gradient-journey hover:opacity-90">Join the Conversation</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center text-primary">
            <ArrowRight className="h-12 w-12" />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center w-full md:w-1/3 mt-8 md:mt-0">
            <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">3</div>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-semibold">
                  <ShoppingCart className="mr-3 h-7 w-7 text-primary" />
                  Step Three: Support the Mission
                </CardTitle>
                <CardDescription>
                  Explore and contribute to opportunities to fund sustainable ministries here and throughout the worldwide church.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center mt-auto">
                <ShoppingCart className="h-16 w-16 text-primary mb-4" />
                <Link to="/marketplace" className="w-full">
                  <Button className="w-full bg-gradient-journey hover:opacity-90">Visit Marketplace</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParishHomePage;
