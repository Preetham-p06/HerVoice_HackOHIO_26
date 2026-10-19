import {
  Bone,
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";

/** Local, rig-attached hair and blouse details; the original face/viseme rig is retained. */
export function styleMaya(model: Group) {
  model.updateMatrixWorld(true);
  const head = model.getObjectByName("Head") as Bone;
  const chest = model.getObjectByName("Spine2") as Bone;
  if (!head || !chest || model.getObjectByName("MayaBrownUpdo")) return;
  const hair = new MeshStandardMaterial({ color: "#39231c", roughness: 0.66 });
  const highlight = new MeshStandardMaterial({
    color: "#604132",
    roughness: 0.72,
  });
  const cloth = new MeshStandardMaterial({
    color: "#adc8e5",
    roughness: 0.92,
    side: DoubleSide,
  });
  const root = new Group();
  root.name = "MayaBrownUpdo";
  const attach = (part: Group, bone: Bone) => {
    part.applyMatrix4(bone.matrixWorld.clone().invert());
    bone.add(part);
  };
  const strand = (points: number[][], radius: number, material = hair) => {
    const curve = new CatmullRomCurve3(
      points.map((p) => new Vector3(...(p as [number, number, number]))),
    );
    const mesh = new Mesh(
      new TubeGeometry(curve, 36, radius, 6, false),
      material,
    );
    root.add(mesh);
  };
  // A shaped hairline: higher at the forehead, lower around the ears and nape.
  const positions: number[] = [],
    indices: number[] = [];
  const rows = 28,
    columns = 64;
  for (let r = 0; r <= rows; r++)
    for (let c = 0; c <= columns; c++) {
      const phi = (c / columns) * Math.PI * 2;
      const front = Math.cos(phi);
      const edge = front > 0 ? 1.78 - front * 0.59 : 1.78 - front * 0.38;
      const theta = (r / rows) * edge;
      positions.push(
        0.098 * Math.sin(theta) * Math.sin(phi),
        1.662 + 0.119 * Math.cos(theta),
        0.012 + 0.105 * Math.sin(theta) * Math.cos(phi),
      );
      if (r < rows && c < columns) {
        const a = r * (columns + 1) + c;
        indices.push(
          a,
          a + columns + 1,
          a + 1,
          a + 1,
          a + columns + 1,
          a + columns + 2,
        );
      }
    }
  const cap = new BufferGeometry();
  cap.setAttribute("position", new Float32BufferAttribute(positions, 3));
  cap.setIndex(indices);
  cap.computeVertexNormals();
  root.add(new Mesh(cap, hair));
  // Gathered bun, with curved surface strands instead of a single smooth ball.
  const bun = new Mesh(new SphereGeometry(1, 40, 28), hair);
  bun.position.set(0, 1.795, -0.045);
  bun.scale.set(0.059, 0.053, 0.053);
  root.add(bun);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const points = [];
    for (let j = 0; j <= 16; j++) {
      const t = (j / 16) * Math.PI;
      points.push([
        0.059 * Math.sin(t) * Math.cos(a + t * 0.5),
        1.795 + 0.054 * Math.cos(t),
        -0.045 + 0.054 * Math.sin(t) * Math.sin(a + t * 0.5),
      ]);
    }
    strand(points, 0.0014, i % 4 === 0 ? highlight : hair);
  }
  // Sweep from an off-center part toward the bun, following the scalp surface.
  for (let i = 0; i < 26; i++) {
    const phi = (i / 26) * Math.PI * 2,
      front = Math.cos(phi);
    const edge = front > 0 ? 1.78 - front * 0.59 : 1.78 - front * 0.38;
    const points = [];
    for (let j = 0; j <= 14; j++) {
      const t = edge * (1 - j / 14),
        sweep = phi + 0.18 * Math.sin((j / 14) * Math.PI);
      points.push([
        0.1 * Math.sin(t) * Math.sin(sweep),
        1.662 + 0.121 * Math.cos(t),
        0.012 + 0.107 * Math.sin(t) * Math.cos(sweep),
      ]);
    }
    strand(points, 0.0015, i % 3 === 0 ? highlight : hair);
  }
  // Loose framing curls, deliberately clear of the animated cheeks and mouth.
  strand(
    [
      [-0.075, 1.724, 0.092],
      [-0.104, 1.675, 0.1],
      [-0.107, 1.61, 0.099],
      [-0.113, 1.556, 0.092],
      [-0.092, 1.526, 0.105],
      [-0.105, 1.493, 0.101],
    ],
    0.0035,
  );
  strand(
    [
      [0.077, 1.709, 0.085],
      [0.102, 1.656, 0.089],
      [0.104, 1.6, 0.091],
      [0.091, 1.562, 0.111],
      [0.104, 1.531, 0.104],
    ],
    0.003,
  );
  const oldHair = model.getObjectByName("Wolf3D_Hair");
  if (oldHair) oldHair.visible = false;
  attach(root, head);
  const blouse = new Group();
  blouse.name = "MayaBlouseCollar";
  for (const sign of [-1, 1]) {
    const g = new BufferGeometry();
    g.setAttribute(
      "position",
      new Float32BufferAttribute(
        [
          sign * 0.035,
          1.489,
          0.061,
          sign * 0.075,
          1.467,
          0.082,
          sign * 0.055,
          1.415,
          0.145,
          sign * 0.016,
          1.444,
          0.129,
        ],
        3,
      ),
    );
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    blouse.add(new Mesh(g, cloth));
  }
  const buttons = new MeshStandardMaterial({
    color: "#f4f1e7",
    roughness: 0.6,
  });
  for (const y of [1.37, 1.3, 1.23]) {
    const button = new Mesh(new SphereGeometry(0.004, 12, 8), buttons);
    button.position.set(0, y, 0.155);
    button.scale.z = 0.4;
    blouse.add(button);
  }
  attach(blouse, chest);
}
