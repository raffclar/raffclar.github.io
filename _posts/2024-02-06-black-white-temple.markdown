---
layout: single
classes: wide
title:  "Adding temple interiors to OpenBlack"
date:   2024-02-06 01:00:00 +0100
categories: cpp games
---
# Temple geometry is now loaded in
The vanilla game compresses the larger temple models using Deflate and need to be inflated/decompressed.
<iframe width="560" height="315" src="https://www.youtube.com/embed/aECrwOJlC_8?si=UzKtwN1wj4RiAv3h" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

# Interior lighting sprites
Black & White uses two billboards for most "glow" effects. Light effects are stored in *.glw files which I have started reverse engineering.
Nvidia Nsight is very useful for this sort of stuff; in this picture I have disabled the sprite rendering in the fragment shaders in the vanilla game
to confirm sprite positions and to help match the depth and draw buffer flags.
![vanilla under nsight](/assets/b_and_w/black_and_white_glow_sprites.png)

## Original lights
![vanilla lights](/assets/b_and_w/vanilla_temple_lights.png)
## Openblack lights
![openblack_temple_lights](/assets/b_and_w/openblack_temple_lights.png)
![openblack_creature_cave](/assets/b_and_w/openblack_creature_cave.png)

