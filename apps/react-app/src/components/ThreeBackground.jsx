import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create network of particles with connecting lines
    const particleGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });

    const particles = [];
    const particleCount = 40;
    const maxDistance = 12; // Distance to draw lines between particles

    // Calculate spread based on banner dimensions (wider, shorter)
    const aspectRatio = width / height;
    const spreadX = 50 * aspectRatio; // Wider spread for wide banners
    const spreadY = 15; // Shorter vertical spread
    const spreadZ = 20;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      // Random position - spread across entire banner width and height
      particle.position.x = (Math.random() - 0.5) * spreadX;
      particle.position.y = (Math.random() - 0.5) * spreadY;
      particle.position.z = (Math.random() - 0.5) * spreadZ;

      // Random velocity for infinite movement
      particle.userData = {
        velocityX: (Math.random() - 0.5) * 0.02,
        velocityY: (Math.random() - 0.5) * 0.01,
        velocityZ: (Math.random() - 0.5) * 0.015,
        maxX: spreadX / 2,
        maxY: spreadY / 2,
        maxZ: spreadZ / 2
      };

      scene.add(particle);
      particles.push(particle);
    }

    // Line material
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2
    });

    // Lines group
    let linesGroup = new THREE.Group();
    scene.add(linesGroup);

    camera.position.z = 30;

    // Function to update lines
    const updateLines = () => {
      // Remove old lines
      linesGroup.children.forEach(line => {
        line.geometry.dispose();
      });
      linesGroup.clear();

      // Create new lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const distance = particles[i].position.distanceTo(particles[j].position);

          if (distance < maxDistance) {
            const points = [particles[i].position, particles[j].position];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            linesGroup.add(line);
          }
        }
      }
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Move particles infinitely
      particles.forEach(particle => {
        particle.position.x += particle.userData.velocityX;
        particle.position.y += particle.userData.velocityY;
        particle.position.z += particle.userData.velocityZ;

        // Wrap around when particles go too far
        if (Math.abs(particle.position.x) > particle.userData.maxX) particle.position.x *= -1;
        if (Math.abs(particle.position.y) > particle.userData.maxY) particle.position.y *= -1;
        if (Math.abs(particle.position.z) > particle.userData.maxZ) particle.position.z *= -1;
      });

      // Update lines every frame
      updateLines();

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = container.offsetWidth;
      const newHeight = container.offsetHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      linesGroup.children.forEach(line => {
        line.geometry.dispose();
      });
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
