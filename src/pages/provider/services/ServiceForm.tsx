import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react';

// Define form schema using Zod
const serviceFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  price_unit: z.string().min(1, 'Please select a price unit'),
  service_type: z.enum(['one_time', 'subscription', 'consultation'], {
    required_error: 'Please select a service type',
  }),
  category_id: z.string().min(1, 'Please select a category'),
  duration_minutes: z.coerce.number().min(1, 'Duration must be at least 1 minute').optional(),
  is_online: z.boolean().default(true),
  is_in_person: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  status: z.enum(['draft', 'active', 'paused']).default('draft'),
  tags: z.string().optional(),
  // Note: images are handled separately in the component state
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

// Default form values
const defaultValues: Partial<ServiceFormValues> = {
  title: '',
  description: '',
  price: 0,
  price_unit: 'hour',
  service_type: 'one_time',
  duration_minutes: 60,
  is_online: true,
  is_in_person: false,
  is_featured: false,
  status: 'draft',
  tags: '',
};

// Mock categories - in a real app, these would come from your database
const categories = [
  { id: '1', name: 'Music Ministry' },
  { id: '2', name: 'Preaching' },
  { id: '3', name: 'Worship Leading' },
  { id: '4', name: 'Youth Ministry' },
  { id: '5', name: 'Counseling' },
];

const ServiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  // Initialize form
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Watch service type to conditionally show/hide fields
  const serviceType = form.watch('service_type');
  const isOnline = form.watch('is_online');
  const isInPerson = form.watch('is_in_person');

  // Fetch service data if in edit mode
  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch service data
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .eq('id', id)
          .single();
          
        if (serviceError) throw serviceError;
        
        if (serviceData) {
          // Set form values
          form.reset({
            title: serviceData.title,
            description: serviceData.description,
            price: serviceData.price,
            price_unit: serviceData.price_unit,
            service_type: serviceData.service_type,
            category_id: serviceData.category_id,
            duration_minutes: serviceData.duration_minutes,
            is_online: serviceData.is_online,
            is_in_person: serviceData.is_in_person,
            is_featured: serviceData.is_featured,
            status: serviceData.status,
            tags: Array.isArray(serviceData.tags) ? serviceData.tags.join(', ') : '',
          });
          
          // Set images if they exist
          if (serviceData.images && serviceData.images.length > 0) {
            setImages(serviceData.images);
          }
        }
      } catch (error) {
        console.error('Error fetching service:', error);
        toast({
          title: 'Error',
          description: 'Failed to load service data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('service_categories')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        
        if (data) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
    if (isEditMode) {
      fetchService();
    }
  }, [id, isEditMode, form]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `services/${fileName}`;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('services')
        .getPublicUrl(filePath);
      
      // Add to images array
      setImages(prev => [...prev, publicUrl]);
      
      toast({
        title: 'Success',
        description: 'Image uploaded successfully.',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = async (data: ServiceFormValues) => {
    try {
      setIsLoading(true);
      
      // Format tags
      const tags = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      const serviceData = {
        ...data,
        tags,
        images,
        duration_minutes: data.service_type === 'consultation' ? data.duration_minutes : null,
        provider_id: (await supabase.auth.getUser()).data.user?.id,
      };
      
      if (isEditMode && id) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', id);
          
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Service updated successfully!',
        });
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);
          
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Service created successfully!',
        });
      }
      
      // Redirect to services list
      navigate('/provider/dashboard/services');
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: 'Error',
        description: 'Failed to save service. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      
      // Delete service
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Service deleted successfully.',
      });
      
      // Redirect to services list
      navigate('/provider/dashboard/services');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete service. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/provider/dashboard/services">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditMode ? 'Edit Service' : 'Create New Service'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode 
                ? 'Update your service details' 
                : 'Fill in the details to create a new service'}
            </p>
          </div>
          
          {isEditMode && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Service'}
              </Button>
              <Button 
                size="sm" 
                onClick={form.handleSubmit(onSubmit)}
                disabled={isLoading || isDeleting}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Provide the basic details about your service.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Title *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Sunday Worship Service" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            A clear and descriptive title for your service.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your service in detail..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a detailed description of what clients can expect.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="service_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Type *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select service type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="one_time">One-time Service</SelectItem>
                                <SelectItem value="subscription">Subscription</SelectItem>
                                <SelectItem value="consultation">Consultation</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {serviceType === 'consultation' && (
                      <FormField
                        control={form.control}
                        name="duration_minutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              How long does this service typically take?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <div className="space-y-2">
                      <FormLabel>Service Availability</FormLabel>
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="is_online"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Available Online</FormLabel>
                                <FormDescription>
                                  This service can be provided remotely (e.g., via video call).
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="is_in_person"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Available In-Person</FormLabel>
                                <FormDescription>
                                  This service requires in-person attendance.
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., worship, preaching, counseling" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Add relevant tags separated by commas to help clients find your service.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                {/* Media */}
                <Card>
                  <CardHeader>
                    <CardTitle>Media</CardTitle>
                    <CardDescription>
                      Add images to showcase your service.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {images.map((src, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={src}
                              alt={`Service image ${index + 1}`}
                              className="rounded-md h-32 w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        
                        {images.length < 10 && (
                          <label 
                            htmlFor="image-upload"
                            className={`
                              border-2 border-dashed rounded-md flex flex-col items-center justify-center 
                              h-32 cursor-pointer hover:bg-muted/50 transition-colors
                              ${uploading ? 'opacity-50' : ''}
                            `}
                          >
                            {uploading ? (
                              <div className="text-center p-2">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                                <p className="text-xs text-muted-foreground">
                                  {Math.round(uploadProgress)}% Uploaded
                                </p>
                              </div>
                            ) : (
                              <div className="text-center p-2">
                                <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  Add Image
                                </p>
                              </div>
                            )}
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={uploading}
                            />
                          </label>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Upload up to 10 images. The first image will be used as the main image.
                        Recommended size: 1200x800px. Max file size: 5MB.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing</CardTitle>
                    <CardDescription>
                      Set your pricing and payment options.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price *</FormLabel>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01"
                                  className="pl-8"
                                  {...field} 
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="price_unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price Unit *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="hour">per hour</SelectItem>
                                <SelectItem value="session">per session</SelectItem>
                                <SelectItem value="day">per day</SelectItem>
                                <SelectItem value="week">per week</SelectItem>
                                <SelectItem value="month">per month</SelectItem>
                                <SelectItem value="event">per event</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {serviceType === 'subscription' && (
                      <div className="p-4 bg-muted/50 rounded-md">
                        <p className="text-sm text-muted-foreground">
                          For subscription services, the price will be charged on a recurring basis 
                          (weekly/monthly) based on your service settings.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                {/* Publish */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="paused">Paused</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="is_featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2 hover:bg-muted/50">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Feature this service</FormLabel>
                            <FormDescription className="text-xs">
                              Featured services appear at the top of search results.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : isEditMode ? (
                          'Update Service'
                        ) : (
                          'Create Service'
                        )}
                      </Button>
                      
                      {!isEditMode && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full mt-2"
                          onClick={() => form.reset()}
                          disabled={isLoading}
                        >
                          Reset Form
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      How your service will appear to clients.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <div className="aspect-video bg-muted flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium line-clamp-1">
                          {form.watch('title') || 'Service Title'}
                        </h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">
                            {form.watch('price') ? `$${form.watch('price')} / ${form.watch('price_unit')}` : 'Free'}
                          </span>
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">
                            {form.watch('service_type') ? 
                              form.watch('service_type').split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ') 
                              : 'One-time'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Service'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceForm;
