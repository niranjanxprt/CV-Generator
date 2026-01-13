'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserProfile, ExperienceEntry, EducationEntry, SkillCategory, LanguageEntry, ReferenceEntry } from '@/types';
import { Plus, Trash2, Check, Upload, X } from 'lucide-react';

// Validation schemas
const headerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Professional title is required'),
  location: z.string().min(1, 'Location is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
  linkedin: z.string(),
  github: z.string()
});

const experienceSchema = z.object({
  id: z.string(),
  jobTitle: z.string(),
  subtitle: z.string().optional(),
  company: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.object({
    id: z.string(),
    categoryLabel: z.string(),
    description: z.string(),
    keywords: z.array(z.string()).optional(),
    score: z.number().optional()
  }))
});

const educationSchema = z.object({
  id: z.string(),
  degree: z.string(),
  field: z.string(),
  institution: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  details: z.string().optional()
});

const skillSchema = z.object({
  name: z.string(),
  description: z.string(),
  keywords: z.array(z.string())
});

const skillCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  skills: z.array(skillSchema),
  relevanceScore: z.number().optional()
});

const languageSchema = z.object({
  id: z.string(),
  name: z.string(),
  proficiency: z.string()
});

const referenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  company: z.string(),
  email: z.string()
});

const profileSchema = z.object({
  header: headerSchema,
  summary: z.string().min(50, 'Summary must be at least 50 characters').max(500, 'Summary must be less than 500 characters'),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  skills: z.array(skillCategorySchema),
  languages: z.array(languageSchema),
  references: z.array(referenceSchema)
});

interface ProfileFormProps {
  initialProfile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
}

