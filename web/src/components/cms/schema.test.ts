
import { describe, it, expect } from 'vitest';
import { articleSchema } from './schema';

describe('CMS Article Schema', () => {
  it('accepts RESSOURCE category', () => {
    const validData = {
      title: 'Test Title',
      slug: 'test-title',
      category: 'RESSOURCE',
      status: 'DRAFT',
      content: 'Some content',
    };
    
    const result = articleSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts COMMUNIQUE category', () => {
    const validData = {
      title: 'Test Title',
      slug: 'test-title',
      category: 'COMMUNIQUE',
      status: 'PUBLISHED',
      content: 'Some content',
    };
    
    const result = articleSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('validates required fields', () => {
     const invalidData = {
      title: '', // Empty title
      slug: 'invalid slug', // Invalid slug format
      // Missing category/status/content
    };
    
    const result = articleSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
       const errors = result.error.flatten().fieldErrors;
       expect(errors.title).toBeDefined();
       expect(errors.slug).toBeDefined();
       expect(errors.category).toBeDefined();
       expect(errors.content).toBeDefined();
    }
  });
});
