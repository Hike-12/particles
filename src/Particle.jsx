import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// --- CONFIGURATION ---
const PARTICLE_COUNT = 8000;
const FRICTION = 0.85;

// --- SHADERS ---
const vertexShader = `
  attribute float size;
  attribute vec3 color;
  attribute float alpha;
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vColor = color;
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 1.5);
    
    gl_FragColor = vec4(vColor, strength * vAlpha * 0.6);
  }
`;

// Scroll progress context
const ScrollContext = React.createContext(0);

// --- MAIN COMPONENT ---
export default function ScrollParticleSystem() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(Math.max(window.scrollY / scrollHeight, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Autoscroll state
  const [autoScrolling, setAutoScrolling] = useState(false);
  const animationFrameRef = useRef();

  // Autoscroll handler
  useEffect(() => {
    if (!autoScrolling) return;
    const perfectDuration = 30000; // ms for full scroll (tweak for "perfect pace")
    const startY = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const startTime = performance.now();

    function step(now) {
      if (!autoScrolling) return; // Stop if toggled off
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / perfectDuration, 1);
      const targetY = startY + (scrollHeight - startY) * progress;
      window.scrollTo({ top: targetY });
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        setAutoScrolling(false);
      }
    }
    animationFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [autoScrolling]);

  return (
    <div ref={containerRef} className="relative">
      {/* Scrollable sections */}
      <div className="h-[500vh]">
        {/* Fixed Canvas */}
        <div className="fixed inset-0 z-0">
          <Canvas 
            camera={{ position: [0, 0, 20], fov: 50 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            dpr={[1, 1.5]}
          >
            <color attach="background" args={['#050508']} />
            <ScrollContext.Provider value={scrollProgress}>
              <ParticleField />
            </ScrollContext.Provider>
          </Canvas>
        </div>

        {/* Content Sections */}
        <Section 
          index={0} 
          title="GENESIS" 
          subtitle="The beginning of everything"
          description="Scroll to witness the birth of a universe"
        />
        <Section 
          index={1} 
          title="EXPANSION" 
          subtitle="Spreading across the void"
          description="Matter disperses into infinite space"
        />
        <Section 
          index={2} 
          title="COLLAPSE" 
          subtitle="Gravity takes hold"
          description="Forces pull everything together"
        />
        <Section 
          index={3} 
          title="FORMATION" 
          subtitle="Structure emerges from chaos"
          description="Patterns reveal themselves"
        />
        <Section 
          index={4} 
          title="INFINITY" 
          subtitle="The cycle continues"
          description="An endless dance of creation"
        />
      </div>

      {/* Scroll indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
        <p className="text-[10px] text-white/30 uppercase tracking-[0.3em]">Scroll</p>
      </div>

      {/* Autoscroll button - top right, toggle start/stop */}
      <button
        className="fixed top-6 right-8 z-30 px-5 py-2 rounded-full bg-blue-700 text-white text-base font-semibold shadow-md transition-all duration-200 hover:bg-blue-800 focus:outline-none"
        style={{ border: 'none' }}
        onClick={() => {
          if (autoScrolling) {
            setAutoScrolling(false);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
          } else {
            setAutoScrolling(true);
          }
        }}
      >
        {autoScrolling ? 'Stop Autoscroll' : 'Start Autoscroll'}
      </button>

      {/* Progress bar removed as requested */}
    </div>
  );
}

// --- SECTION COMPONENT ---
function Section({ index, title, subtitle, description }) {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="h-screen flex items-center justify-center relative z-10"
    >
      <div className={`text-center transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <p className="text-xs text-white/60 uppercase tracking-[0.5em] mb-4">
          {String(index + 1).padStart(2, '0')} / 05
        </p>
        <h2 className="text-6xl md:text-8xl font-extralight text-white tracking-wider mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
          {title}
        </h2>
        <p className="text-xl text-white/80 font-light tracking-wide mb-3">
          {subtitle}
        </p>
        <p className="text-base text-white/50 font-light max-w-md mx-auto">
          {description}
        </p>
      </div>
    </section>
  );
}

// --- PARTICLE FIELD ---
function ParticleField() {
  const pointsRef = useRef();
  const scrollProgress = React.useContext(ScrollContext);
  const scrollRef = useRef(0);
  const targetScrollRef = useRef(0);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const alphas = new Float32Array(PARTICLE_COUNT);
    const velocities = [];
    const originalPositions = [];
    const phases = []; // For different animation behaviors
    
    // Color palette - blue and gold
    const palette = [
      new THREE.Color("#1976d2"), // Blue
      new THREE.Color("#2196f3"), // Light Blue
      new THREE.Color("#ffd700"), // Gold
      new THREE.Color("#ffecb3"), // Pale Gold
      new THREE.Color("#90caf9"), // Soft Blue
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Initial tight sphere formation
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.5 + Math.random() * 2;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      originalPositions.push({ x, y, z, theta, phi, radius });
      velocities.push({ x: 0, y: 0, z: 0 });
      phases.push(Math.random()); // Random phase for each particle

      sizes[i] = 0.5 + Math.random() * 1.5;
      alphas[i] = 0.3 + Math.random() * 0.5;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors, sizes, alphas, velocities, originalPositions, phases };
  }, []);

  // Update target scroll with the context value
  useEffect(() => {
    targetScrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Smooth scroll interpolation
    scrollRef.current += (targetScrollRef.current - scrollRef.current) * 0.08;
    const scroll = scrollRef.current;

    const positions = pointsRef.current.geometry.attributes.position.array;
    const colors = pointsRef.current.geometry.attributes.color.array;
    const alphas = pointsRef.current.geometry.attributes.alpha.array;

    // Define scroll stages (0-1 mapped to 5 stages)
    const stage1 = Math.min(scroll * 5, 1);        // 0-20%: Genesis - tight sphere
    const stage2 = Math.max(0, Math.min((scroll - 0.2) * 5, 1));  // 20-40%: Expansion
    const stage3 = Math.max(0, Math.min((scroll - 0.4) * 5, 1));  // 40-60%: Collapse
    const stage4 = Math.max(0, Math.min((scroll - 0.6) * 5, 1));  // 60-80%: Formation
    const stage5 = Math.max(0, Math.min((scroll - 0.8) * 5, 1));  // 80-100%: Infinity

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      const orig = particles.originalPositions[i];
      const vel = particles.velocities[i];
      const phase = particles.phases[i];
      
      let targetX, targetY, targetZ;
      
      // STAGE 1: Genesis - Steady sphere with slow rotation
      const genesisX = orig.radius * Math.sin(orig.phi) * Math.cos(orig.theta + time * 0.05);
      const genesisY = orig.radius * Math.sin(orig.phi) * Math.sin(orig.theta + time * 0.05);
      const genesisZ = orig.radius * Math.cos(orig.phi);
      
      // STAGE 2: Expansion - Explode outward
      const expandRadius = orig.radius * (1 + stage2 * 8);
      const expandX = expandRadius * Math.sin(orig.phi) * Math.cos(orig.theta + phase);
      const expandY = expandRadius * Math.sin(orig.phi) * Math.sin(orig.theta + phase);
      const expandZ = expandRadius * Math.cos(orig.phi) + (phase - 0.5) * stage2 * 10;
      
      // STAGE 3: Collapse - Form a ring/torus
      const ringRadius = 6 - stage3 * 2;
      const tubeRadius = 0.5 + (1 - stage3) * 2;
      const ringAngle = orig.theta + time * 0.2;
      const tubeAngle = orig.phi * 2;
      const collapseX = (ringRadius + tubeRadius * Math.cos(tubeAngle)) * Math.cos(ringAngle);
      const collapseY = (ringRadius + tubeRadius * Math.cos(tubeAngle)) * Math.sin(ringAngle);
      const collapseZ = tubeRadius * Math.sin(tubeAngle);
      
      // STAGE 4: Formation - DNA Helix
      const helixT = (i / PARTICLE_COUNT) * Math.PI * 8;
      const helixRadius = 3 + Math.sin(helixT * 0.5) * 1;
      const strand = phase > 0.5 ? 1 : -1;
      const formX = helixRadius * Math.cos(helixT + time * 0.3) * strand;
      const formY = (i / PARTICLE_COUNT) * 20 - 10;
      const formZ = helixRadius * Math.sin(helixT + time * 0.3) * strand;
      
      // STAGE 5: Infinity - Figure 8 / Lemniscate
      const lemnT = (i / PARTICLE_COUNT) * Math.PI * 2 + time * 0.1;
      const lemnScale = 8;
      const infinityX = lemnScale * Math.cos(lemnT) / (1 + Math.pow(Math.sin(lemnT), 2));
      const infinityY = lemnScale * Math.sin(lemnT) * Math.cos(lemnT) / (1 + Math.pow(Math.sin(lemnT), 2));
      const infinityZ = (phase - 0.5) * 4;

      // Blend between stages
      if (scroll < 0.2) {
        targetX = genesisX;
        targetY = genesisY;
        targetZ = genesisZ;
      } else if (scroll < 0.4) {
        targetX = THREE.MathUtils.lerp(genesisX, expandX, stage2);
        targetY = THREE.MathUtils.lerp(genesisY, expandY, stage2);
        targetZ = THREE.MathUtils.lerp(genesisZ, expandZ, stage2);
      } else if (scroll < 0.6) {
        targetX = THREE.MathUtils.lerp(expandX, collapseX, stage3);
        targetY = THREE.MathUtils.lerp(expandY, collapseY, stage3);
        targetZ = THREE.MathUtils.lerp(expandZ, collapseZ, stage3);
      } else if (scroll < 0.8) {
        targetX = THREE.MathUtils.lerp(collapseX, formX, stage4);
        targetY = THREE.MathUtils.lerp(collapseY, formY, stage4);
        targetZ = THREE.MathUtils.lerp(collapseZ, formZ, stage4);
      } else {
        targetX = THREE.MathUtils.lerp(formX, infinityX, stage5);
        targetY = THREE.MathUtils.lerp(formY, infinityY, stage5);
        targetZ = THREE.MathUtils.lerp(formZ, infinityZ, stage5);
      }

      // Smooth movement towards target
      vel.x += (targetX - positions[ix]) * 0.05;
      vel.y += (targetY - positions[iy]) * 0.05;
      vel.z += (targetZ - positions[iz]) * 0.05;
      
      vel.x *= FRICTION;
      vel.y *= FRICTION;
      vel.z *= FRICTION;

      positions[ix] += vel.x;
      positions[iy] += vel.y;
      positions[iz] += vel.z;

      // Dynamic colors: blend blue and gold based on scroll
      let color;
      if (scroll < 0.5) {
        // Blue phase
        color = new THREE.Color().lerpColors(
          new THREE.Color("#1976d2"),
          new THREE.Color("#2196f3"),
          phase
        );
        // Blend towards gold as scroll approaches 0.5
        color.lerp(new THREE.Color("#ffd700"), Math.max(0, (scroll - 0.3) * 2.5));
      } else if (scroll < 0.8) {
        // Gold phase
        color = new THREE.Color().lerpColors(
          new THREE.Color("#ffd700"),
          new THREE.Color("#ffecb3"),
          phase
        );
        // Blend towards blue as scroll approaches 0.8
        color.lerp(new THREE.Color("#1976d2"), Math.max(0, (scroll - 0.7) * 5));
      } else {
        // Infinity stage: blue
        color = new THREE.Color().lerpColors(
          new THREE.Color("#1976d2"),
          new THREE.Color("#2196f3"),
          phase
        );
      }

      colors[ix] = color.r;
      colors[iy] = color.g;
      colors[iz] = color.b;

      // Steady alpha based on scroll
      alphas[i] = 0.4 + scroll * 0.3;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
    pointsRef.current.geometry.attributes.alpha.needsUpdate = true;
    
    // Rotate the whole system gently
    pointsRef.current.rotation.y = time * (scroll >= 0.8 ? 0.15 : 0.03) + scroll * Math.PI;
    pointsRef.current.rotation.x = scroll * 0.2;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.sizes.length}
          array={particles.sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-alpha"
          count={particles.alphas.length}
          array={particles.alphas}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        transparent={true}
      />
    </points>
  );
}