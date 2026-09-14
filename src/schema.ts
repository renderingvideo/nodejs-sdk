// Schema 2.0 types synchronized from the RenderingVideo renderer.
/**
 * AI Video JSON Schema - TypeScript 类型定义
 */

export interface Meta {
  version: string;
  title?: string;
  description?: string;
  author?: string;
  createdAt?: string;
  tags?: string[];
  width: number;
  height: number;
  fps: number;
  background?: string | 'transparent' | Gradient;
}

export interface Assets {
  fonts?: FontAsset[];
  images?: ImageAsset[];
  videos?: VideoAsset[];
  audios?: AudioAsset[];
  subtitles?: SubtitleAsset[];
  models?: ModelAsset[];
  svgs?: SvgAsset[];
}

export interface FontAsset {
  id: string;
  src: string;
  family: string;
  weight?: number | string;
  style?: 'normal' | 'italic';
}

export interface ImageAsset {
  id: string;
  src: string;
}

export interface VideoAsset {
  id: string;
  src: string;
}

export interface AudioAsset {
  id: string;
  src: string;
}

export interface SubtitleAsset {
  id: string;
  words: SubtitleWord[];
}

export interface ModelAsset {
  id: string;
  src: string;
}

export interface SvgAsset {
  id: string;
  svg?: string;
  src?: string;
}

export type AssetReference = string | { $ref: string };
export type SvgReference = string | { $ref: string };

