import { memo, useRef, useEffect } from 'react';

// WebGL fragment shader approach — 7 layered sine waves with smooth falloff,
// themed via uColorA/uColorB uniforms driven by the app's time-of-day palette.

interface Props {
    primaryColor: string;
    secondaryColor: string;
    slowMode?: boolean;
}

const VERTEX_SRC = /* glsl */ `
  attribute vec2 aVertexPosition;
  void main() {
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SRC = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform float uSpeed;

  const float waveWidthFactor = 1.5;

  vec3 calcSine(
    vec2 uv,
    float speed,
    float frequency,
    float amplitude,
    float phaseShift,
    float verticalOffset,
    vec3 baseColor,
    float lineWidth,
    float sharpness,
    bool invertFalloff
  ) {
    float angle = uTime * uSpeed * speed * frequency * -1.0 + (phaseShift + uv.x) * 2.0;
    float waveY = sin(angle) * amplitude + verticalOffset;
    float deltaY = waveY - uv.y;
    float distanceVal = distance(waveY, uv.y);

    if (invertFalloff) {
      if (deltaY > 0.0) distanceVal *= 4.0;
    } else {
      if (deltaY < 0.0) distanceVal *= 4.0;
    }

    float smoothVal = smoothstep(lineWidth * waveWidthFactor, 0.0, distanceVal);
    float scaleVal  = pow(smoothVal, sharpness);
    return min(baseColor * scaleVal, baseColor);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;

    vec3 col = vec3(0.0);
    // 3 primary waves — sweep the center band
    col += calcSine(uv, 0.2, 0.20, 0.2,  0.0, 0.5, uColorA, 0.1,  15.0, false);
    col += calcSine(uv, 0.4, 0.40, 0.15, 0.0, 0.5, uColorB, 0.1,  17.0, false);
    col += calcSine(uv, 0.3, 0.60, 0.15, 0.0, 0.5, uColorA, 0.05, 23.0, false);
    // 4 secondary waves — float in the lower band
    col += calcSine(uv, 0.1, 0.26, 0.07, 0.0, 0.3, uColorB, 0.1,  17.0, true);
    col += calcSine(uv, 0.3, 0.36, 0.07, 0.0, 0.3, uColorA, 0.1,  17.0, true);
    col += calcSine(uv, 0.5, 0.46, 0.07, 0.0, 0.3, uColorB, 0.05, 23.0, true);
    col += calcSine(uv, 0.2, 0.58, 0.05, 0.0, 0.3, uColorA, 0.2,  15.0, true);

    float alpha = max(col.r, max(col.g, col.b));
    if (alpha <= 0.0) discard;

    // Amplify alpha so wave bands are clearly visible; edge falloff still fades naturally
    gl_FragColor = vec4(col, clamp(alpha * 2.5, 0.0, 0.95));
  }
`;

function parseColor(rgba: string): [number, number, number] {
    const m = rgba.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    if (!m) return [0.7, 0.75, 1.0];
    const r = parseFloat(m[1]) / 255;
    const g = parseFloat(m[2]) / 255;
    const b = parseFloat(m[3]) / 255;
    // Normalize so max channel = 0.8, preserving hue — waves need to be bright
    // against the dark gradient background
    const mx = Math.max(r, g, b, 0.001);
    const s = 0.8 / mx;
    return [Math.min(1, r * s), Math.min(1, g * s), Math.min(1, b * s)];
}

function compileShader(
    gl: WebGLRenderingContext,
    src: string,
    type: number,
): WebGLShader | null {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function RibbonWaves({
    primaryColor,
    secondaryColor,
    slowMode = false,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const colorsRef = useRef({
        primary: primaryColor,
        secondary: secondaryColor,
    });
    const slowRef = useRef(slowMode);

    colorsRef.current = { primary: primaryColor, secondary: secondaryColor };
    slowRef.current = slowMode;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl', {
            alpha: true,
            premultipliedAlpha: false,
        }) as WebGLRenderingContext;
        if (!gl) {
            console.warn('WebGL not available');
            return;
        }

        const vs = compileShader(gl, VERTEX_SRC, gl.VERTEX_SHADER);
        const fs = compileShader(gl, FRAGMENT_SRC, gl.FRAGMENT_SHADER);
        if (!vs || !fs) return;

        const prog = gl.createProgram()!;
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(prog));
            return;
        }
        gl.useProgram(prog);

        const posLoc = gl.getAttribLocation(prog, 'aVertexPosition');
        const uTime = gl.getUniformLocation(prog, 'uTime');
        const uRes = gl.getUniformLocation(prog, 'uResolution');
        const uColorA = gl.getUniformLocation(prog, 'uColorA');
        const uColorB = gl.getUniformLocation(prog, 'uColorB');
        const uSpeed = gl.getUniformLocation(prog, 'uSpeed');

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW,
        );
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // Normal alpha blending — waves sit on top of the gradient background
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        function render(ms: number) {
            const cv = canvasRef.current!;
            const dpr = window.devicePixelRatio || 1;
            const w = cv.clientWidth;
            const h = cv.clientHeight;
            if (!w || !h) {
                rafRef.current = requestAnimationFrame(render);
                return;
            }

            if (
                cv.width !== Math.round(w * dpr) ||
                cv.height !== Math.round(h * dpr)
            ) {
                cv.width = Math.round(w * dpr);
                cv.height = Math.round(h * dpr);
                gl.viewport(0, 0, cv.width, cv.height);
            }

            gl.clear(gl.COLOR_BUFFER_BIT);

            const [r0, g0, b0] = parseColor(colorsRef.current.primary);
            const [r1, g1, b1] = parseColor(colorsRef.current.secondary);

            gl.uniform1f(uTime, ms * 0.001);
            gl.uniform2f(uRes, cv.width, cv.height);
            gl.uniform3f(uColorA, r0, g0, b0);
            gl.uniform3f(uColorB, r1, g1, b1);
            gl.uniform1f(uSpeed, slowRef.current ? 0.35 : 1.0);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            rafRef.current = requestAnimationFrame(render);
        }

        rafRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className='absolute inset-0 pointer-events-none'
            style={{ width: '100%', height: '100%' }}
        />
    );
}

export default memo(RibbonWaves);
