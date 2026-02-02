# Image Shortcodes Reference

This directory contains images used by the AI Teacher through image shortcodes.

## Naming Convention

Images should follow the format: `{subject}_{topic}.webp`

Examples:
- `biology_cell_structure.webp`
- `physics_wave_diagram.webp`
- `chemistry_molecule_structure.webp`

## Required Images

Based on the image shortcode registry, the following images are expected:

### Biology
- `biology_cell_structure.webp` - Cell structure diagram showing organelles
- `biology_dna_structure.webp` - DNA double helix structure
- `biology_digestive_system.webp` - Human digestive system diagram
- `biology_plant_leaf.webp` - Plant leaf structure and photosynthesis
- `biology_ecosystem.webp` - Ecosystem diagram showing food chain

### Physics
- `physics_wave_diagram.webp` - Wave diagram showing amplitude and wavelength
- `physics_circuit_diagram.webp` - Electrical circuit diagram
- `physics_force_diagram.webp` - Force diagram showing vectors
- `physics_motion_graph.webp` - Motion graph showing velocity and acceleration
- `physics.jpeg` - Already exists (used as physics_general)

### Chemistry
- `chemistry_molecule_structure.webp` - Molecular structure diagram
- `chemistry_periodic_table.webp` - Periodic table of elements
- `chemistry_reaction_diagram.webp` - Chemical reaction diagram

### Mathematics
- `math_graph_example.webp` - Mathematical graph example
- `math_geometry_shape.webp` - Geometric shapes and angles
- `math_equation_visualization.webp` - Equation visualization

### General
- `default.webp` - Already exists (used as fallback)

## Image Requirements

- **Format**: WebP (optimized for web)
- **Dimensions**: Recommended 800-1200px width for educational diagrams
- **File Size**: Keep under 500KB when possible
- **Content**: Should align with Tanzanian Form I & II curriculum
- **Accessibility**: Images should be clear, well-labeled, and educational

## Adding New Images

1. Add the image file to this directory following the naming convention
2. Update `app/utilities/imageShortcodes.ts` to add the new shortcode mapping
3. Update the system prompts in `server/api/chat.ts` to include the new shortcode in the available list

## Current Status

- `default.webp` - ✅ Exists
- `physics.jpeg` - ✅ Exists (mapped as physics_general)
- All other images - ⚠️ Need to be added

## Usage in AI Responses

The AI can include shortcodes like:
```
Here's a diagram showing cell structure: [image:biology_cell_structure]
```

The frontend will automatically convert these to actual images.

