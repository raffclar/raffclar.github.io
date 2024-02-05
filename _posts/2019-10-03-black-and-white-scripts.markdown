---
layout: single
classes: wide
title:  "Reimplementing Black and White (PC game) scripting functions"
date:   2019-10-03 02:37:18 +0100
categories: cpp games 
---

Black and White uses a proprietary language "LHScript". It's extremely simple but it has many inconsistencies.

Every tree, rock, bush, building, light, animal and more is created through a function call. My work so far has been on spawning the objects
into the game world by creating the appropriate components within the entity component system (ECS) and assigning them to new entities.

Here is a line used to create a large immobile rock:
```
CREATE_NEW_FEATURE("1445.55,2136.40", "Pilar2 Lime", 0, 1000, 0)
```

Here is a line used to create an interactable rock:
```
CREATE_MOBILE_STATIC("2030.81,2325.50", 25, 10.184691, 0.214573, 0.825486, 0.000783, 1.6)
```

Here is a simple example of an inconsistency. Both specify the rotation of their rocks as radians. The first uses an int (`1000`) and the second uses a float (`0.825486`). I have to divide the int value to get something useful. 
This is a very common issue across a number of different LHScript functions.

Left side is the original game from 2001.
![First comparison](/assets/b_and_w/black_and_white_1_diff.png)
![Second comparison](/assets/b_and_w/black_and_white_1_diff_2.png)

For our ECS we decided to use [enTT](https://github.com/skypjack/entt). It's a superb library.
