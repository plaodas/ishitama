import { useEffect, useRef } from "react";

import { INSTRUMENT_CONFIG } from "@/lib/instrumentConfig";
import type { Point, SoundParams } from "@/types/stone";

type StoneViewerProps = {
  points: Point[];
  sound: SoundParams;
  waveLevel: number;
  playing: boolean;
  pulseTick: number;
};

const BASE_POINT_SIZE = 0.012;
const BASE_OPACITY = 0.82;
const DRONE_PERIOD = 5.2;
const DEFORM_INTERVAL_MS = 1000 / 30;

export function StoneViewer({ points, sound, waveLevel, playing, pulseTick }: StoneViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(playing);
  const startedAtRef = useRef(performance.now());
  const pulseEnergyRef = useRef(0);
  const configRef = useRef(INSTRUMENT_CONFIG[sound.instrument]);
  const noiseLevelRef = useRef(sound.noiseLevel);
  const waveLevelRef = useRef(waveLevel);

  useEffect(() => {
    configRef.current = INSTRUMENT_CONFIG[sound.instrument];
    noiseLevelRef.current = sound.noiseLevel;
    waveLevelRef.current = waveLevel;
  }, [sound.instrument, sound.noiseLevel, waveLevel]);

  useEffect(() => {
    playingRef.current = playing;
    if (playing) {
      startedAtRef.current = performance.now();
    }
  }, [playing]);

  useEffect(() => {
    if (pulseTick > 0) {
      pulseEnergyRef.current = 1;
    }
  }, [pulseTick]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    let disposed = false;
    let frame = 0;
    let activity = 0;
    let lastFrame = performance.now();
    let lastDeformAt = 0;
    let positionsDirty = false;
    let renderer: import("three").WebGLRenderer | undefined;
    let camera: import("three").PerspectiveCamera | undefined;
    let controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls | undefined;
    let geometry: import("three").BufferGeometry | undefined;
    let positionAttribute: import("three").BufferAttribute | undefined;
    let material: import("three").PointsMaterial | undefined;
    let glowGeometry: import("three").BufferGeometry | undefined;
    let glowMaterial: import("three").PointsMaterial | undefined;
    let stone: import("three").Points | undefined;
    let animatedPositions: Float32Array | undefined;
    let basePositions: Float32Array | undefined;

    const onResize = () => {
      if (!renderer || !camera || !mount) {
        return;
      }
      const width = mount.clientWidth;
      const height = Math.max(mount.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    void (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (disposed || !mountRef.current) {
        return;
      }

      const width = mount.clientWidth;
      const height = Math.max(mount.clientHeight, 1);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(configRef.current.theme.atmosphere);

      camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 10);
      camera.position.set(0, 0, 1.35);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.domElement.style.touchAction = "none";
      mount.appendChild(renderer.domElement);

      animatedPositions = new Float32Array(points.length * 3);
      const colors = new Float32Array(points.length * 3);
      points.forEach((point, index) => {
        animatedPositions![index * 3] = point.x;
        animatedPositions![index * 3 + 1] = point.y;
        animatedPositions![index * 3 + 2] = point.z;
        colors[index * 3] = point.r / 255;
        colors[index * 3 + 1] = point.g / 255;
        colors[index * 3 + 2] = point.b / 255;
      });
      basePositions = animatedPositions.slice();

      geometry = new THREE.BufferGeometry();
      positionAttribute = new THREE.BufferAttribute(animatedPositions, 3);
      geometry.setAttribute("position", positionAttribute);
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.computeBoundingSphere();

      material = new THREE.PointsMaterial({
        size: BASE_POINT_SIZE,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: BASE_OPACITY,
      });
      stone = new THREE.Points(geometry, material);

      if (waveLevelRef.current >= 7) {
        const glowPositions = new Float32Array(Math.ceil(points.length / 7) * 3);
        let glowOffset = 0;
        points.forEach((point, index) => {
          if (index % 7 !== 0) {
            return;
          }
          glowPositions[glowOffset] = point.x;
          glowPositions[glowOffset + 1] = point.y;
          glowPositions[glowOffset + 2] = point.z;
          glowOffset += 3;
        });
        glowGeometry = new THREE.BufferGeometry();
        glowGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(glowPositions.slice(0, glowOffset), 3),
        );
        glowMaterial = new THREE.PointsMaterial({
          color: configRef.current.theme.accent,
          size: BASE_POINT_SIZE * 1.35,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        stone.add(new THREE.Points(glowGeometry, glowMaterial));
      }
      scene.add(stone);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = false;
      controls.minDistance = 0.4;
      controls.maxDistance = 3;

      const animate = (now: number) => {
        frame = requestAnimationFrame(animate);
        const delta = Math.min((now - lastFrame) / 1000, 0.1);
        lastFrame = now;

        const activityTarget = playingRef.current ? 1 : 0;
        activity += (activityTarget - activity) * (1 - Math.exp(-delta * 4));
        pulseEnergyRef.current *= Math.exp(-delta * 6);

        const visual = configRef.current.visual;
        const level = waveLevelRef.current;
        const levelIntensity = (level - 1) / 8;
        const motionSpeed = Math.max(0.25, 0.5 + level * 0.1 + visual.speedOffset);
        const elapsed = (now - startedAtRef.current) / 1000;
        const breath = Math.sin(elapsed * ((Math.PI * 2) / DRONE_PERIOD) * motionSpeed);
        const pulseScale = pulseEnergyRef.current * 0.025 * visual.pulse;
        const droneScale = breath * 0.008 * visual.drone * activity;

        if (stone) {
          stone.scale.setScalar(1 + droneScale + pulseScale);
          stone.position.x = Math.sin(elapsed * 0.45 * motionSpeed) * 0.004 * visual.drift * activity;
          stone.position.y =
            Math.cos(elapsed * 0.36 * motionSpeed) * 0.0025 * visual.drift * activity;
        }
        if (material) {
          material.size = BASE_POINT_SIZE + pulseEnergyRef.current * 0.004 * visual.pulse;
          material.opacity = Math.min(
            1,
            BASE_OPACITY + pulseEnergyRef.current * 0.18 * visual.pulse,
          );
        }
        if (glowMaterial) {
          glowMaterial.size =
            BASE_POINT_SIZE * 1.35 + pulseEnergyRef.current * 0.007 * visual.pulse;
          glowMaterial.opacity = Math.min(
            0.58,
            pulseEnergyRef.current * 0.42 * visual.pulse * levelIntensity,
          );
        }

        if (
          now - lastDeformAt >= DEFORM_INTERVAL_MS &&
          animatedPositions &&
          basePositions &&
          positionAttribute
        ) {
          lastDeformAt = now;
          if (activity > 0.001) {
            const droneAmount = 0.00045 * visual.drone * activity;
            const noiseAmount = 0.0012 * noiseLevelRef.current * visual.noise * activity;
            const pointCount = animatedPositions.length / 3;
            for (let index = 0; index < pointCount; index += 1) {
              const offset = index * 3;
              const phase = index * 2.399963;
              const droneMotion =
                Math.sin(elapsed * 1.2 * motionSpeed + phase * 0.08) * droneAmount;
              const noiseMotion = Math.sin(elapsed * 9 * motionSpeed + phase) * noiseAmount;
              const movement = droneMotion + noiseMotion;
              animatedPositions[offset] = basePositions[offset] + movement;
              animatedPositions[offset + 1] = basePositions[offset + 1] + movement * 0.65;
              animatedPositions[offset + 2] = basePositions[offset + 2] + movement * 1.4;
            }
            positionAttribute.needsUpdate = true;
            positionsDirty = true;
          } else if (positionsDirty) {
            animatedPositions.set(basePositions);
            positionAttribute.needsUpdate = true;
            positionsDirty = false;
          }
        }

        controls?.update();
        if (renderer && camera) {
          renderer.render(scene, camera);
        }
      };

      frame = requestAnimationFrame(animate);
      window.addEventListener("resize", onResize);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      controls?.dispose();
      geometry?.dispose();
      material?.dispose();
      glowGeometry?.dispose();
      glowMaterial?.dispose();
      renderer?.dispose();
      if (renderer?.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [points]);

  return <div ref={mountRef} className="viewer" />;
}
