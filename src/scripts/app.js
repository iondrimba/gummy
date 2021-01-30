import '../styles/index.css';
import Stats from 'stats.js';
import chroma from 'chroma-js';
import Tweakpane from 'tweakpane';

import {
  radians,
  hexToRgbTreeJs,
  rgbToHex,
} from './helpers';

function Spring2D(xpos, m) {
  this.x = xpos;
  this.vx = 0;
  this.mass = m;
  this.stiffness = 0.2;
  this.damping = 0.6;

  this.update = function (targetX) {
    let forceX = (targetX - this.x) * this.stiffness;
    let ax = forceX / this.mass;
    this.vx = this.damping * (this.vx + ax);
    this.x += this.vx;
  }
}
export default class App {
  init() {
    this.setup();
    this.createGradientSteps();
    this.createScene();
    this.createCamera();
    this.addCameraControls();
    this.addAmbientLight();
    this.addFloor();
    this.addMeshes();
    this.addDirectionalLight();
    this.addStatsMonitor();
    this.animate();
    this.addGuiControls();
    this.addWindowListeners();
  }

  setup() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.motion = {
      mouseX: 0,
      velocity: .2,
      mass: 6.0,
      spring: () => {
        if (this.spring) {
          return this.spring;
        }

        this.spring = new Spring2D(this.width / 2, this.motion.mass)

        return this.spring;
      },
    }

    this.meshes = {
      container: new THREE.Object3D(),
      original: [],
      animated: [],
      total: 10,
    };

    const bgColor = rgbToHex(window.getComputedStyle(document.body).backgroundColor);

