precision mediump float;

#define PI 3.14159265359

in vec2 fragCoord;
out vec4 fragColor;

mat2 rotate(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, - s, s, c);
}

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
    
    return m;
}

void main()
{
    vec2 uv = fragCoord - 0.5;
    uv *= 3.0;
    
    vec3 col = vec3(0.0);
    vec2 gv = fract(uv) - 0.5;
    vec2 id = floor(uv);
    
    col += star2(gv, 0.2);
    
    col.rg += id;
    
    if (gv.x > 0.48 || gv.y > 0.48) {
        col.r = 1.0;
    }
    
    fragColor = vec4(col, 1.0);
}