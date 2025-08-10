import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { JustifiedField, JustifiedArrayField } from './JustifiedField';
import { CampaignData, TeamMember, Testimonial, ContactInfo } from '@/types/campaign';

interface ProjectDescriptionStepProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
}

export const ProjectDescriptionStep: React.FC<ProjectDescriptionStepProps> = ({
  data,
  onUpdate,
}) => {
  const updateField = (field: keyof CampaignData, value: any) => {
    onUpdate({
      [field]: {
        value,
        justification: data[field]?.justification || '',
      },
    });
  };

  const updateNestedField = (field: keyof CampaignData, subfield: string, value: any) => {
    const currentValue = data[field]?.value || {};
    onUpdate({
      [field]: {
        value: {
          ...currentValue,
          [subfield]: value,
        },
        justification: data[field]?.justification || '',
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Project Description</h2>
        <p className="text-muted-foreground">
          Define your ministry's mission, team, and impact story
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JustifiedField
            label="Project Title"
            value={data.title?.value}
            justification={data.title?.justification || ''}
            onChange={(value) => updateField('title', value)}
            required
            placeholder="Enter your ministry project title"
          />

          <JustifiedField
            label="Community"
            value={data.church_name?.value}
            justification={data.church_name?.justification || ''}
            onChange={(value) => updateField('church_name', value)}
            required
            placeholder="Enter your church name"
          />

          <JustifiedField
            label="Mission Statement"
            value={data.mission_statement?.value}
            justification={data.mission_statement?.justification || ''}
            onChange={(value) => updateField('mission_statement', value)}
            type="textarea"
            rows={2}
            required
            placeholder="Enter your mission statement"
          />

          <JustifiedField
            label="Project Description"
            value={data.description?.value}
            justification={data.description?.justification || ''}
            onChange={(value) => updateField('description', value)}
            type="textarea"
            rows={4}
            required
            placeholder="Provide a detailed description of your project"
          />
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JustifiedField
            label="Email"
            value={data.contact_info?.value?.email}
            justification={data.contact_info?.justification || ''}
            onChange={(value) => updateNestedField('contact_info', 'email', value)}
            type="email"
            required
            placeholder="contact@yourchurch.org"
          />

          <JustifiedField
            label="Phone"
            value={data.contact_info?.value?.phone}
            justification={data.contact_info?.justification || ''}
            onChange={(value) => updateNestedField('contact_info', 'phone', value)}
            placeholder="+1-555-123-4567"
          />

          <JustifiedField
            label="Website"
            value={data.contact_info?.value?.website}
            justification={data.contact_info?.justification || ''}
            onChange={(value) => updateNestedField('contact_info', 'website', value)}
            type="url"
            placeholder="https://yourchurch.org"
          />
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <JustifiedArrayField
            label="Team Members"
            items={data.team?.value || []}
            justification={data.team?.justification || ''}
            onItemsChange={(items) => updateField('team', items)}
            addButtonText="Add Team Member"
            onAddItem={() => ({ name: '', role: '', bio: '' })}
            renderItem={(member: TeamMember, index, onUpdate, onRemove) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Team Member {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => onUpdate({ ...member, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => onUpdate({ ...member, role: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Position/Role"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Bio</label>
                    <textarea
                      value={member.bio}
                      onChange={(e) => onUpdate({ ...member, bio: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="Brief biography and qualifications"
                    />
                  </div>
                </div>
              </Card>
            )}
          />
        </CardContent>
      </Card>

      {/* Testimonials */}
      <Card>
        <CardHeader>
          <CardTitle>Testimonials</CardTitle>
        </CardHeader>
        <CardContent>
          <JustifiedArrayField
            label="Testimonials"
            items={data.testimonials?.value || []}
            justification={data.testimonials?.justification || ''}
            onItemsChange={(items) => updateField('testimonials', items)}
            addButtonText="Add Testimonial"
            onAddItem={() => ({ author: '', quote: '' })}
            renderItem={(testimonial: Testimonial, index, onUpdate, onRemove) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">Testimonial {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Author</label>
                    <input
                      type="text"
                      value={testimonial.author}
                      onChange={(e) => onUpdate({ ...testimonial, author: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Name and title/role"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quote</label>
                    <textarea
                      value={testimonial.quote}
                      onChange={(e) => onUpdate({ ...testimonial, quote: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="Testimonial quote"
                    />
                  </div>
                </div>
              </Card>
            )}
          />
        </CardContent>
      </Card>

      {/* Media URLs */}
      <Card>
        <CardHeader>
          <CardTitle>Media Assets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <JustifiedArrayField
            label="Media URLs"
            items={data.media_urls?.value || []}
            justification={data.media_urls?.justification || ''}
            onItemsChange={(items) => updateField('media_urls', items)}
            addButtonText="Add Media URL"
            onAddItem={() => ''}
            renderItem={(url: string, index, onUpdate, onRemove) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => onUpdate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://example.com/image.jpg"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          />

          <JustifiedArrayField
            label="Logo URLs"
            items={data.logo?.value || []}
            justification={data.logo?.justification || ''}
            onItemsChange={(items) => updateField('logo', items)}
            addButtonText="Add Logo URL"
            onAddItem={() => ''}
            renderItem={(url: string, index, onUpdate, onRemove) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => onUpdate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://example.com/logo.png"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};