    this.colors = {
      background: bgColor,
      primary: bgColor,
      secondary: '#e4f262',
      scheme: {
        type: 'gradient',
        options: {
          monochromatic: 'monochromatic',
          gradient: 'gradient',
        }
      },
      gradient: {
        steps: 10,
        dividers: {},
        colors: () => {
          return chroma.scale([this.colors.primary, this.colors.secondary])
            .mode('lch')
            .colors(this.colors.gradient.steps);
        }
      }
    };
  }

  createGradientSteps() {
    const total = this.meshes.total;
    for (let index = 0; index <= this.meshes.total; index++) {
      if (total % index === 0) {
        this.colors.gradient.dividers = Object.assign({}, this.colors.gradient.dividers, { [index]: index });
      }
    }
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.colors.background);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    this.scene.add(this.meshes.container);
    this.renderer.setSize(this.width, this.height);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(this.renderer.domElement);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(25, this.width / this.height, 1, 500);
    this.camera.position.set(0, 8, 0);

    this.scene.add(this.camera);
  }

  addCameraControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = .04;
    this.controls.minPolarAngle = radians(90);
    this.controls.maxPolarAngle = radians(130);
    this.controls.minAzimuthAngle = radians(-50);
    this.controls.maxAzimuthAngle = radians(50);

    document.body.style.cursor = '-moz-grabg';
    document.body.style.cursor = '-webkit-grab';

    this.controls.addEventListener('start', () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = '-moz-grabbing';
        document.body.style.cursor = '-webkit-grabbing';
      });
    });

    this.controls.addEventListener('end', () => {
      requestAnimationFrame(() => {
        document.body.style.cursor = '-moz-grab';
        document.body.style.cursor = '-webkit-grab';
      });
    });
  }

  addAmbientLight() {
    const light = new THREE.AmbientLight({ color: '#ffffff' }, .35, 500);

    this.scene.add(light);
  }

  addDirectionalLight() {
    const target = new THREE.Object3D();
    target.position.set(-10, 0, -12);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.camera.needsUpdate = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.position.set(2, 4, 2);
    this.directionalLight.target = target;

    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);
  }

  addFloor() {
    const geometry = new THREE.PlaneBufferGeometry(2000, 2000);
    const material = new THREE.MeshStandardMaterial({ color: this.colors.background });

    this.floor = new THREE.Mesh(geometry, material);
    this.floor.position.y = 0;
    this.floor.receiveShadow = true;
    this.floor.rotation.z = Math.PI / 2;

    this.scene.add(this.floor);
  }

  getMesh({ width, height, depth }) {
    const geometry = new THREE.BoxBufferGeometry(width, height, depth);

    const matParams = {
      emissive: 0x0,
      roughness: 1,
      metalness: 0,
    };

    const material = new THREE.MeshStandardMaterial(matParams);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.position.set(0, 0, 0);

    return mesh;
  }

  addMeshes() {
    const geometric = {
      width: .8,
      height: .8,
      depth: .1,
    };

    for (let index = 0; index < this.meshes.total; index++) {
      geometric.width = ((this.meshes.total - index) + (index * .1)) * .2;
      geometric.height = geometric.width;

      const mesh = this.getMesh(geometric);
      mesh.position.z = index * .1;

      this.meshes.original[index] = mesh;
      this.meshes.animated[index] = mesh;

      this.meshes.container.add(mesh);
    }

    this.meshes.animated.reverse();
    this.motion.spring().update((this.motion.mouseX - ((this.width * .5))) * 2);

    for (let index = 0; index < this.meshes.animated.length; index++) {
      const mesh = this.meshes.animated[index];

      if (index > 0) {
        mesh.initialRotationZ = this.meshes.animated[index - 1].initialRotationZ + .1;
      } else {
        mesh.initialRotationZ = 0;
      }
    }

    this.updateColors();
  }

  updateColors() {
    const colors = this.colors.gradient.colors();

    let colorIndex = -1;

    for (let index = 0; index < this.meshes.total; index++) {
      const mesh = this.meshes.original[index];

      if (this.colors.scheme.type === this.colors.scheme.options.monochromatic) {
        mesh.material.color = index % 2 === 0 ? hexToRgbTreeJs(this.colors.primary) : hexToRgbTreeJs(this.colors.secondary);
      } else {
        index % Math.round(this.meshes.total / this.colors.gradient.steps) === 0
          ? colorIndex++
          : colorIndex;

        mesh.material.color = hexToRgbTreeJs(colors[colorIndex]);
      }
    }
  }

  draw() {
    this.meshes.container.rotation.z = -this.motion.velocity;
    this.motion.spring().update((this.motion.mouseX - ((this.width * .5))) * 2);

    for (let index = 0; index < this.meshes.total; index++) {
      const mesh = this.meshes.animated[index];

      gsap.to(mesh.rotation, .1, {
        z: -(this.motion.spring().x / 800) + mesh.initialRotationZ,
        delay: index * .05,
      });
    }

    this.motion.velocity += .01;
  }

  addGuiControls() {
    this.pane = new Tweakpane();
    this.guiColors = this.pane.addFolder({
      title: 'Colors',
      expanded: true,
    });

    this.guiColors.addInput(this.colors, 'background').on('change', (value) => {
      this.floor.material.color = hexToRgbTreeJs(value);
    });

    this.guiColors.addInput(this.colors.scheme, 'type', {
      options: this.colors.scheme.options,
    }).on('change', (value) => {
      this.colors.scheme.type = value;

      this.updateColors();
    });

    this.guiGradient = this.pane.addFolder({
      title: 'Gradient',
      expanded: true,
    });

    this.guiGradient.addInput(this.colors, 'primary').on('change', (value) => {
      this.colors.primary = value;

      this.updateColors();
    });

    this.guiGradient.addInput(this.colors, 'secondary').on('change', (value) => {
      this.colors.secondary = value;

      this.updateColors();
    });

    this.guiGradient.addInput(this.colors.gradient, 'steps', {
      options: this.colors.gradient.dividers,
    }).on('change', (value) => {
      this.colors.gradient.steps = Math.floor(value);

      this.updateColors();
    });
  }

  addWindowListeners() {
    window.addEventListener('resize', this.onResize.bind(this), { passive: true });
    window.addEventListener('mousemove', ({ x }) => {
      this.motion.mouseX = x;
    }, { passive: true });
  }

  addStatsMonitor() {
    this.stats = new Stats();
    this.stats.showPanel(0);

    document.body.appendChild(this.stats.dom);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    this.stats.begin();
    this.draw();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();

    requestAnimationFrame(this.animate.bind(this));
  }
}
