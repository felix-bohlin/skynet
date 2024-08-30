import pygame
from pygame.math import Vector3
from OpenGL.GL import *
from OpenGL.GLU import *
import random
import math

# Initialize Pygame and OpenGL
pygame.init()
display = (800, 600)
pygame.display.set_mode(display, pygame.DOUBLEBUF | pygame.OPENGL)

# Set up the OpenGL environment
glEnable(GL_DEPTH_TEST)
glEnable(GL_LIGHTING)
glShadeModel(GL_SMOOTH)
glEnable(GL_COLOR_MATERIAL)
glColorMaterial(GL_FRONT_AND_BACK, GL_AMBIENT_AND_DIFFUSE)

# Set up the light
light_position = [0, 0, 0, 1]
light_color = [1, 1, 1, 1]
light_intensity = 1.0
glLightfv(GL_LIGHT0, GL_POSITION, light_position)
glLightfv(GL_LIGHT0, GL_DIFFUSE, light_color)
glEnable(GL_LIGHT0)

# Function to generate a cube
def generate_cube():
    vertices = [
        [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, -1],
        [1, -1, 1], [1, 1, 1], [-1, -1, 1], [-1, 1, 1]
    ]
    edges = [
        (0,1), (1,2), (2,3), (3,0),
        (4,5), (5,6), (6,7), (7,4),
        (0,4), (1,5), (2,6), (3,7)
    ]
    return vertices, edges

# Function to generate a sphere
def generate_sphere(radius=1, slices=20, stacks=20):
    vertices = []
    for i in range(stacks + 1):
        phi = math.pi * i / stacks
        for j in range(slices):
            theta = 2 * math.pi * j / slices
            x = radius * math.sin(phi) * math.cos(theta)
            y = radius * math.sin(phi) * math.sin(theta)
            z = radius * math.cos(phi)
            vertices.append([x, y, z])
    return vertices, []

# Function to generate a pyramid
def generate_pyramid():
    vertices = [
        [0, 1, 0], [-1, -1, 1], [1, -1, 1],
        [1, -1, -1], [-1, -1, -1]
    ]
    edges = [
        (0,1), (0,2), (0,3), (0,4),
        (1,2), (2,3), (3,4), (4,1)
    ]
    return vertices, edges

# Function to draw the object
def draw_object(vertices, edges, draw_mode):
    if draw_mode == GL_LINE_LOOP:
        glBegin(GL_LINES)
        for edge in edges:
            for vertex in edge:
                glVertex3fv(vertices[vertex])
        glEnd()
    elif draw_mode == GL_TRIANGLE_STRIP:
        glBegin(GL_TRIANGLE_STRIP)
        for vertex in vertices:
            glVertex3fv(vertex)
        glEnd()

# Main game loop
def main():
    object_type = "cube"
    vertices, edges = generate_cube()
    clock = pygame.time.Clock()
    rotation = [0, 0, 0]
    light_position = [0, 0, 0, 1]
    object_color = [1, 1, 1]
    draw_mode = GL_LINE_LOOP

    print("Controls:")
    print("SPACE: Switch between cube, sphere, and pyramid")
    print("Arrow keys: Move light source")
    print("R/G/B: Change object color")
    print("+ / -: Increase/decrease light intensity")
    print("L: Toggle between line and filled mode")
    print("Q: Quit the application")

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                quit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    object_type = ["cube", "sphere", "pyramid"][(["cube", "sphere", "pyramid"].index(object_type) + 1) % 3]
                    if object_type == "cube":
                        vertices, edges = generate_cube()
                    elif object_type == "sphere":
                        vertices, edges = generate_sphere()
                    else:
                        vertices, edges = generate_pyramid()
                elif event.key == pygame.K_UP:
                    light_position[1] += 1
                elif event.key == pygame.K_DOWN:
                    light_position[1] -= 1
                elif event.key == pygame.K_LEFT:
                    light_position[0] -= 1
                elif event.key == pygame.K_RIGHT:
                    light_position[0] += 1
                elif event.key == pygame.K_r:
                    object_color[0] = 1 - object_color[0]
                elif event.key == pygame.K_g:
                    object_color[1] = 1 - object_color[1]
                elif event.key == pygame.K_b:
                    object_color[2] = 1 - object_color[2]
                elif event.key == pygame.K_PLUS or event.key == pygame.K_KP_PLUS:
                    light_intensity = min(light_intensity + 0.1, 1.0)
                elif event.key == pygame.K_MINUS or event.key == pygame.K_KP_MINUS:
                    light_intensity = max(light_intensity - 0.1, 0.0)
                elif event.key == pygame.K_l:
                    draw_mode = GL_TRIANGLE_STRIP if draw_mode == GL_LINE_LOOP else GL_LINE_LOOP
                elif event.key == pygame.K_q:
                    pygame.quit()
                    quit()

        # Clear the screen and set the camera
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        glLoadIdentity()
        gluPerspective(45, (display[0] / display[1]), 0.1, 50.0)
        glTranslatef(0.0, 0.0, -5)

        # Update light position and intensity
        glLightfv(GL_LIGHT0, GL_POSITION, light_position)
        glLightfv(GL_LIGHT0, GL_DIFFUSE, [c * light_intensity for c in light_color])

        # Rotate the object
        glRotatef(rotation[0], 1, 0, 0)
        glRotatef(rotation[1], 0, 1, 0)
        rotation[0] += 1
        rotation[1] += 1

        # Set object color
        glColor3fv(object_color)

        # Draw the object
        draw_object(vertices, edges, draw_mode)

        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()
