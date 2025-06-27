
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VocationalDiscernment() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-6">Vocational Discernment</h1>
      <p className="text-xl mb-8">
        This page helps you discern your church's vocational direction and purpose.
      </p>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p>
          Explore your congregation's gifts, passions, and calling to discover 
          your unique purpose in your community.
        </p>
      </div>
    </div>
  );
}
