import { useEffect, useRef } from "react";

import type { Point } from "@/types/stone";

type StoneViewerProps = {
  points: Point[];
};

export function StoneViewer({ points }: StoneViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    let disposed = false;
    let frame = 0;
    let renderer: import("three").WebGLRenderer | undefined;
    let camera: import("three").PerspectiveCamera | undefined;
    let controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls | undefined;
    let geometry: import("three").BufferGeometry | undefined;
    let material: import("three").PointsMaterial | undefined;

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
      scene.background = new THREE.Color(0x0b0a09);

      camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 10);
      camera.position.set(0, 0, 1.35);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.domElement.style.touchAction = "none";
      mount.appendChild(renderer.domElement);

      const positions = new Float32Array(points.length * 3);
      const colors = new Float32Array(points.length * 3);
      points.forEach((point, index) => {
        positions[index * 3] = point.x;
        positions[index * 3 + 1] = point.y;
        positions[index * 3 + 2] = point.z;
        colors[index * 3] = point.r / 255;
        colors[index * 3 + 1] = point.g / 255;
        colors[index * 3 + 2] = point.b / 255;
      });

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.computeBoundingSphere();

      material = new THREE.PointsMaterial({
        size: 0.012,
        vertexColors: true,
        sizeAttenuation: true,
      });
      scene.add(new THREE.Points(geometry, material));
      scene.add(new THREE.AmbientLight(0xffffff, 0.4));

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = false;
      controls.minDistance = 0.4;
      controls.maxDistance = 3;

      const animate = () => {
        frame = requestAnimationFrame(animate);
        controls?.update();
        if (renderer && camera) {
          renderer.render(scene, camera);
        }
      };
      animate();
      window.addEventListener("resize", onResize);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      controls?.dispose();
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
      if (renderer?.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [points]);

  return <div ref={mountRef} className="viewer" />;
}
