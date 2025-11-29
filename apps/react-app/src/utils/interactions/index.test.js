/**
 * Tests for interactions utils index exports
 */
import * as interactions from './index';
import { validators, validate } from './validation';
import {
  fadeInUp,
  fadeIn,
  slideIn,
  scaleIn,
  staggerChildren,
  listItemVariants
} from './animations';
import {
  formatDate,
  formatFileSize,
  formatNumber,
  truncateText
} from './formatters';

describe('interactions/index', () => {
  describe('Validation Exports', () => {
    it('exports validators', () => {
      expect(interactions.validators).toBeDefined();
      expect(interactions.validators).toBe(validators);
    });

    it('exports validate function', () => {
      expect(interactions.validate).toBeDefined();
      expect(interactions.validate).toBe(validate);
    });
  });

  describe('Animation Exports', () => {
    it('exports fadeInUp', () => {
      expect(interactions.fadeInUp).toBeDefined();
      expect(interactions.fadeInUp).toBe(fadeInUp);
    });

    it('exports fadeIn', () => {
      expect(interactions.fadeIn).toBeDefined();
      expect(interactions.fadeIn).toBe(fadeIn);
    });

    it('exports slideIn', () => {
      expect(interactions.slideIn).toBeDefined();
      expect(interactions.slideIn).toBe(slideIn);
    });

    it('exports scaleIn', () => {
      expect(interactions.scaleIn).toBeDefined();
      expect(interactions.scaleIn).toBe(scaleIn);
    });

    it('exports staggerChildren', () => {
      expect(interactions.staggerChildren).toBeDefined();
      expect(interactions.staggerChildren).toBe(staggerChildren);
    });

    it('exports listItemVariants', () => {
      expect(interactions.listItemVariants).toBeDefined();
      expect(interactions.listItemVariants).toBe(listItemVariants);
    });
  });

  describe('Formatter Exports', () => {
    it('exports formatDate', () => {
      expect(interactions.formatDate).toBeDefined();
      expect(interactions.formatDate).toBe(formatDate);
    });

    it('exports formatFileSize', () => {
      expect(interactions.formatFileSize).toBeDefined();
      expect(interactions.formatFileSize).toBe(formatFileSize);
    });

    it('exports formatNumber', () => {
      expect(interactions.formatNumber).toBeDefined();
      expect(interactions.formatNumber).toBe(formatNumber);
    });

    it('exports truncateText', () => {
      expect(interactions.truncateText).toBeDefined();
      expect(interactions.truncateText).toBe(truncateText);
    });
  });

  describe('All Exports', () => {
    it('exports all validation utilities', () => {
      expect(interactions).toHaveProperty('validators');
      expect(interactions).toHaveProperty('validate');
    });

    it('exports all animations', () => {
      expect(interactions).toHaveProperty('fadeInUp');
      expect(interactions).toHaveProperty('fadeIn');
      expect(interactions).toHaveProperty('slideIn');
      expect(interactions).toHaveProperty('scaleIn');
      expect(interactions).toHaveProperty('staggerChildren');
      expect(interactions).toHaveProperty('listItemVariants');
    });

    it('exports all formatters', () => {
      expect(interactions).toHaveProperty('formatDate');
      expect(interactions).toHaveProperty('formatFileSize');
      expect(interactions).toHaveProperty('formatNumber');
      expect(interactions).toHaveProperty('truncateText');
    });
  });

  describe('Export Count', () => {
    it('exports expected number of items', () => {
      const exportCount = Object.keys(interactions).length;
      // 2 validation + 6 animations + 4 formatters = 12 exports
      expect(exportCount).toBe(12);
    });
  });

  describe('No Default Export', () => {
    it('does not export default', () => {
      expect(interactions.default).toBeUndefined();
    });
  });

  describe('Functionality', () => {
    it('validators work when imported from index', () => {
      expect(interactions.validators.email('test@example.com')).toBe(null);
      expect(interactions.validators.required('')).toBe('This field is required');
    });

    it('validate works when imported from index', () => {
      const rules = [interactions.validators.required];
      expect(interactions.validate('value', rules)).toBe(null);
    });

    it('formatters work when imported from index', () => {
      expect(typeof interactions.formatDate(new Date())).toBe('string');
      expect(interactions.formatFileSize(1024)).toBe('1 KB');
      expect(typeof interactions.formatNumber(1000)).toBe('string');
      expect(interactions.truncateText('Hello World', 5)).toBe('He...');
    });

    it('animations are objects when imported from index', () => {
      expect(typeof interactions.fadeIn).toBe('object');
      expect(interactions.fadeIn).toHaveProperty('initial');
      expect(interactions.fadeIn).toHaveProperty('animate');
      expect(interactions.fadeIn).toHaveProperty('exit');
    });
  });

  describe('Import Paths', () => {
    it('can destructure validation exports', () => {
      const { validators: v, validate: val } = interactions;
      expect(v).toBeDefined();
      expect(val).toBeDefined();
    });

    it('can destructure animation exports', () => {
      const { fadeIn: fi, slideIn: si } = interactions;
      expect(fi).toBeDefined();
      expect(si).toBeDefined();
    });

    it('can destructure formatter exports', () => {
      const { formatDate: fd, formatFileSize: ffs } = interactions;
      expect(fd).toBeDefined();
      expect(ffs).toBeDefined();
    });
  });
});
