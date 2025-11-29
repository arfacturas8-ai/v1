/**
 * Tests for animation configurations
 */
import {
  fadeInUp,
  fadeIn,
  slideIn,
  scaleIn,
  staggerChildren,
  listItemVariants
} from './animations';

describe('animations', () => {
  describe('fadeInUp', () => {
    it('has initial state', () => {
      expect(fadeInUp.initial).toEqual({ opacity: 0, y: 20 });
    });

    it('has animate state', () => {
      expect(fadeInUp.animate).toEqual({ opacity: 1, y: 0 });
    });

    it('has exit state', () => {
      expect(fadeInUp.exit).toEqual({ opacity: 0, y: -20 });
    });

    it('has transition configuration', () => {
      expect(fadeInUp.transition).toEqual({ duration: 0.3 });
    });

    it('contains all required properties', () => {
      expect(fadeInUp).toHaveProperty('initial');
      expect(fadeInUp).toHaveProperty('animate');
      expect(fadeInUp).toHaveProperty('exit');
      expect(fadeInUp).toHaveProperty('transition');
    });
  });

  describe('fadeIn', () => {
    it('has initial state', () => {
      expect(fadeIn.initial).toEqual({ opacity: 0 });
    });

    it('has animate state', () => {
      expect(fadeIn.animate).toEqual({ opacity: 1 });
    });

    it('has exit state', () => {
      expect(fadeIn.exit).toEqual({ opacity: 0 });
    });

    it('has transition configuration', () => {
      expect(fadeIn.transition).toEqual({ duration: 0.2 });
    });

    it('only animates opacity', () => {
      expect(fadeIn.initial).not.toHaveProperty('y');
      expect(fadeIn.initial).not.toHaveProperty('x');
      expect(fadeIn.initial).not.toHaveProperty('scale');
    });
  });

  describe('slideIn', () => {
    it('has initial state', () => {
      expect(slideIn.initial).toEqual({ x: -100, opacity: 0 });
    });

    it('has animate state', () => {
      expect(slideIn.animate).toEqual({ x: 0, opacity: 1 });
    });

    it('has exit state', () => {
      expect(slideIn.exit).toEqual({ x: 100, opacity: 0 });
    });

    it('has spring transition configuration', () => {
      expect(slideIn.transition).toEqual({
        type: 'spring',
        stiffness: 300,
        damping: 30
      });
    });

    it('uses spring animation', () => {
      expect(slideIn.transition.type).toBe('spring');
    });

    it('has stiffness value', () => {
      expect(slideIn.transition.stiffness).toBe(300);
    });

    it('has damping value', () => {
      expect(slideIn.transition.damping).toBe(30);
    });
  });

  describe('scaleIn', () => {
    it('has initial state', () => {
      expect(scaleIn.initial).toEqual({ scale: 0.9, opacity: 0 });
    });

    it('has animate state', () => {
      expect(scaleIn.animate).toEqual({ scale: 1, opacity: 1 });
    });

    it('has exit state', () => {
      expect(scaleIn.exit).toEqual({ scale: 0.9, opacity: 0 });
    });

    it('has transition configuration', () => {
      expect(scaleIn.transition).toEqual({ duration: 0.2 });
    });

    it('animates scale from 0.9 to 1', () => {
      expect(scaleIn.initial.scale).toBe(0.9);
      expect(scaleIn.animate.scale).toBe(1);
    });
  });

  describe('staggerChildren', () => {
    it('has animate configuration', () => {
      expect(staggerChildren.animate).toBeDefined();
    });

    it('has transition with stagger delay', () => {
      expect(staggerChildren.animate.transition).toEqual({
        staggerChildren: 0.1
      });
    });

    it('staggers children by 0.1 seconds', () => {
      expect(staggerChildren.animate.transition.staggerChildren).toBe(0.1);
    });

    it('only has animate property', () => {
      expect(Object.keys(staggerChildren)).toEqual(['animate']);
    });
  });

  describe('listItemVariants', () => {
    it('has initial state', () => {
      expect(listItemVariants.initial).toEqual({ opacity: 0, x: -20 });
    });

    it('has animate state', () => {
      expect(listItemVariants.animate).toEqual({ opacity: 1, x: 0 });
    });

    it('has exit state', () => {
      expect(listItemVariants.exit).toEqual({ opacity: 0, x: 20 });
    });

    it('slides from left on enter', () => {
      expect(listItemVariants.initial.x).toBe(-20);
      expect(listItemVariants.animate.x).toBe(0);
    });

    it('slides to right on exit', () => {
      expect(listItemVariants.exit.x).toBe(20);
    });
  });

  describe('Animation Properties', () => {
    it('all animations have initial state', () => {
      expect(fadeInUp).toHaveProperty('initial');
      expect(fadeIn).toHaveProperty('initial');
      expect(slideIn).toHaveProperty('initial');
      expect(scaleIn).toHaveProperty('initial');
      expect(listItemVariants).toHaveProperty('initial');
    });

    it('all animations have animate state', () => {
      expect(fadeInUp).toHaveProperty('animate');
      expect(fadeIn).toHaveProperty('animate');
      expect(slideIn).toHaveProperty('animate');
      expect(scaleIn).toHaveProperty('animate');
      expect(staggerChildren).toHaveProperty('animate');
      expect(listItemVariants).toHaveProperty('animate');
    });

    it('all item animations have exit state', () => {
      expect(fadeInUp).toHaveProperty('exit');
      expect(fadeIn).toHaveProperty('exit');
      expect(slideIn).toHaveProperty('exit');
      expect(scaleIn).toHaveProperty('exit');
      expect(listItemVariants).toHaveProperty('exit');
    });

    it('all item animations fade in', () => {
      expect(fadeInUp.initial.opacity).toBe(0);
      expect(fadeIn.initial.opacity).toBe(0);
      expect(slideIn.initial.opacity).toBe(0);
      expect(scaleIn.initial.opacity).toBe(0);
      expect(listItemVariants.initial.opacity).toBe(0);
    });

    it('all item animations reach full opacity', () => {
      expect(fadeInUp.animate.opacity).toBe(1);
      expect(fadeIn.animate.opacity).toBe(1);
      expect(slideIn.animate.opacity).toBe(1);
      expect(scaleIn.animate.opacity).toBe(1);
      expect(listItemVariants.animate.opacity).toBe(1);
    });
  });

  describe('Transition Durations', () => {
    it('fadeInUp has 0.3s duration', () => {
      expect(fadeInUp.transition.duration).toBe(0.3);
    });

    it('fadeIn has 0.2s duration', () => {
      expect(fadeIn.transition.duration).toBe(0.2);
    });

    it('scaleIn has 0.2s duration', () => {
      expect(scaleIn.transition.duration).toBe(0.2);
    });

    it('slideIn uses spring animation without duration', () => {
      expect(slideIn.transition.duration).toBeUndefined();
      expect(slideIn.transition.type).toBe('spring');
    });
  });

  describe('Animation Direction', () => {
    it('fadeInUp moves up on entry', () => {
      expect(fadeInUp.initial.y).toBeGreaterThan(0);
      expect(fadeInUp.animate.y).toBe(0);
    });

    it('fadeInUp moves down on exit', () => {
      expect(fadeInUp.exit.y).toBeLessThan(0);
    });

    it('slideIn moves from left to center', () => {
      expect(slideIn.initial.x).toBeLessThan(0);
      expect(slideIn.animate.x).toBe(0);
    });

    it('slideIn moves to right on exit', () => {
      expect(slideIn.exit.x).toBeGreaterThan(0);
    });

    it('listItemVariants moves from left', () => {
      expect(listItemVariants.initial.x).toBe(-20);
      expect(listItemVariants.animate.x).toBe(0);
    });

    it('listItemVariants moves to right on exit', () => {
      expect(listItemVariants.exit.x).toBe(20);
    });
  });

  describe('Scale Animation', () => {
    it('scaleIn starts slightly smaller', () => {
      expect(scaleIn.initial.scale).toBeLessThan(1);
    });

    it('scaleIn reaches normal scale', () => {
      expect(scaleIn.animate.scale).toBe(1);
    });

    it('scaleIn exits to smaller scale', () => {
      expect(scaleIn.exit.scale).toBeLessThan(1);
    });
  });

  describe('Stagger Configuration', () => {
    it('stagger delay is reasonable', () => {
      const delay = staggerChildren.animate.transition.staggerChildren;
      expect(delay).toBeGreaterThan(0);
      expect(delay).toBeLessThan(1);
    });

    it('stagger delay is numeric', () => {
      expect(typeof staggerChildren.animate.transition.staggerChildren).toBe('number');
    });
  });

  describe('Type Checking', () => {
    it('opacity values are numeric', () => {
      expect(typeof fadeIn.initial.opacity).toBe('number');
      expect(typeof fadeIn.animate.opacity).toBe('number');
    });

    it('position values are numeric', () => {
      expect(typeof fadeInUp.initial.y).toBe('number');
      expect(typeof slideIn.initial.x).toBe('number');
    });

    it('scale values are numeric', () => {
      expect(typeof scaleIn.initial.scale).toBe('number');
      expect(typeof scaleIn.animate.scale).toBe('number');
    });

    it('duration values are numeric', () => {
      expect(typeof fadeIn.transition.duration).toBe('number');
      expect(typeof fadeInUp.transition.duration).toBe('number');
    });

    it('spring config values are numeric', () => {
      expect(typeof slideIn.transition.stiffness).toBe('number');
      expect(typeof slideIn.transition.damping).toBe('number');
    });
  });

  describe('Default Export', () => {
    it('exports all animations as default', async () => {
      const defaultExport = (await import('./animations')).default;

      expect(defaultExport).toHaveProperty('fadeInUp');
      expect(defaultExport).toHaveProperty('fadeIn');
      expect(defaultExport).toHaveProperty('slideIn');
      expect(defaultExport).toHaveProperty('scaleIn');
      expect(defaultExport).toHaveProperty('staggerChildren');
      expect(defaultExport).toHaveProperty('listItemVariants');
    });

    it('default export matches named exports', async () => {
      const defaultExport = (await import('./animations')).default;

      expect(defaultExport.fadeInUp).toEqual(fadeInUp);
      expect(defaultExport.fadeIn).toEqual(fadeIn);
      expect(defaultExport.slideIn).toEqual(slideIn);
      expect(defaultExport.scaleIn).toEqual(scaleIn);
      expect(defaultExport.staggerChildren).toEqual(staggerChildren);
      expect(defaultExport.listItemVariants).toEqual(listItemVariants);
    });
  });

  describe('Immutability', () => {
    it('animations are objects', () => {
      expect(typeof fadeIn).toBe('object');
      expect(typeof fadeInUp).toBe('object');
      expect(typeof slideIn).toBe('object');
    });

    it('animation states are objects', () => {
      expect(typeof fadeIn.initial).toBe('object');
      expect(typeof fadeIn.animate).toBe('object');
      expect(typeof fadeIn.exit).toBe('object');
    });
  });
});
