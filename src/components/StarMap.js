import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { fetchStars } from '../services/api';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { gsap } from 'gsap';

const StarMap3D = () => {
  const mountRef = useRef();
  const tooltipRef = useRef();
  const [filter, setFilter] = useState("brightest"); // Critère par défaut : "Les plus brillantes"
  const [filteredStars, setFilteredStars] = useState([]); // Liste des étoiles filtrées

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
    const earthOrbitRadius = 15;
    let earthOrbitAngle = 0;

    // Raycaster pour la détection des survols
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Ajouter les étoiles
    const starObjects = [];
    const addStars = async () => {
      const stars = await fetchStars();

      // Appliquer le filtre sélectionné
      let filtered = [];
      if (filter === "brightest") {
        // Les 50 étoiles les plus brillantes (par magnitude croissante)
        filtered = stars.sort((a, b) => a.mag - b.mag).slice(0, 50);
      } else if (filter === "closest") {
        // Les 50 étoiles les plus proches (par distance croissante)
        filtered = stars.sort((a, b) => a.dist - b.dist).slice(0, 50);
      }

      // Mettre à jour la liste des étoiles filtrées
      setFilteredStars(filtered);

      // Supprimer les anciennes étoiles
      starObjects.forEach((star) => scene.remove(star));
      starObjects.length = 0;

      // Ajouter les nouvelles étoiles
      filtered.forEach((star) => {
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
  }, [filter]); // Recharger les étoiles lorsque le filtre change

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100vh", position: "relative" }}
    >
      {/* Sélecteur */}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 10,
          padding: "5px",
        }}
      >
        <option value="brightest">Les plus brillantes</option>
        <option value="closest">Les plus proches</option>
      </select>

      {/* Liste des étoiles */}
      <div
        style={{
          position: "absolute",
          top: "50px",
          right: "10px",
          width: "300px",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "10px",
          borderRadius: "8px",
          overflowY: "auto",
          maxHeight: "90vh",
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: "10px" }}>Étoiles Filtrées</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredStars.map((star, index) => (
            <div
              key={index}
              style={{
                padding: "10px",
                borderRadius: "5px",
                backgroundColor: index % 2 === 0 ? "#1e3a8a" : "#2563eb",
                color: "white",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.3)",
              }}
            >
              <strong>Nom :</strong> {star.spect || "Undefined"} <br />
              <strong>Magnitude :</strong> {star.mag.toFixed(2)} <br />
              <strong>Distance :</strong> {star.dist.toFixed(2)} AL
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
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
