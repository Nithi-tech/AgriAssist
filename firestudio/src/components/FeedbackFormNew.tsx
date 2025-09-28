'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Heart } from 'lucide-react';

export default function FeedbackForm() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    message: '',
    contactEmail: '',
    optIn: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.message.trim()) {
      newErrors.message = 'Feedback message is required';
    } else if (formData.message.trim().length < 5) {
      newErrors.message = 'Feedback must be at least 5 characters';
    }
    
    if (formData.optIn && formData.contactEmail) {
      if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
        newErrors.contactEmail = 'Valid email is required if you want to be contacted';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          language: language,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Thank you!',
          description: 'Your feedback has been submitted successfully.',
          duration: 5000,
        });
        
        setFormData({ message: '', contactEmail: '', optIn: false });
      } else {
        throw new Error(result.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback form error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit your feedback. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="feedback-message">Your Feedback</Label>
        <Textarea
          id="feedback-message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Share your thoughts, suggestions, or report issues..."
          className={`min-h-[120px] ${errors.message ? 'border-destructive' : ''}`}
          disabled={isSubmitting}
        />
        {errors.message && (
          <p className="text-sm text-destructive">{errors.message}</p>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="feedback-optin"
            name="optIn"
            checked={formData.optIn}
            onCheckedChange={(checked) => {
              setFormData(prev => ({ ...prev, optIn: checked as boolean }));
              if (!checked) {
                setFormData(prev => ({ ...prev, contactEmail: '' }));
              }
            }}
            disabled={isSubmitting}
          />
          <Label htmlFor="feedback-optin" className="text-sm">
            I would like to be contacted about this feedback
          </Label>
        </div>
        
        {formData.optIn && (
          <div className="space-y-2">
            <Label htmlFor="feedback-email">Contact Email</Label>
            <Input
              id="feedback-email"
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="Enter your email to be contacted"
              className={errors.contactEmail ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {errors.contactEmail && (
              <p className="text-sm text-destructive">{errors.contactEmail}</p>
            )}
          </div>
        )}
      </div>
      
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Heart className="mr-2 h-4 w-4" />
            Submit Feedback
          </>
        )}
      </Button>
    </form>
  );
}