export function ProfileForm({ initialProfile, onProfileUpdate }: ProfileFormProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    getValues
  } = useForm<UserProfile>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialProfile,
    mode: 'onChange'
  });

  // Load saved profile photo on mount
  useEffect(() => {
    const savedPhoto = localStorage.getItem('profilePhoto');
    if (savedPhoto) {
      setProfilePhoto(savedPhoto);
    }
  }, []);

  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setProfilePhoto(base64);
        localStorage.setItem('profilePhoto', base64);
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
      setIsUploadingPhoto(false);
    }
  };

  // Remove photo
  const removePhoto = () => {
    setProfilePhoto(null);
    localStorage.removeItem('profilePhoto');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Debounced auto-save function
  const debouncedSave = useCallback((data: UserProfile) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const timeout = setTimeout(() => {
      setIsSaving(true);
      onProfileUpdate(data);
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000); // 1-second debounce

    saveTimeoutRef.current = timeout;
  }, [onProfileUpdate]);

  // Watch for form changes and trigger auto-save
  const watchedValues = watch();
  useEffect(() => {
    // Only save if values have actually changed and are different from initial
    const currentValues = JSON.stringify(watchedValues);
    const initialValues = JSON.stringify(initialProfile);
    
    if (currentValues !== initialValues && watchedValues) {
      debouncedSave(watchedValues);
    }
  }, [watchedValues, debouncedSave]); // Removed initialProfile from dependencies

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const addExperience = () => {
    const newExperience: ExperienceEntry = {
      id: crypto.randomUUID(),
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      bullets: []
    };
    const updatedExperience = [...profile.experience, newExperience];
    setProfile({ ...profile, experience: updatedExperience });
    setValue('experience', updatedExperience);
  };

  const removeExperience = (id: string) => {
    const updatedExperience = profile.experience.filter(exp => exp.id !== id);
    setProfile({ ...profile, experience: updatedExperience });
    setValue('experience', updatedExperience);
  };

  const addEducation = () => {
    const newEducation: EducationEntry = {
      id: crypto.randomUUID(),
      degree: '',
      field: '',
      institution: '',
      startDate: '',
      endDate: ''
    };
    const updatedEducation = [...profile.education, newEducation];
    setProfile({ ...profile, education: updatedEducation });
    setValue('education', updatedEducation);
  };

  const removeEducation = (id: string) => {
    const updatedEducation = profile.education.filter(edu => edu.id !== id);
    setProfile({ ...profile, education: updatedEducation });
    setValue('education', updatedEducation);
  };

  const addSkillCategory = () => {
    const newSkillCategory: SkillCategory = {
      id: crypto.randomUUID(),
      name: '',
      skills: []
    };
    const updatedSkills = [...profile.skills, newSkillCategory];
    setProfile({ ...profile, skills: updatedSkills });
    setValue('skills', updatedSkills);
  };

  const removeSkillCategory = (id: string) => {
    const updatedSkills = profile.skills.filter(skill => skill.id !== id);
    setProfile({ ...profile, skills: updatedSkills });
    setValue('skills', updatedSkills);
  };

  const addLanguage = () => {
    const newLanguage: LanguageEntry = {
      id: crypto.randomUUID(),
      name: '',
      proficiency: ''
    };
    const updatedLanguages = [...profile.languages, newLanguage];
    setProfile({ ...profile, languages: updatedLanguages });
    setValue('languages', updatedLanguages);
  };

  const removeLanguage = (id: string) => {
    const updatedLanguages = profile.languages.filter(lang => lang.id !== id);
    setProfile({ ...profile, languages: updatedLanguages });
    setValue('languages', updatedLanguages);
  };

  const addReference = () => {
    const newReference: ReferenceEntry = {
      id: crypto.randomUUID(),
      name: '',
      title: '',
      company: '',
      email: ''
    };
    const updatedReferences = [...profile.references, newReference];
    setProfile({ ...profile, references: updatedReferences });
    setValue('references', updatedReferences);
  };

  const removeReference = (id: string) => {
    const updatedReferences = profile.references.filter(ref => ref.id !== id);
    setProfile({ ...profile, references: updatedReferences });
    setValue('references', updatedReferences);
  };

  return (
    <form className="space-y-8">
      {/* Save Indicator */}
      <div className="flex justify-end">
        {isSaving && (
          <div className="flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Saving...
          </div>
        )}
        {lastSaved && !isSaving && (
          <div className="flex items-center text-sm text-green-600">
            <Check className="h-4 w-4 mr-2" />
            Saved at {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle>Header Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Photo Upload */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              {profilePhoto ? (
                <div className="relative">
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="photo-upload">Profile Photo</Label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="mr-2"
                >
                  {isUploadingPhoto ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                    </>
                  )}
                </Button>
                {profilePhoto && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={removePhoto}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Upload a professional photo (max 5MB, JPG/PNG)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="header.name">Full Name *</Label>
              <Input
                id="header.name"
                {...register('header.name')}
                placeholder="John Doe"
              />
              {errors.header?.name && (
                <p className="text-sm text-red-600 mt-1">{errors.header.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="header.title">Professional Title *</Label>
              <Input
                id="header.title"
                {...register('header.title')}
                placeholder="Senior Software Engineer"
              />
              {errors.header?.title && (
                <p className="text-sm text-red-600 mt-1">{errors.header.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="header.location">Location *</Label>
              <Input
                id="header.location"
                {...register('header.location')}
                placeholder="Berlin, Germany"
              />
              {errors.header?.location && (
                <p className="text-sm text-red-600 mt-1">{errors.header.location.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="header.phone">Phone Number *</Label>
              <Input
                id="header.phone"
                {...register('header.phone')}
                placeholder="+49 123 456 7890"
              />
              {errors.header?.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.header.phone.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="header.email">Email Address *</Label>
              <Input
                id="header.email"
                type="email"
                {...register('header.email')}
                placeholder="john.doe@example.com"
              />
              {errors.header?.email && (
                <p className="text-sm text-red-600 mt-1">{errors.header.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="header.linkedin">LinkedIn Profile</Label>
              <Input
                id="header.linkedin"
                {...register('header.linkedin')}
                placeholder="linkedin.com/in/johndoe"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="header.github">GitHub Profile</Label>
              <Input
                id="header.github"
                {...register('header.github')}
                placeholder="github.com/johndoe"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="summary">Summary *</Label>
            <Textarea
              id="summary"
              {...register('summary')}
              placeholder="Write a compelling professional summary highlighting your key achievements and expertise..."
              rows={4}
              className="mt-1"
            />
            <div className="flex justify-between mt-1">
              {errors.summary && (
                <p className="text-sm text-red-600">{errors.summary.message}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">
                {watch('summary')?.length || 0}/500 characters
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Work Experience</CardTitle>
            <Button type="button" onClick={addExperience} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.experience.map((exp, index) => (
            <div key={exp.id} className="border rounded-lg p-4 relative">
              <Button
                type="button"
                onClick={() => removeExperience(exp.id)}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                <div>
                  <Label htmlFor={`experience.${index}.jobTitle`}>Job Title</Label>
                  <Input
                    {...register(`experience.${index}.jobTitle` as const)}
                    placeholder="Senior Software Engineer"
                  />
                </div>
                <div>
                  <Label htmlFor={`experience.${index}.company`}>Company</Label>
                  <Input
                    {...register(`experience.${index}.company` as const)}
                    placeholder="Tech Company GmbH"
                  />
                </div>
                <div>
                  <Label htmlFor={`experience.${index}.location`}>Location</Label>
                  <Input
                    {...register(`experience.${index}.location` as const)}
                    placeholder="Berlin"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`experience.${index}.startDate`}>Start Date</Label>
                    <Input
                      {...register(`experience.${index}.startDate` as const)}
                      placeholder="MM/YYYY"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`experience.${index}.endDate`}>End Date</Label>
                    <Input
                      {...register(`experience.${index}.endDate` as const)}
                      placeholder="MM/YYYY or Present"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {profile.experience.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No work experience added yet. Click "Add Experience" to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Education Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Education</CardTitle>
            <Button type="button" onClick={addEducation} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.education.map((edu, index) => (
            <div key={edu.id} className="border rounded-lg p-4 relative">
              <Button
                type="button"
                onClick={() => removeEducation(edu.id)}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                <div>
                  <Label htmlFor={`education.${index}.degree`}>Degree</Label>
                  <Input
                    {...register(`education.${index}.degree` as const)}
                    placeholder="Bachelor of Science"
                  />
                </div>
                <div>
                  <Label htmlFor={`education.${index}.field`}>Field of Study</Label>
                  <Input
                    {...register(`education.${index}.field` as const)}
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <Label htmlFor={`education.${index}.institution`}>Institution</Label>
                  <Input
                    {...register(`education.${index}.institution` as const)}
                    placeholder="Technical University of Berlin"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`education.${index}.startDate`}>Start Date</Label>
                    <Input
                      {...register(`education.${index}.startDate` as const)}
                      placeholder="MM/YYYY"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`education.${index}.endDate`}>End Date</Label>
                    <Input
                      {...register(`education.${index}.endDate` as const)}
                      placeholder="MM/YYYY"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {profile.education.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No education entries added yet. Click "Add Education" to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Skills & Competencies</CardTitle>
            <Button type="button" onClick={addSkillCategory} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Skill Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.skills.map((skillCat, index) => (
            <div key={skillCat.id} className="border rounded-lg p-4 relative">
              <Button
                type="button"
                onClick={() => removeSkillCategory(skillCat.id)}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="pr-12">
                <div className="mb-4">
                  <Label htmlFor={`skills.${index}.name`}>Category Name</Label>
                  <Input
                    {...register(`skills.${index}.name` as const)}
                    placeholder="Programming Languages"
                  />
                </div>
              </div>
            </div>
          ))}
          {profile.skills.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No skill categories added yet. Click "Add Skill Category" to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Languages Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Languages</CardTitle>
            <Button type="button" onClick={addLanguage} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Language
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.languages.map((lang, index) => (
            <div key={lang.id} className="border rounded-lg p-4 relative">
              <Button
                type="button"
                onClick={() => removeLanguage(lang.id)}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                <div>
                  <Label htmlFor={`languages.${index}.name`}>Language</Label>
                  <Input
                    {...register(`languages.${index}.name` as const)}
                    placeholder="German"
                  />
                </div>
                <div>
                  <Label htmlFor={`languages.${index}.proficiency`}>Proficiency</Label>
                  <Input
                    {...register(`languages.${index}.proficiency` as const)}
                    placeholder="C2 - Native"
                  />
                </div>
              </div>
            </div>
          ))}
          {profile.languages.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No languages added yet. Click "Add Language" to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* References Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>References</CardTitle>
            <Button type="button" onClick={addReference} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Reference
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.references.map((ref, index) => (
            <div key={ref.id} className="border rounded-lg p-4 relative">
              <Button
                type="button"
                onClick={() => removeReference(ref.id)}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                <div>
                  <Label htmlFor={`references.${index}.name`}>Name</Label>
                  <Input
                    {...register(`references.${index}.name` as const)}
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                <div>
                  <Label htmlFor={`references.${index}.title`}>Title</Label>
                  <Input
                    {...register(`references.${index}.title` as const)}
                    placeholder="Senior Manager"
                  />
                </div>
                <div>
                  <Label htmlFor={`references.${index}.company`}>Company</Label>
                  <Input
                    {...register(`references.${index}.company` as const)}
                    placeholder="Tech Company GmbH"
                  />
                </div>
                <div>
                  <Label htmlFor={`references.${index}.email`}>Email</Label>
                  <Input
                    {...register(`references.${index}.email` as const)}
                    placeholder="jane.smith@company.com"
                  />
                </div>
              </div>
            </div>
          ))}
          {profile.references.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No references added yet. Click "Add Reference" to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  );
}