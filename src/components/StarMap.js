import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { fetchStars } from '../services/api';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { gsap } from 'gsap';

const StarMap3D = () => {
  const mountRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    const mount = mountRef.current;

    // Taille de la scène
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Initialiser la scène
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000b33);

    // Caméra
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;

    // Rendu
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Lumière ambiante
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Lumière directionnelle
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Chargement des textures
    const textureLoader = new THREE.TextureLoader();
    const earthDiffuseTexture = textureLoader.load('/textures/earth_diffuse.jpg');
    const earthBumpTexture = textureLoader.load('/textures/earth_bump.jpg');
    const sunTexture = textureLoader.load('/textures/sun.jpg');

    // Ajouter le Soleil
    const sunGeometry = new THREE.SphereGeometry(1.5, 64, 64);
    const sunMaterial = new THREE.MeshStandardMaterial({
      map: sunTexture,
      emissive: 0xffd700,
      emissiveIntensity: 1.2,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 0, 0); // Position centrale pour le Soleil
    sun.userData = { name: "Sun" };
    scene.add(sun);

    // Ajouter la Terre
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthDiffuseTexture,
      bumpMap: earthBumpTexture,
      bumpScale: 0.05,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.userData = { name: "Earth" };
    scene.add(earth);

    // Gestion des orbites
    const earthOrbitRadius = 15; // Rayon de l'orbite de la Terre autour du Soleil
    let earthOrbitAngle = 0; // Angle initial de l'orbite

    // Raycaster pour la détection des survols
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Ajouter les étoiles
    const starObjects = [];
    const addStars = async () => {
      const stars = await fetchStars();

      stars.forEach((star) => {
        const { ra, dec, mag, spect } = star;

        const radius = 20;
        const phi = THREE.MathUtils.degToRad(90 - dec);
        const theta = THREE.MathUtils.degToRad(ra);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        const starSize = Math.max(0.1, 0.5 - mag / 5);

        const spectralColors = {
          O: 0x9bb0ff,
          B: 0xaabfff,
          A: 0xcad7ff,
          F: 0xf8f7ff,
          G: 0xffd966,
          K: 0xffbb66,
          M: 0xff6030,
        };
        const starColor = spectralColors[spect?.[0]] || 0xffffff;

        const starGeometry = new THREE.SphereGeometry(starSize, 8, 8);
        const starMaterial = new THREE.MeshBasicMaterial({ color: starColor });
        const starMesh = new THREE.Mesh(starGeometry, starMaterial);

        starMesh.position.set(x, y, z);
        starMesh.userData = { name: spect || "Undefined" };

        scene.add(starMesh);
        starObjects.push(starMesh);
      });
    };

    addStars();

    // Gestion des événements de la souris
    const onMouseMove = (event) => {
      mouse.x = (event.clientX / width) * 2 - 1;
      mouse.y = -(event.clientY / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);

      if (intersects.length > 0) {
        const object = intersects[0].object;

        tooltipRef.current.style.display = "block";
        tooltipRef.current.style.left = `${event.clientX + 10}px`;
        tooltipRef.current.style.top = `${event.clientY + 10}px`;
        tooltipRef.current.innerText = object.userData.name || "Undefined";
      } else {
        tooltipRef.current.style.display = "none";
      }
    };

    mount.addEventListener("mousemove", onMouseMove);

    // Contrôles d'interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enableZoom = true;

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotation de la Terre
      earth.rotation.y += 0.002;

      // Orbite de la Terre autour du Soleil
      earthOrbitAngle += 0.01;
      const earthX = earthOrbitRadius * Math.cos(earthOrbitAngle);
      const earthZ = earthOrbitRadius * Math.sin(earthOrbitAngle);
      earth.position.set(earthX, 0, earthZ);

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      mount.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100vh", position: "relative" }}
    >
      <div
        ref={tooltipRef}
        style={{
          display: "none",
          position: "absolute",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "5px",
          borderRadius: "5px",
          pointerEvents: "none",
        }}
      ></div>
    </div>
  );
};

export default StarMap3D;
