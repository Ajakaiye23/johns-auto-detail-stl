/* objects.js — the procedural hero objects, one per client site.
 *
 * Each builder takes (THREE, ctx) from hero3d.mountHero and returns a Group.
 * ctx gives {mat, h, tex, paint} — see hero3d.js.
 *
 * Modelling notes that matter for realism:
 *  - Anything turned on a lathe in reality is built with LatheGeometry from a
 *    hand-authored profile. Straight cylinders read as toys; a profile with a
 *    shoulder, a taper and a fillet reads as machined.
 *  - Flat forged parts (scissor blades, clipper blades, wrench jaws) use
 *    ExtrudeGeometry with a bevel so the edges catch a highlight.
 *  - Patterns (barber stripes, coil windings, tyre tread) are canvas textures
 *    rather than geometry — far cheaper and more convincing at this scale.
 */

/* ---------------------------------------------------------------- BARBER POLE
   Humble Barbershop. Glass sleeve over a helical stripe, chrome end caps
   lathed from a real turned profile, wall bracket. */

/* Extracted for this site only — the full library of 11 hero objects
   lives in _shared/objects.js. Regenerate with tools/build_site.py. */

export function car(THREE, ctx) {
  const {mat, h, tex, paint} = ctx;
  const g = new THREE.Group();

  /* The first version was a flat slab: no wheel arches, no side glass, no
     taper, so the wheels read as discs stuck to a wedge. The arches are now
     cut into the body outline itself (a hole can't be used — it would have to
     sit fully inside the shape), the greenhouse is a separate, narrower and
     shorter volume, and the glass is real transmissive material. */
  const AXLE_Y = -0.30, WHEEL_R = 0.72, ARCH_R = 0.86;
  const FRONT_X = 2.10, REAR_X = -2.10;
  const SILL_Y = -0.52;
  const BODY_W = 2.16, ROOF_W = 1.86;

  const bodyPaint = paint(0x1B5FA8, {metallic: 0.72, rough: 0.13});
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0A1018, metalness: 0.05, roughness: 0.04,
    transmission: 0.62, thickness: 0.35, ior: 1.46,
    transparent: true, envMapIntensity: 2.4
  });

  // half-arch swept up into the underside of the body
  const arch = (cx, steps = 22) => {
    const p = [];
    for (let i = 0; i <= steps; i++) {
      const a = Math.PI - (i / steps) * Math.PI;
      p.push([cx + ARCH_R * Math.cos(a), SILL_Y + ARCH_R * Math.sin(a)]);
    }
    return p;
  };

  const outline = [
    [-3.46, SILL_Y],
    ...arch(REAR_X),
    ...arch(FRONT_X),
    [3.46, SILL_Y],
    [3.62, -0.14], [3.58, 0.16], [3.34, 0.40],   // nose
    [2.40, 0.56], [1.15, 0.64],                   // bonnet
    [-1.30, 0.66], [-2.62, 0.56],                 // beltline
    [-3.32, 0.36], [-3.58, 0.08]                  // tail
  ];

  const body = h.extrude(outline, bodyPaint,
    {depth: BODY_W, bevel: 0.07, center: false});
  body.position.z = -BODY_W / 2;
  g.add(body);

  // greenhouse — narrower and inset, which is what gives a car its shoulder
  const roofPts = [
    [-1.62, 0], [-1.18, 0.66], [0.28, 0.72], [1.16, 0.10], [1.16, 0]
  ];
  const roof = h.extrude(roofPts, bodyPaint, {depth: ROOF_W, bevel: 0.06, center: false});
  roof.position.set(0, 0.62, -ROOF_W / 2);
  g.add(roof);

  // windscreen + backlight, sitting just proud of the roof pillars
  const wsGlass = h.extrude(
    [[1.10,0.08],[0.26,0.66],[0.20,0.60],[1.02,0.04]],
    glassMat, {depth: ROOF_W * 0.97, bevel: 0, center: false});
  wsGlass.position.set(0, 0.62, -ROOF_W * 0.485);
  const rearGlass = h.extrude(
    [[-1.56,0.04],[-1.14,0.62],[-1.06,0.58],[-1.46,0.02]],
    glassMat, {depth: ROOF_W * 0.97, bevel: 0, center: false});
  rearGlass.position.set(0, 0.62, -ROOF_W * 0.485);
  g.add(wsGlass, rearGlass);

  // side windows, inset either flank so the cabin reads as glazed
  [-1, 1].forEach(s => {
    const win = h.extrude(
      [[-1.02,0.06],[-0.72,0.56],[0.10,0.60],[0.72,0.10]],
      glassMat, {depth: 0.05, bevel: 0, center: false});
    win.position.set(0, 0.62, s * (ROOF_W / 2) - (s > 0 ? 0.05 : 0));
    g.add(win);
  });

  // chrome beltline + door shut line
  [-1, 1].forEach(s => {
    const trim = h.box(5.4, 0.045, 0.05, mat.chrome);
    trim.position.set(-0.1, 0.60, s * (BODY_W / 2 + 0.01));
    g.add(trim);
    const shut = h.box(0.035, 0.92, 0.04, mat.darkMetal);
    shut.position.set(-0.55, 0.10, s * (BODY_W / 2 + 0.01));
    g.add(shut);
  });

  // sills under the doors
  [-1, 1].forEach(s => {
    const sill = h.box(3.0, 0.14, 0.10, mat.darkMetal);
    sill.position.set(-0.1, SILL_Y + 0.04, s * (BODY_W / 2 - 0.02));
    g.add(sill);
  });

  // lights
  const headMat = new THREE.MeshPhysicalMaterial({
    color: 0xFFF8E6, emissive: 0xFFEBC6, emissiveIntensity: 1.6,
    roughness: 0.10, metalness: 0
  });
  const tailMat = new THREE.MeshPhysicalMaterial({
    color: 0xE23423, emissive: 0xC01810, emissiveIntensity: 1.3,
    roughness: 0.18, metalness: 0
  });
  [0.66, -0.66].forEach(z => {
    const l = h.box(0.14, 0.20, 0.56, headMat);
    l.position.set(3.52, 0.22, z); g.add(l);
  });
  [0.62, -0.62].forEach(z => {
    const l = h.box(0.12, 0.18, 0.52, tailMat);
    l.position.set(-3.50, 0.24, z); g.add(l);
  });

  // grille + bumpers
  const grille = h.box(0.10, 0.24, 1.30, mat.darkMetal);
  grille.position.set(3.56, -0.02, 0);
  const fBump = h.box(0.22, 0.20, BODY_W * 0.94, mat.darkMetal);
  fBump.position.set(3.50, -0.34, 0);
  const rBump = h.box(0.22, 0.20, BODY_W * 0.94, mat.darkMetal);
  rBump.position.set(-3.48, -0.30, 0);
  g.add(grille, fBump, rBump);

  // wheels, seated in the arches
  const tread = tex(64, 64, (c, w, hh) => {
    c.fillStyle = '#121316'; c.fillRect(0, 0, w, hh);
    c.strokeStyle = '#2A2C31'; c.lineWidth = 4;
    for (let i = -2; i < 12; i++) {
      c.beginPath(); c.moveTo(i * 7, 0); c.lineTo(i * 7 + 10, hh); c.stroke();
    }
  }, [12, 1]);
  const tyreMat = new THREE.MeshPhysicalMaterial({map: tread, roughness: 0.92, metalness: 0});

  [FRONT_X, REAR_X].forEach(x => {
    [1, -1].forEach(s => {
      const z = s * (BODY_W / 2 - 0.05);
      const tyre = h.cyl(WHEEL_R, WHEEL_R, 0.34, tyreMat, 40);
      tyre.rotation.x = Math.PI / 2; tyre.position.set(x, AXLE_Y, z);
      const rim = h.cyl(0.46, 0.46, 0.36, mat.chrome, 32);
      rim.rotation.x = Math.PI / 2; rim.position.set(x, AXLE_Y, z);
      const hub = h.cyl(0.13, 0.13, 0.40, mat.darkMetal, 20);
      hub.rotation.x = Math.PI / 2; hub.position.set(x, AXLE_Y, z);
      g.add(tyre, rim, hub);
      for (let i = 0; i < 5; i++) {
        const spoke = h.box(0.10, 0.74, 0.05, mat.chrome);
        spoke.position.set(x, AXLE_Y, z + s * 0.16);
        spoke.rotation.z = (i / 5) * Math.PI;
        g.add(spoke);
      }
    });
  });

  // door mirrors on stalks
  [1, -1].forEach(s => {
    const stalk = h.box(0.16, 0.06, 0.14, mat.darkMetal);
    stalk.position.set(0.98, 0.58, s * (BODY_W / 2 + 0.08));
    const cap = h.box(0.26, 0.16, 0.12, bodyPaint);
    cap.position.set(1.02, 0.62, s * (BODY_W / 2 + 0.20));
    g.add(stalk, cap);
  });

  return g;
}

/* ------------------------------------------------------------- SPRAY BOTTLE
   Blessed Cleaning. Translucent bottle with visible liquid, lathed neck and a
   trigger head — the liquid inside is what stops it reading as a vase. */
