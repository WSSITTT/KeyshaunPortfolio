/* global THREE, gsap, ScrollTrigger */

(() => {
  // Footer year
  document.getElementById("y").textContent = new Date().getFullYear();

  // Register GSAP
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ----- Button shine tracking + "magnetic" hover -----
  const magnets = document.querySelectorAll("[data-magnetic]");
  const setShine = (el, e) => {
    const r = el.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${mx}%`);
    el.style.setProperty("--my", `${my}%`);
  };

  magnets.forEach((el) => {
    el.addEventListener("mousemove", (e) => setShine(el, e));

    // magnetic pull
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      el.style.transform = `translate(${dx * 10}px, ${dy * 10}px)`;
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "translate(0px, 0px)";
    });
  });

  // ----- Count-up stats on first view -----
  const counters = document.querySelectorAll("[data-counter]");
  const animateCounters = () => {
    counters.forEach((node) => {
      const target = parseInt(node.getAttribute("data-counter"), 10);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.1,
        ease: "power2.out",
        onUpdate: () => (node.textContent = String(Math.round(obj.v))),
      });
    });
  };

  if (window.gsap) {
    ScrollTrigger?.create({
      trigger: ".stats",
      start: "top 85%",
      once: true,
      onEnter: animateCounters,
    });
  }

  // ----- Work cards tilt on hover -----
  document.querySelectorAll(".workcard").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * -10;
      const ry = (px - 0.5) * 10;
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0px)";
    });
  });

  // ----- Lightweight Three.js background -----
  const canvas = document.getElementById("bg");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0.2, 5);

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize);
  resize();

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0x88ccff, 0.8);
  key.position.set(2, 3, 4);
  scene.add(key);

  // Particles
  const count = 1400;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 16;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.02,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const stars = new THREE.Points(geo, mat);
  scene.add(stars);

  // Center object
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.9, 0.22, 260, 16),
    new THREE.MeshStandardMaterial({
      metalness: 0.65,
      roughness: 0.25,
      color: 0x7c3aed,
      emissive: 0x1b0a2d,
      emissiveIntensity: 0.45,
    })
  );
  knot.position.set(1.6, 0.2, 0);
  scene.add(knot);

  // Mouse parallax
  const mouse = { x: 0, y: 0 };
  window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // Scroll sync (GSAP)
  let scrollT = 0;
  window.addEventListener("scroll", () => {
    const doc = document.documentElement;
    scrollT = doc.scrollTop / (doc.scrollHeight - doc.clientHeight);
  }, { passive: true });

  // Animate loop
  const clock = new THREE.Clock();
  const tick = () => {
    const t = clock.getElapsedTime();

    // subtle float
    knot.rotation.x = t * 0.25 + scrollT * 1.6;
    knot.rotation.y = t * 0.35 + scrollT * 2.0;
    knot.position.y = 0.2 + Math.sin(t * 0.9) * 0.08;

    // camera parallax
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 0.35, 0.06);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.2 + mouse.y * 0.22, 0.06);

    // stars drift
    stars.rotation.y = t * 0.03 + scrollT * 0.8;
    stars.rotation.x = t * 0.01;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  tick();

  // Optional: basic scroll section "pin" feel (work section)
  if (window.gsap && window.ScrollTrigger) {
    gsap.to(".hero__card", {
      y: 20,
      opacity: 1,
      duration: 1,
      ease: "power2.out",
    });

    ScrollTrigger.create({
      trigger: "#work",
      start: "top 70%",
      onEnter: () => gsap.fromTo("#work .workcard", { y: 18, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.9, ease: "power2.out", stagger: 0.08
      }),
    });
  }
})();
