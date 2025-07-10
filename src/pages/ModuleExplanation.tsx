import React from 'react';

import { Button } from "@/components/ui/button";
import { ArrowRight, Users, ChartBar, FileText, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const ModuleStep = ({ number, title, description, icon: Icon }: {
  number: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="relative flex items-start gap-4 p-6 rounded-lg bg-white/50 backdrop-blur-sm border border-gray-200 hover:border-gray-300 transition-colors">
    <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-gradient-journey flex items-center justify-center text-white font-semibold">
      {number}
    </div>
    <div className="h-12 w-12 rounded-full bg-journey-lightPink/20 flex items-center justify-center shrink-0">
      <Icon className="h-6 w-6 text-journey-pink" />
    </div>
    <div className="space-y-1">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  </div>
);

export default function ModuleExplanation() {
  const navigate = useNavigate();

  const steps = [
    {
      title: "Your Community's Needs",
      description: "Analyze and understand your community's needs, demographics, and opportunities.",
      icon: Users
    },
    {
      title: "Your Church's Strengths",
      description: "Evaluate your church's resources, strengths, and areas for growth.",
      icon: ChartBar
    },
    {
      title: "A Summary of How Your Strengths Match Community Needs",
      description: "Generate a comprehensive report combining community and church insights.",
      icon: FileText
    },
    {
      title: "Statements of Vocation and Mission",
      description: "Define your church's unique calling and mission based on the research.",
      icon: FileText
    },
    {
      title: "Imagining Sustainable Ministries",
      description: "Explore potential paths forward using a knowledge-base of options and opportunities.",
      icon: Layers
    },
    {
      title: "Preparing for Discernment",
      description: "Create a detailed roadmap for beginning a discernment process.",
      icon: FileText
    }
  ];

  const handleStartClick = () => {
    toast({
      title: "Leading your church through discernment",
      description: "Navigating to conversation interface...",
    });
    navigate('/community-profile');
  };

  return (
    <>
      <div className="min-h-[90vh] relative px-4 py-12 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-journey-pink opacity-10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-journey-red opacity-10 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold gradient-text">Planning the Discernment Process</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We will guide you through the process of building a Church Transformation Discernment Plan.  We will accompany you through each step in building the Plan. 
              Along the way, you can select intelligent companions to provide unique perspectives in the planning process.
            </p>
          </div>

          <div className="grid gap-6 relative">
            {/* Vertical line connecting steps */}
            <div className="absolute left-[47px] top-12 bottom-12 w-0.5 bg-gray-200 -z-10" />
            
            {steps.map((step, index) => (
              <ModuleStep
                key={index}
                number={index + 1}
                title={step.title}
                description={step.description}
                icon={step.icon}
              />
            ))}
          </div>

          <div className="flex justify-end pt-8">
            <Button 
              onClick={handleStartClick} 
              className="text-lg px-8 py-6 bg-gradient-journey hover:opacity-95 transition-all shadow-journey"
            >
              Ready to determine if now is the right time <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
