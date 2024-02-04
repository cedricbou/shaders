precision mediump float;

#define PI 3.14159265359
#define LAYERS 6.0

in vec2 fragCoord;
out vec4 fragColor;

uniform float iTime;

mat2 rotate(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, - s, s, c);
}

float hash21_v2(vec2 p, float seed) {
    seed = sin(seed) + PI;
    
    return fract(
        sin(dot(p.xy, vec2(12.9898 * seed, 78.233 * seed))) * 43758.5453123
    );
}

/**
* 2D hash function.
* @param p - 2D vector.
* @return - Random value between 0 and 1.
*/
float hash21(vec2 p) {
    /*    p = fract(p * vec2(125.3983, 237.4427));
    p += dot(p, p + 23.14069263277926);
    return fract(p.x * p.y);*/
    return hash21_v2(p, 1.0);
}

/**
* Star generator function.
* @param uv - 2D vector.
* @param flare - Flare intensity.
* @return - Star intensity.
*/
float star2(vec2 uv, float flare) {
    // Star center disc.
    float d = length(uv);
    float m = 0.05 / d;
    
    // Star cross rays.
    float rays = max(0.0, 1.0 - 1.0 * abs(uv.x * uv.y * 200.0));
    m += rays * 0.3 * flare;
    
    uv *= rotate(PI / 4.0);
    rays = max(0.0, 1.0 - 1.0 * abs(uv.x * uv.y * 200.0));
    m += rays * 0.1 * flare;
    
    m *= smoothstep(1.0, 0.1, d);
    
    return m;
}

vec3 starLayer(vec2 uv) {
    // Initial color.
    vec3 col = vec3(0.0);
    
    // Get grid position from fractional part.
    // This will be used to generate as many stars
    // as the grid size (uv is -0.5 to 0.5,
    // multiplied by 3.0, so -1.5 to 1.5, so 3x3 grid size)
    vec2 gv = fract(uv) - 0.5;
    
    // Draw the star for each grid cell, taking into account
    // the glow of its neighbors.
    for(float y =- 1.0; y <= 1.0; y ++ ) {
        for(float x =- 1.0; x <= 1.0; x ++ ) {
            // Use the integer part to have unique seeds for each grid cell.
            vec2 id = floor(uv + vec2(x, y));
            
            vec2 locgv = gv - vec2(x, y);
            
            // Use the id to generate pseudo random values
            // between 0 nd 1.
            float n = hash21_v2(id, - 23.0);
            float n1 = hash21_v2(id, 3.0);
            float n2 = hash21_v2(id, - 8.0);
            float n3 = hash21_v2(id, 36.0);
            
            // Draw the star for each grid cell.
            // Apply an offset based on random value.
            // offset x by the random value (-0.5 to be in grid)
            // offset y by the fractionnal of random value * 10.
            float size = fract(n * 21.0) + 0.2;
            float star = star2(locgv - (vec2(n, n1) - 0.5), 0.2 * smoothstep(0.7, 1.0, size));
            vec3 color = sin(vec3(n3, n2, fract(n1 + n3)) * 4.0 * PI) * 0.5 + 0.5;
            color = clamp(color * vec3(0.7, 0.5, 1.0 + size * 5.0), 0.0, 1.0);
            
            star *= clamp(sin(iTime * fract(n2) * 1.5 * PI + n * 2.0 * PI) * 0.5 + 0.5, 0.5, 1.0);
            col += color * star * size;
        }
    }
    
    return col;
}

void main()
{
    vec2 uv = fragCoord - 0.5;
    float t = iTime * 0.05;
    
    vec3 col = vec3(0.0);
    
    uv *= rotate(t);
    
    for(float i = 0.0; i < 1.0; i += 1.0 / LAYERS) {
        float depth = fract(i + t);
        float scale = mix(20.0, 0.5, depth);
        float fade = depth * smoothstep(1.0, 0.9, depth);
        col += starLayer(uv * scale + i * 854.21) * fade;
    }
    
    fragColor = vec4(col, 1.0);
}