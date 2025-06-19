import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Tag, Filter, BookOpen, Check } from "lucide-react";
import { supabase, convertArraysForPostgres } from "@/integrations/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { List } from "lucide-react";
import { generateRelatedResources } from '@/utils/resourceGeneration';
import { v4 as uuidv4 } from 'uuid';

interface ResourceItem {
  id: string;
  title: string;
  content: string;
  scenario_title?: string;
  resource_type?: string;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// Helper function to parse JSON content and display it as a preview (for cards)
const tryParseAndDisplayContent = (content: string): string => {
  try {
    // Try to parse the content as JSON
    const parsedContent = JSON.parse(content);
    
    // Check if it has a description field
    if (parsedContent.description) {
      return parsedContent.description;
    }
    
    // If it has steps, grab the first step description
    if (parsedContent.steps && parsedContent.steps.length > 0 && parsedContent.steps[0].description) {
      return parsedContent.steps[0].description;
    }
    
    // Return something meaningful from the parsed content
    return parsedContent.title || parsedContent.content || "No preview available";
  } catch (e) {
    // If it's not valid JSON, return a substring of the raw content
    return content.substring(0, 100) + (content.length > 100 ? '...' : '');
  }
}

// Helper function to parse and format JSON content for detailed view
const tryParseJsonContent = (content: string): React.ReactNode => {
  try {
    // Try to parse the content as JSON
    const parsedContent = JSON.parse(content);
    
    // If it's a discernment plan with steps
    if (parsedContent.steps && Array.isArray(parsedContent.steps)) {
      return (
        <div className="space-y-4">
          {parsedContent.description && (
            <div className="mb-4">
              <h3 className="text-lg font-medium">Description</h3>
              <p>{parsedContent.description}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-medium mb-2">Steps</h3>
            <ol className="list-decimal pl-5 space-y-2">
              {parsedContent.steps.map((step: any, index: number) => (
                <li key={index} className="pl-1">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      );
    }
    
    // Regular structured content - show all fields
    return (
      <div className="space-y-4">
        {Object.entries(parsedContent).map(([key, value]: [string, any]) => {
          // Skip the id field or empty arrays
          if (key === 'id' || (Array.isArray(value) && value.length === 0)) {
            return null;
          }
          
          // Handle nested objects and arrays
          if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              return (
                <div key={key} className="mb-4">
                  <h3 className="text-lg font-medium capitalize">{key.replace('_', ' ')}</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {value.map((item: any, i: number) => (
                      <li key={i}>
                        {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            } else {
              return (
                <div key={key} className="mb-4">
                  <h3 className="text-lg font-medium capitalize">{key.replace('_', ' ')}</h3>
                  <pre className="p-2 bg-muted rounded">{JSON.stringify(value, null, 2)}</pre>
                </div>
              );
            }
          }
          
          // Simple key-value pairs
          return (
            <div key={key} className="mb-4">
              <h3 className="text-lg font-medium capitalize">{key.replace('_', ' ')}</h3>
              <p>{String(value)}</p>
            </div>
          );
        })}
      </div>
    );
  } catch (e) {
    // If it's not valid JSON, return the raw content
    return <p>{content}</p>;
  }
}

interface EditFormValues {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  resource_type?: string;
}

const RESOURCE_CATEGORIES = [
  "Prayer",
  "Ministry Plan", 
  "Scripture Study",
  "Community Outreach",
  "Discipleship",
  "Leadership",
  "Missions",
  "Worship",
  "Uncategorized"
];

const RESOURCE_TAGS = [
  "Urgent", "Long-term", "Youth", "Adults", "Seniors",
  "Urban", "Rural", "Evangelism", "Service", "Local",
  "Global", "Families", "Small Groups", "Core Value"
];

const CategoryPreview = ({ 
  category, 
  resources, 
  onResourceClick 
}: { 
  category: string; 
  resources: ResourceItem[]; 
  onResourceClick: (resource: ResourceItem) => void;
}) => {
  const categoryResources = resources.filter(r => r.category === category);
  // Display all resources instead of limiting to 2
  const displayResources = categoryResources;
  
  if (categoryResources.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{category}</h3>
        <Badge variant="outline">{categoryResources.length} {categoryResources.length === 1 ? 'resource' : 'resources'}</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayResources.map(resource => (
          <Card 
            key={resource.id}
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onResourceClick(resource)}
          >
            <div className="bg-muted h-32 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Placeholder for thumbnail */}
                <div className="w-full h-full bg-gradient-to-br from-muted-foreground/10 to-primary/5 flex items-center justify-center">
                  <span className="font-medium text-muted-foreground">{resource.resource_type || "Resource"}</span>
                </div>
              </div>
              {resource.category && (
                <Badge className="absolute top-2 right-2">
                  {resource.category}
                </Badge>
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-1">{resource.title}</CardTitle>
              <CardDescription className="text-xs">
                Updated {format(new Date(resource.updated_at), "MMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {resource.content.substring(0, 100)}...
              </p>
            </CardContent>
            <CardFooter className="pt-0 pb-4">
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{resource.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

const ResourceLibraryPage = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("all");
  const [showDiscernmentResourcesModal, setShowDiscernmentResourcesModal] = useState(false);
  const [generatedResources, setGeneratedResources] = useState<ResourceItem[]>([]);
  const [isGeneratingResources, setIsGeneratingResources] = useState(false);
  const [selectedGeneratedResources, setSelectedGeneratedResources] = useState<string[]>([]);
  
  const form = useForm<EditFormValues>({
    defaultValues: {
      title: "",
      content: "",
      category: "Uncategorized",
      tags: []
    }
  });
  
  useEffect(() => {
    fetchResources();
  }, []);
  
  useEffect(() => {
    if (selectedResource && isEditMode) {
      form.reset({
        title: selectedResource.title,
        content: selectedResource.content,
        category: selectedResource.category || "Uncategorized",
        tags: selectedResource.tags || [],
        resource_type: selectedResource.resource_type
      });
    }
  }, [selectedResource, isEditMode, form]);
  
  const fetchResources = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('resource_library')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      const processedResources = (data || []).map(resource => ({
        ...resource,
        category: resource.category || "Uncategorized"
      }));
      
      setResources(processedResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Failed to Load Resources",
        description: "There was an error loading your resources.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return "Unknown date";
    }
  };
  
  const getResourceTypeLabel = (type?: string) => {
    switch (type) {
      case 'discernment_plan':
        return 'Discernment Plan';
      default:
        return 'Resource';
    }
  };
  
  const handleEdit = () => {
    setIsEditMode(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditMode(false);
  };
  
  const handleUpdateResource = async (values: EditFormValues) => {
    if (!selectedResource) return;
    
    setIsSubmitting(true);
    try {
      const dataToUpdate = convertArraysForPostgres({
        title: values.title,
        content: values.content,
        category: values.category,
        tags: values.tags || [],
        updated_at: new Date().toISOString()
      });
      
      const { error } = await supabase
        .from('resource_library')
        .update(dataToUpdate)
        .eq('id', selectedResource.id);
        
      if (error) {
        throw error;
      }
      
      const updatedResources = resources.map(resource => 
        resource.id === selectedResource.id 
          ? { 
              ...resource, 
              title: values.title, 
              content: values.content,
              category: values.category,
              tags: values.tags || [],
              updated_at: new Date().toISOString() 
            } 
          : resource
      );
      
      setResources(updatedResources);
      setSelectedResource({
        ...selectedResource,
        title: values.title,
        content: values.content,
        category: values.category,
        tags: values.tags || [],
        updated_at: new Date().toISOString()
      });
      
      setIsEditMode(false);
      
      toast({
        title: "Resource Updated",
        description: "Your resource has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update resource",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const closeDialog = () => {
    setSelectedResource(null);
    setIsEditMode(false);
  };
  
  const toggleTag = (tag: string) => {
    setSelectedTags(current => 
      current.includes(tag) 
        ? current.filter(t => t !== tag)
        : [...current, tag]
    );
  };
  
  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter(undefined);
    setSelectedTags([]);
  };
  
  const handleGenerateRelatedResources = async () => {
    if (!selectedResource) return;

    const relatedResources = await generateRelatedResources({
      title: selectedResource.title,
      content: selectedResource.content,
      category: selectedResource.category,
      tags: selectedResource.tags
    });

    if (relatedResources) {
      // Optionally, refresh the resources list or update the UI
      fetchResources();
    }
  };
  
  const handleOpenDiscernmentResourcesModal = () => {
    const planJson = localStorage.getItem('discernment_plan');
    if (!planJson) {
      toast({
        title: "No Discernment Plan Found",
        description: "Please create a discernment plan first.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedGeneratedResources([]);
    setGeneratedResources([]);
    setShowDiscernmentResourcesModal(true);
  };
  
  const handleCloseDiscernmentResourcesModal = () => {
    setShowDiscernmentResourcesModal(false);
  };
  
  // Generate workshop resources based on the discernment plan
  const handleGenerateWorkshopResources = async () => {
    setIsGeneratingResources(true);
    try {
      // const resources: Record<string, any>[] | null = await generateResourcesFromDiscernmentPlan();
      const resources: any[] = []; // Placeholder to allow compilation
      if (resources && Array.isArray(resources)) {
        // Format resources for display in the modal
        const formattedResources = resources.map((resource: Record<string, any>) => ({
          id: resource.id || uuidv4(),
          title: resource.title || 'Untitled Resource',
          content: resource.content || '',
          category: resource.category || 'Uncategorized',
          tags: resource.tags || [],
          resource_type: resource.resource_type || 'workshop',
          scenario_title: resource.scenario_title || '',
          created_at: resource.created_at || new Date().toISOString(),
          updated_at: resource.updated_at || new Date().toISOString()
        }));
        setGeneratedResources(formattedResources);
        await fetchResources(); // Refresh the main list to include newly generated resources
      } else {
        console.warn('No resources generated or invalid format returned');
        setGeneratedResources([]);
      }
    } catch (error) {
      console.error('Error generating workshop resources:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating workshop resources.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingResources(false);
    }
  };
  
  const toggleResourceSelection = (resourceId: string) => {
    setSelectedGeneratedResources(prev => 
      prev.includes(resourceId) 
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };
  
  const handleSaveSelectedResources = async () => {
    // Resources are already saved to the database during generation
    // This just refreshes the list and closes the modal
    await fetchResources();
    handleCloseDiscernmentResourcesModal();
    
    toast({
      title: "Resources Saved",
      description: "Workshop resources have been added to your resource library."
    });
  };

  // Extract unique categories for potential future category filter improvements
  // Note: Currently using direct category comparison in filter logic

  const filteredResources = resources.filter(resource => {
    // Exclude resource types already displayed in tabs and specific types like research_summary
    const excludedTypesOnMainPage = ['discernment_plan', 'vocational_statement', 'scenario', 'research_summary'];
    const matchesResourceType = currentTab === 'all' 
      ? !excludedTypesOnMainPage.includes(resource.resource_type || '')
      : true;
      
    const matchesSearch = searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resource.scenario_title && resource.scenario_title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !categoryFilter || 
      (resource.category || "Uncategorized") === categoryFilter;
    
    const matchesTags = selectedTags.length === 0 || 
      (resource.tags && selectedTags.some(tag => resource.tags?.includes(tag)));
    
    return matchesSearch && matchesCategory && matchesTags && matchesResourceType;
  });

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    // If the new tab is 'all', ensure category filter is cleared.
    // For other specific resource_type tabs, the categoryFilter (if set by the dropdown) can remain,
    // allowing users to further filter by category within that resource type.
    if (value === 'all') {
      setCategoryFilter(undefined);
    }
  };
  
  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        {/* Discernment Plan Resources Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleOpenDiscernmentResourcesModal}
          >
            <BookOpen className="h-4 w-4" />
            Generate Workshop Resources
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">Resource Library</h1>
          <p className="text-muted-foreground">
            View and manage your saved resources
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search resources..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Popover open={isTagPopoverOpen} onOpenChange={setIsTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto flex justify-between">
                    <span className="flex items-center">
                      <Tag className="mr-2 h-4 w-4" />
                      <span>{selectedTags.length ? `${selectedTags.length} tags selected` : "Filter by tags"}</span>
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search tags..." />
                    <CommandList>
                      <CommandEmpty>No tags found.</CommandEmpty>
                      <CommandGroup>
                        {RESOURCE_TAGS.map(tag => (
                          <CommandItem 
                            key={tag} 
                            onSelect={() => toggleTag(tag)}
                            className="flex items-center cursor-pointer"
                          >
                            <div className={`mr-2 h-4 w-4 rounded-sm border ${selectedTags.includes(tag) ? 'bg-primary border-primary' : 'border-input'}`}>
                              {selectedTags.includes(tag) && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                            <span>{tag}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {(searchQuery || selectedTags.length > 0) && (
                <Button variant="ghost" onClick={resetFilters} className="whitespace-nowrap">
                  <Filter className="mr-2 h-4 w-4" /> Clear Filters
                </Button>
              )}
            </div>
            
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    <button className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center" onClick={(e) => {
                      e.stopPropagation();
                      toggleTag(tag);
                    }}>×</button>
                  </Badge>
                ))}
              </div>
            )}
            
            {resources.length === 0 ? (
              <div className="text-center py-12">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <Spinner size="lg" className="mb-4" />
                    <p>Loading resources from resource library...</p>
                  </div>
                ) : (
                  <>
                    <BookOpen className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-medium mb-2">No resources found in your library</h2>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      Your resource library is currently empty.
                    </p>
                    <Button onClick={() => window.history.back()}>Go Back</Button>
                  </>
                )}
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No resources match your filters.</p>
                <Button onClick={resetFilters}>Clear Filters</Button>
              </div>
            ) : (
              <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All Resources</TabsTrigger>
                  <TabsTrigger value="discernment_plans">Discernment Plans</TabsTrigger>
                  <TabsTrigger value="vocational_statements">Vocational Statements</TabsTrigger>
                  <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  {/* Calculate categories based on currently filtered resources for the 'All' tab */}
                  {([...new Set(filteredResources.map(r => r.category || "Uncategorized"))].sort()).map(category => (
                    <CategoryPreview 
                      key={category}
                      category={category}
                      resources={filteredResources} /* Pass all filtered resources to CategoryPreview */
                      onResourceClick={setSelectedResource}
                    />
                  ))}
                  {/* If no categories, but resources exist, show them in a plain grid */}
                  {([...new Set(filteredResources.map(r => r.category || "Uncategorized"))].sort()).length === 0 && filteredResources.length > 0 && (
                    <ResourceDisplayGrid
                      resourcesToDisplay={filteredResources}
                      onResourceClick={setSelectedResource}
                      getResourceTypeLabel={getResourceTypeLabel}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="discernment_plans">
                  <ResourceDisplayGrid
                    resourcesToDisplay={filteredResources.filter(r => r.resource_type === 'discernment_plan')}
                    onResourceClick={setSelectedResource}
                    getResourceTypeLabel={getResourceTypeLabel}
                  />
                </TabsContent>

                <TabsContent value="vocational_statements">
                  <ResourceDisplayGrid
                    resourcesToDisplay={filteredResources.filter(r => r.resource_type === 'vocational_statement')}
                    onResourceClick={setSelectedResource}
                    getResourceTypeLabel={getResourceTypeLabel}
                  />
                </TabsContent>

                <TabsContent value="scenarios">
                  <ResourceDisplayGrid
                    resourcesToDisplay={filteredResources.filter(r => r.resource_type === 'scenario')}
                    onResourceClick={setSelectedResource}
                    getResourceTypeLabel={getResourceTypeLabel}
                  />
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
      
      <Dialog open={!!selectedResource} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Resource" : selectedResource?.title}</DialogTitle>
          </DialogHeader>
          
          {isEditMode ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdateResource)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {RESOURCE_CATEGORIES.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-between"
                              >
                                {field.value?.length ? `${field.value.length} selected` : "Select tags"}
                                <Tag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search tags..." />
                                <CommandList>
                                  <CommandEmpty>No tags found.</CommandEmpty>
                                  <CommandGroup>
                                    {RESOURCE_TAGS.map(tag => (
                                      <CommandItem
                                        key={tag}
                                        onSelect={() => {
                                          const currentTags = field.value || [];
                                          const newTags = currentTags.includes(tag)
                                            ? currentTags.filter(t => t !== tag)
                                            : [...currentTags, tag];
                                          field.onChange(newTags);
                                        }}
                                      >
                                        <div
                                          className={`mr-2 h-4 w-4 rounded-sm border ${
                                            field.value?.includes(tag)
                                              ? "bg-primary border-primary"
                                              : "border-input"
                                          }`}
                                        >
                                          {field.value?.includes(tag) && (
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="h-4 w-4 text-white"
                                            >
                                              <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                          )}
                                        </div>
                                        <span>{tag}</span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="min-h-[300px] font-normal text-base"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEdit}
                  className="flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="subtle" 
                  size="sm"
                  onClick={handleGenerateRelatedResources}
                  className="flex items-center"
                >
                  <List className="h-4 w-4 mr-2" />
                  Generate Related Resources
                </Button>
              </div>
              
              <ScrollArea className="h-[60vh] pr-4">
                <div className="prose max-w-none whitespace-pre-wrap">
                  {selectedResource && tryParseJsonContent(selectedResource.content)}
                </div>
                
                {(selectedResource?.category || (selectedResource?.tags && selectedResource.tags.length > 0)) && (
                  <div className="mt-6 pt-4 border-t">
                    {selectedResource?.category && (
                      <div className="mb-2">
                        <span className="font-medium">Category:</span> 
                        <Badge variant="outline" className="ml-2">
                          {selectedResource.category}
                        </Badge>
                      </div>
                    )}
                    
                    {selectedResource?.tags && selectedResource.tags.length > 0 && (
                      <div className="mb-2">
                        <span className="font-medium">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedResource.tags.map(tag => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedResource?.scenario_title && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-lg font-medium">Source Scenario</h3>
                    <p>{selectedResource.scenario_title}</p>
                  </div>
                )}
                
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Created: {selectedResource && formatDate(selectedResource.created_at)}</p>
                  <p>Last updated: {selectedResource && formatDate(selectedResource.updated_at)}</p>
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Discernment Plan Resources Modal */}
      <Dialog open={showDiscernmentResourcesModal} onOpenChange={setShowDiscernmentResourcesModal}>
        <DialogContent className="sm:max-w-[80vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Workshop Resources from Discernment Plan</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {generatedResources.length === 0 ? (
              <div className="text-center py-12">
                {isGeneratingResources ? (
                  <div className="flex flex-col items-center">
                    <Spinner size="lg" className="mb-4" />
                    <p>Loading resources from resource library...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <BookOpen className="h-24 w-24 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-medium mb-2">No resources found</h2>
                    <p className="text-muted-foreground max-w-md mb-6">
                      Your discernment plan can be used to generate workshop resources.
                    </p>
                    <Button 
                      onClick={handleGenerateWorkshopResources}
                      className="mt-2">
                      Generate Workshop Resources
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4 pb-2 border-b">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Generation Complete</h3>
                    <p className="text-sm text-muted-foreground">
                      {generatedResources.length} workshop resources were created based on your discernment plan.
                      Select items to save to your library.
                    </p>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 pr-4 h-[55vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {generatedResources.map(resource => (
                      <Card 
                        key={resource.id}
                        className={`overflow-hidden transition-shadow cursor-pointer border-2 ${selectedGeneratedResources.includes(resource.id) ? 'border-primary' : 'border-border'}`}
                        onClick={() => toggleResourceSelection(resource.id)}
                      >
                        <div className="relative p-4">
                          {selectedGeneratedResources.includes(resource.id) && (
                            <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-[120px]">
                              <p className="text-sm text-muted-foreground">
                                {resource.content.substring(0, 400)}...
                              </p>
                            </ScrollArea>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                  <Button variant="outline" onClick={handleCloseDiscernmentResourcesModal}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSelectedResources}>
                    Save to Resource Library
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

// Helper component to display a grid of resource cards
const ResourceDisplayGrid = ({
  resourcesToDisplay,
  onResourceClick,
  getResourceTypeLabel
}: {
  resourcesToDisplay: ResourceItem[];
  onResourceClick: (resource: ResourceItem) => void;
  getResourceTypeLabel: (type?: string) => string;
}) => {
  if (resourcesToDisplay.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No resources found for this selection.</p>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {resourcesToDisplay.map(resource => (
        <Card 
          key={resource.id}
          className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onResourceClick(resource)}
        >
          <div className="bg-muted h-32 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-muted-foreground/10 to-primary/5 flex items-center justify-center">
                <span className="font-medium text-muted-foreground">{getResourceTypeLabel(resource.resource_type)}</span>
              </div>
            </div>
            {resource.category && (
              <Badge className="absolute top-2 right-2">
                {resource.category}
              </Badge>
            )}
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg line-clamp-1">{resource.title}</CardTitle>
            <CardDescription className="text-xs">
              Updated {format(new Date(resource.updated_at), "MMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {tryParseAndDisplayContent(resource.content)}
            </p>
          </CardContent>
          <CardFooter className="pt-0 pb-4">
            {resource.tags && resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {resource.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {resource.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{resource.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ResourceLibraryPage;