
import React, { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useSerpApi } from '@/hooks/useSerpApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export default function SerpApiTest() {
  const [query, setQuery] = useState('church community outreach');
  const [results, setResults] = useState<any[]>([]);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { search } = useSerpApi();

  const handleSearch = async () => {
    setIsLoading(true);
    setResults([]);
    setRawResponse('');
    
    try {
      console.log('🔍 Starting SerpAPI test search with query:', query);
      
      // Perform search using the hook
      const searchResults = await search(query, { numResults: 3 });
      
      setResults(searchResults);
      setRawResponse(JSON.stringify(searchResults, null, 2));
      console.log('✅ SerpAPI test search completed:', searchResults);
    } catch (error) {
      console.error('❌ SerpAPI test search failed:', error);
      setRawResponse(JSON.stringify(error, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SerpAPI Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the SerpAPI functionality and diagnose issues
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter search query"
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading || !query}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Search
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Status</h3>
                <div className="text-sm">
                  {isLoading ? (
                    <span className="text-amber-500 flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Searching...
                    </span>
                  ) : results.length > 0 ? (
                    <span className="text-green-500">Search successful ✓</span>
                  ) : rawResponse ? (
                    <span className="text-red-500">Search failed ✗</span>
                  ) : (
                    <span className="text-muted-foreground">Ready to search</span>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Results ({results.length})</h3>
                {results.length > 0 ? (
                  <div className="space-y-2">
                    {results.map((result) => (
                      <Card key={result.id} className="p-3">
                        <h4 className="font-medium">{result.title}</h4>
                        <p className="text-sm text-muted-foreground">{result.snippet}</p>
                        <a 
                          href={result.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          {result.displayed_link}
                        </a>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No results to display</p>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Raw Response</h3>
                <ScrollArea className="h-[300px] rounded-md border p-4 bg-muted/50">
                  <pre className="text-xs whitespace-pre-wrap">{rawResponse || "No data yet"}</pre>
                </ScrollArea>
              </div>

              <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <h3 className="font-medium text-amber-800 mb-1">Debugging Tips</h3>
                <ul className="text-sm text-amber-700 list-disc pl-5">
                  <li>Check browser console for detailed logs</li>
                  <li>Verify SERPAPI_API_KEY in Supabase secrets</li>
                  <li>Check Supabase Edge Function logs</li>
                  <li>Check network requests for errors</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