export interface SubtitleWord {
  word: string;
  punctuated_word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface Track {
  id?: string;
  clips: Clip[];
}

export interface BaseClip {
  id?: string;
  type: ClipType;
  start: number;
  duration: number;
  transform?: Transform;
  zIndex?: number;
  opacity?: number;
  style?: Style;
  animations?: Animation[];
  keyframes?: Keyframe[];
  transition?: Transition;
}

export type ClipType =
  | 'video'
  | 'image'
  | 'text'
  | 'rect'
  | 'circle'
  | 'polygon'
  | 'three'
  | 'code'
  | 'svg'
  | 'icon'
  | 'line'
  | 'path'
  | 'audio'
  | 'subtitle'
  | 'layout'
  | 'template';

export type TemplateType =
  | 'product-intro'
  | 'slideshow'
  | 'subtitle-video'
  | 'talking-head'
  | 'comparison'
  | 'countdown'
  | 'text-reveal'
  | 'news'
  | 'quote'
  | 'list';

export interface TemplateClip extends BaseClip {
  type: 'template';
  template: TemplateType;
  variant?: string;
  version?: string;
  data: Record<string, any>;
  overrides?: TemplateOverrides;
}

export interface MediaSource {
  start?: number;
  end?: number;
}

export interface VideoClip extends BaseClip {
  type: 'video';
  src: AssetReference;
  source?: MediaSource;
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
}

export interface ImageClip extends BaseClip {
  type: 'image';
  src: AssetReference;
}

export interface TextClip extends BaseClip {
  type: 'text';
  text: string;
}

export interface RectClip extends BaseClip {
  type: 'rect';
}

export interface CircleClip extends BaseClip {
  type: 'circle';
  size: number;
  startAngle?: number;
  endAngle?: number;
}

export interface PolygonClip extends BaseClip {
  type: 'polygon';
  sides: number;
  size: number;
}

export interface CodeClip extends BaseClip {
  type: 'code';
  code: string;
  language?: string;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  selection?: any;
}

export interface SvgClip extends BaseClip {
  type: 'svg';
  svg?: SvgReference;
  src?: AssetReference;
}

export interface IconClip extends BaseClip {
  type: 'icon';
  icon: string;
  color?: string;
}

export type CurvePoint =
  | [number, number]
  | {
      x: number;
      y: number;
    };

export interface CurveClip extends BaseClip {
  points?: CurvePoint[];
  data?: string;
  closed?: boolean;
  drawStart?: number;
  drawEnd?: number;
  startOffset?: number;
  endOffset?: number;
  startArrow?: boolean;
  endArrow?: boolean;
  arrowSize?: number;
  lineWidth?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'round' | 'bevel' | 'miter';
}

export interface LineClip extends CurveClip {
  type: 'line';
  points: CurvePoint[];
  radius?: number;
}

export interface PathClip extends CurveClip {
  type: 'path';
  data: string;
}

export type ThreeVector3 =
  | [number, number, number]
  | {
      x?: number;
      y?: number;
      z?: number;
    };

export interface ThreeCamera {
  fov?: number;
  near?: number;
  far?: number;
  position?: ThreeVector3;
  rotation?: ThreeVector3;
  lookAt?: ThreeVector3;
}

export interface ThreeRenderer {
  alpha?: boolean;
  antialias?: boolean;
  clearColor?: string;
  clearAlpha?: number;
  shadows?: boolean;
}

export interface ThreeLight {
  type: 'ambient' | 'directional' | 'point' | 'spot';
  color?: string;
  intensity?: number;
  position?: ThreeVector3;
  target?: ThreeVector3;
  distance?: number;
  decay?: number;
  angle?: number;
  penumbra?: number;
  castShadow?: boolean;
}

export type ThreeGeometryType =
  | 'box'
  | 'sphere'
  | 'plane'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'icosahedron'
  | 'dodecahedron';

export interface ThreeGeometry {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  radiusTop?: number;
  radiusBottom?: number;
  tube?: number;
  radialSegments?: number;
  tubularSegments?: number;
  widthSegments?: number;
  heightSegments?: number;
  depthSegments?: number;
  detail?: number;
}

export interface ThreeMaterial {
  type?: 'normal' | 'basic' | 'standard' | 'phong' | 'lambert' | 'toon';
  color?: string;
  emissive?: string;
  wireframe?: boolean;
  opacity?: number;
  transparent?: boolean;
  roughness?: number;
  metalness?: number;
  flatShading?: boolean;
  side?: 'front' | 'back' | 'double';
}

export type ThreeAnimationProperty =
  | 'position'
  | 'position.x'
  | 'position.y'
  | 'position.z'
  | 'rotation'
  | 'rotation.x'
  | 'rotation.y'
  | 'rotation.z'
  | 'scale'
  | 'scale.x'
  | 'scale.y'
  | 'scale.z'
  | 'material.color'
  | 'material.opacity'
  | 'fov';

export interface ThreeAnimation {
  property: ThreeAnimationProperty;
  duration: number;
  delay?: number;
  easing?: EasingFunction;
  loop?: boolean | number;
  from?: any;
  to?: any;
}

export interface ThreeObject {
  id?: string;
  model?: AssetReference;
  autoCenter?: boolean;
  autoScale?: number;
  shape?: ThreeGeometryType;
  geometry?: ThreeGeometry;
  position?: ThreeVector3;
  rotation?: ThreeVector3;
  scale?: number | ThreeVector3;
  color?: string;
  material?: ThreeMaterial;
  castShadow?: boolean;
  receiveShadow?: boolean;
  animations?: ThreeAnimation[];
}

export interface ThreeClip extends BaseClip {
  type: 'three';
  camera?: ThreeCamera;
  renderer?: ThreeRenderer;
  lights?: ThreeLight[];
  objects?: ThreeObject[];
  cameraAnimations?: ThreeAnimation[];
}

export interface AudioClip extends BaseClip {
  type: 'audio';
  src: AssetReference;
  source?: MediaSource;
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
  fadeIn?: number;
  fadeOut?: number;
  pan?: number;
  detune?: number;
  gainEnvelope?: AudioEnvelopePoint[];
  ducking?: AudioDucking;
}

export interface AudioEnvelopePoint {
  time: number;
  volume: number;
  easing?: EasingFunction;
}

export interface AudioDucking {
  targets: string[];
  amount?: number;
  attack?: number;
  release?: number;
}

export type SubtitleSource =
  | SubtitleWord[]
  | { $ref: string }
  | { src: string };

export interface SubtitleConfig {
  mode?: 'batch' | 'stream';
  wordsPerBatch?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  textAlign?: 'left' | 'center' | 'right';
  textBoxWidth?: number | string;
  textColor?: string;
  highlightColor?: string;
  backgroundColor?: string;
  shadowColor?: string;
  shadowBlur?: number;
  borderColor?: string;
  borderWidth?: number;
  fadeInAnimation?: boolean;
  position?: 'bottom' | 'top' | 'center';
  paddingBottom?: number;
}

export interface SubtitleClip extends BaseClip {
  type: 'subtitle';
  words: SubtitleSource;
  config?: SubtitleConfig;
}

export interface LayoutClip extends BaseClip {
  type: 'layout';
  direction?: 'horizontal' | 'vertical';
  gap?: number;
  padding?: number | [number, number, number, number];
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyContent?:
    | 'start'
    | 'center'
    | 'end'
    | 'space-between'
    | 'space-around';
  clip?: boolean;
  children: Clip[];
}

export type Clip =
  | VideoClip
  | ImageClip
  | TextClip
  | RectClip
  | CircleClip
  | PolygonClip
  | ThreeClip
  | CodeClip
  | SvgClip
  | IconClip
  | LineClip
  | PathClip
  | AudioClip
  | SubtitleClip
  | LayoutClip
  | TemplateClip;

export interface Transform {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  scale?: number | [number, number];
  rotation?: number;
  skew?: [number, number];
  anchor?: Anchor;
}

export type Anchor =
  | 'center'
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export interface Style {
  opacity?: number;
  objectFit?: 'fill' | 'cover' | 'contain';
  fill?: string | Gradient;
  stroke?: string;
  strokeWidth?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: 'normal' | 'italic';
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';
  textWrap?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: [number, number];
  borderRadius?: number | [number, number, number, number];
  filters?: Filter[];
  cache?: boolean;
  cachePadding?: number | [number, number, number, number];
  composite?: boolean;
  compositeOperation?: string;
}

export interface Gradient {
  type: 'linear' | 'radial' | 'conic';
  angle?: number;
  stops: Array<{
    offset: number;
    color: string;
  }>;
}

export type FilterType =
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'saturate'
  | 'hue'
  | 'grayscale'
  | 'sepia'
  | 'invert';

export interface Filter {
  type: FilterType;
  value: number;
}

export interface Animation {
  type: AnimationType;
  duration: number;
  delay?: number;
  easing?: EasingFunction;
  loop?: boolean | number;
  from?: any;
  to?: any;
  filter?: FilterType;
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
}

export type AnimationType =
  | 'fadeIn'
  | 'fadeOut'
  | 'move'
  | 'scale'
  | 'rotate'
  | 'filter'
  | 'slideIn'
  | 'slideOut'
  | 'zoomIn'
  | 'zoomOut';

export type EasingFunction =
  | 'linear'
  | 'easeInSine'
  | 'easeOutSine'
  | 'easeInOutSine'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInQuart'
  | 'easeOutQuart'
  | 'easeInOutQuart'
  | 'easeInBack'
  | 'easeOutBack'
  | 'easeInOutBack'
  | 'easeInElastic'
  | 'easeOutElastic'
  | 'easeInOutElastic'
  | 'easeInBounce'
  | 'easeOutBounce'
  | 'easeInOutBounce';

export interface Keyframe {
  property: string;
  frames: KeyframeFrame[];
}

export interface KeyframeFrame {
  time: number;
  value: any;
  easing?: EasingFunction;
}

export interface Transition {
  type:
    | 'fade'
    | 'slide'
    | 'zoom'
    | 'wipe'
    | 'blur'
    | 'push'
    | 'iris'
    | 'spin'
    | 'lightSweep';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  easing?: EasingFunction;
  blur?: number;
  intensity?: number;
  rotation?: number;
  scale?: number;
}

export interface TemplateOverrides {
  data?: Record<string, any>;
  style?: Style;
  transition?: Transition;
  zIndexOffset?: number;
}

export interface VideoSchema {
  meta: Meta;
  assets?: Assets;
  tracks: Track[];
}
