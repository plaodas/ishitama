import { useEffect, useRef } from "react";

import { INSTRUMENT_CONFIG } from "@/lib/instrumentConfig";
import type { Point, SoundParams } from "@/types/stone";

type StoneViewerProps = {
  points: Point[];
  indices?: number[];
  sound: SoundParams;
  waveLevel: number;
  playing: boolean;
  pulseTick: number;
  exploring?: boolean;
  overlaying?: boolean;
};

const BASE_POINT_SIZE = 0.012;
const OVERLAY_POINT_SIZE = 0.02;
const BASE_OPACITY = 0.82;
const OVERLAY_OPACITY = 0.4;
const BASE_MESH_OPACITY = 0.5;
const OVERLAY_MESH_OPACITY = 0.32;
const BASE_WIRE_OPACITY = 0.045;
const OVERLAY_WIRE_OPACITY = 0.08;
const OVERLAY_SCALE = 1.12;
const DRONE_PERIOD = 5.2;
const DEFORM_INTERVAL_MS = 1000 / 30;
const EMPTY_INDICES: number[] = [];

export function StoneViewer({
  points,
  indices = EMPTY_INDICES,
  sound,
  waveLevel,
  playing,
  pulseTick,
  exploring = false,
  overlaying = false,
}: StoneViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const exploringRef = useRef(exploring);
  const overlayingRef = useRef(overlaying);
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
    exploringRef.current = exploring;
    const canvas = mountRef.current?.querySelector("canvas");
    if (canvas instanceof HTMLCanvasElement) {
      canvas.style.touchAction = exploring ? "none" : "pan-y";
    }
  }, [exploring]);

  useEffect(() => {
    overlayingRef.current = overlaying;
  }, [overlaying]);

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
    let meshMaterial: import("three").MeshBasicMaterial | undefined;
    let wireMaterial: import("three").MeshBasicMaterial | undefined;
    let pointMaterial: import("three").PointsMaterial | undefined;
    let glowGeometry: import("three").BufferGeometry | undefined;
    let glowMaterial: import("three").PointsMaterial | undefined;
    let stone: import("three").Object3D | undefined;
    let animatedPositions: Float32Array | undefined;
    let basePositions: Float32Array | undefined;
    const useMesh = indices.length >= 3;

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
      const atmosphere = new THREE.Color(configRef.current.theme.atmosphere);
      scene.background = atmosphere;

      camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 10);
      camera.position.set(0, 0, 1.35);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(atmosphere, 1);
      renderer.domElement.style.touchAction = exploringRef.current ? "none" : "pan-y";
      renderer.domElement.style.background = "transparent";
      mount.appendChild(renderer.domElement);

      animatedPositions = new Float32Array(points.length * 3);
      const colors = new Float32Array(points.length * 3);
      points.forEach((point, index) => {
        animatedPositions![index * 3] = point.x;
        animatedPositions![index * 3 + 1] = point.y;
        animatedPositions![index * 3 + 2] = point.z;
        colors[index * 3] = Math.min(1, (point.r / 255) * 1.12);
        colors[index * 3 + 1] = Math.min(1, (point.g / 255) * 1.12);
        colors[index * 3 + 2] = Math.min(1, (point.b / 255) * 1.12);
      });
      basePositions = animatedPositions.slice();

      geometry = new THREE.BufferGeometry();
      positionAttribute = new THREE.BufferAttribute(animatedPositions, 3);
      geometry.setAttribute("position", positionAttribute);
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      if (useMesh) {
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
      }
      geometry.computeBoundingSphere();

      stone = new THREE.Group();
      if (useMesh) {
        meshMaterial = new THREE.MeshBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: BASE_MESH_OPACITY,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        });
        stone.add(new THREE.Mesh(geometry, meshMaterial));
        wireMaterial = new THREE.MeshBasicMaterial({
          color: configRef.current.theme.accent,
          wireframe: true,
          transparent: true,
          opacity: BASE_WIRE_OPACITY,
          depthWrite: false,
        });
        stone.add(new THREE.Mesh(geometry, wireMaterial));
      } else {
        pointMaterial = new THREE.PointsMaterial({
          size: BASE_POINT_SIZE,
          vertexColors: true,
          sizeAttenuation: true,
          transparent: true,
          opacity: BASE_OPACITY,
        });
        stone.add(new THREE.Points(geometry, pointMaterial));
      }

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
      controls.enabled = exploringRef.current;

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
        const overlayingNow = overlayingRef.current;

        atmosphere.set(configRef.current.theme.atmosphere);
        if (overlayingNow) {
          scene.background = null;
          renderer?.setClearColor(0x000000, 0);
        } else {
          scene.background = atmosphere;
          renderer?.setClearColor(atmosphere, 1);
        }

        if (stone) {
          const overlayBoost = overlayingNow ? OVERLAY_SCALE : 1;
          stone.scale.setScalar((1 + droneScale + pulseScale) * overlayBoost);
          stone.position.x = Math.sin(elapsed * 0.45 * motionSpeed) * 0.004 * visual.drift * activity;
          stone.position.y =
            Math.cos(elapsed * 0.36 * motionSpeed) * 0.0025 * visual.drift * activity;
        }
        if (meshMaterial) {
          meshMaterial.blending = overlayingNow ? THREE.AdditiveBlending : THREE.NormalBlending;
          meshMaterial.opacity = Math.min(
            overlayingNow ? 0.48 : 0.62,
            (overlayingNow ? OVERLAY_MESH_OPACITY : BASE_MESH_OPACITY) +
              pulseEnergyRef.current * 0.16 * visual.pulse,
          );
        }
        if (wireMaterial) {
          wireMaterial.color.set(configRef.current.theme.accent);
          wireMaterial.blending = overlayingNow ? THREE.AdditiveBlending : THREE.NormalBlending;
          wireMaterial.opacity = Math.min(
            overlayingNow ? 0.38 : 0.28,
            (overlayingNow ? OVERLAY_WIRE_OPACITY : BASE_WIRE_OPACITY) +
              pulseEnergyRef.current * 0.14 * visual.pulse,
          );
        }
        if (pointMaterial) {
          const pointSize = overlayingNow ? OVERLAY_POINT_SIZE : BASE_POINT_SIZE;
          const restOpacity = overlayingNow ? OVERLAY_OPACITY : BASE_OPACITY;
          pointMaterial.blending = overlayingNow ? THREE.AdditiveBlending : THREE.NormalBlending;
          pointMaterial.depthWrite = !overlayingNow;
          pointMaterial.size =
            pointSize + pulseEnergyRef.current * (overlayingNow ? 0.006 : 0.004) * visual.pulse;
          pointMaterial.opacity = Math.min(
            overlayingNow ? 0.72 : 1,
            restOpacity + pulseEnergyRef.current * (overlayingNow ? 0.24 : 0.18) * visual.pulse,
          );
        }
        if (glowMaterial) {
          glowMaterial.size =
            (overlayingNow ? OVERLAY_POINT_SIZE : BASE_POINT_SIZE) * 1.35 +
            pulseEnergyRef.current * 0.007 * visual.pulse;
          glowMaterial.opacity = Math.min(
            overlayingNow ? 0.72 : 0.58,
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

        if (controls) {
          controls.enabled = exploringRef.current;
          controls.update();
        }
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
      meshMaterial?.dispose();
      wireMaterial?.dispose();
      pointMaterial?.dispose();
      glowGeometry?.dispose();
      glowMaterial?.dispose();
      renderer?.dispose();
      if (renderer?.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [points, indices]);

  return (
    <div
      ref={mountRef}
      className={`viewer${exploring ? " is-exploring" : ""}${overlaying ? " is-overlaying" : ""}`}
    />
  );
}
