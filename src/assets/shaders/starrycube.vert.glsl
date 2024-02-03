#pragma shader_stage(vertex)

void main()
{
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}
