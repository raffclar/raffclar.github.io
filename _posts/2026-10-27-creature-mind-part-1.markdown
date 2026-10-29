---
layout: single
title:  "Black & White: Inside the creature's mind, part 1 how it feels"
date:   2026-10-27 09:00:00 +0000
categories: ai games black-and-white
---
<link rel="stylesheet" href="/assets/creature_ai/creature-ai.css">
<script src="/assets/creature_ai/creature-ai.js" defer></script>
# Desires, and the logic that drives them

In Black & White (2001), you raise a giant creature. It eats, sleeps, plays, fights, and even learns.
It was one of the major selling points of the game and a fairly serious and sizeable portion of the game's code.
Back in the day, many players thought that it was alive and developed attachments to their creatures (I did!).

I highly recommend reading **AI Game Programming Wisdom** (ISBN 978-1584500773), section 11.2, pages 567-578,
by Lionhead AI designer Richard Evans. Much of the content in these three posts is discussed in detail in this book,
and I've checked decompiled code from the game against his explanations of the Black & White creature AI.

<figure class="cai-fig">
<img src="/assets/creature_ai/intro_series.png" alt="The three creatures stand in a forest glade: a cow, an orange ape and a tiger.">
<figcaption>The three creatures that you can choose from at the start of the game: the cow, the ape and the tiger.</figcaption>
</figure>

The code of the original game has been extensively studied thanks to
[bw1-decomp](https://github.com/openblack/bw1-decomp), a project ran by the openblack team. This series
tells you what was found inside the creature's mind. You do not need to know much about AI here. I'll attempt to explain
each idea when it comes up. The goal here is to talk at a high level about the creature's logic without digging into the
decompiled code or assembly.

Everything written comes from version 1.20 of the original game, there's a 1.30 patch which adds support for the
P-5 glove, but few apply it. I'll save the Creature Isle expansion pack for another series as there are some
interesting changes. Additionally, I suspect Black & White 2's creature AI follows roughly the same logic,
but we'll see.

* **Part 1: how it feels.** Desires, and the curve that drives them.
* [Part 2: how it chooses]({% post_url 2026-10-27-creature-mind-part-2 %}). How it acts on those Desires with Plans,
  and how it picks one.
* [Part 3: how it learns]({% post_url 2026-10-27-creature-mind-part-3 %}). Player reward and punish system, decision
  trees, and copying villagers and the player.

<figure class="cai-fig">
<img src="/assets/creature_ai/p1-hungry-tiger.jpg" alt="A tiger creature stands on a grass field. Bars at the left show Damage 0%, Hunger 80%, Tiredness 0%.">
<figcaption>A mature tiger. Its Hunger is at 80%. The bars at the left show three out of forty of its desires.</figcaption>
</figure>

## An agent

In AI, an **agent** is a thing that senses the world, decides, and then acts. A robot vacuum is an agent,
a chess program is an agent, and the creature in Black & White is an agent too.

The Lionhead AI designers built the Black & White's creature on those three ideas:

* **B**eliefs. What the creature knows about each object near it. For example,
  "That sheep over there near the village is mine and it's alive."
* **D**esires. What the creature wants. For example, "I am hungry right now."
* **I**ntentions, or plans. What the creature will do now to satisfy that desire. "I'll eat that sheep."

AI designers and developers call this type of system a "Belief-Desire-Intention" agent.

I'll discuss desires in this first part of the series and in part 2 we'll go over plans.
Finally, in part 3, we'll see how beliefs and desires change when you teach the creature using the punish and reward
system.

## One turn of thought

The creature in Black & Whites thinks in short steps in the main game loop. We'll call each step a **turn** for clarity.
There are about ten turns each second. In each turn for every creature individually on the map, the game does a number
of things to make the creature think:

1. It makes the creature look at the world.
2. It updates its forty desires based on those inputs.
3. It decides what to do to satisfy its desires.
4. It then does the next small part (step) of its plan to achieve a specific desire.

When you slap or stroke your creature, it learns. The lesson changes its desires and beliefs. Then the loop
starts again.

<div class="cai" id="cai-loop"><h4>The loop of thought</h4></div>

Creature turns tie in with the game's turn loop. In multiplayer games with more than two creatures, the game will reduce
the creature's AI load on the system by limiting how many much effort goes into step 3.

## Forty desires

The creature in Black & White has 40 desires. They cover a wide area of needs and wants:

Some of the creature's desires are needs: hunger, tiredness, thirst, and the need to poo.

Some of the desires are emotions such as fear, anger, compassion, and curiosity, happiness, and there's even one called
wanderlust.

Some are purely social: the creature wants to play, or maybe to impress a town, or perhaps to have another creature as
a friend.

Each desire is a number in Black & White. Desires can 0 or above. If a desire is 0, it has no effect on the creature.

Most desires stop at a maximum near 1 or 2. For example, Hunger can go up to 2.0, and Fear can go up to 0.92. A
creature's species affects their desires and what the player teaches them can change how those desires behave too
(see Part 3).

## Sources: where desires come from

A desire does not grow on its own as inputs will push it up. The game calls these inputs **sources**.
For Black & White's creatures, there are 61 sources and each one represents something about the creature or the world.

Here's some examples we've found:

* A creature with low energy pushes the Hunger desire.
* Exhaustion pushes the Tiredness desire.
* The night source (when in-game world is night time) pushes Tiredness and Fear.
* Damage to the creature pushes two as well: Fear and the desire to restore health.

Each source has a **threshold**.

<div class="cai-box def"><strong>Threshold</strong>
A threshold is a limit. Below it, a source has almost no effect. Above it, the source has its full effect. For example,
the energy source for Hunger has a threshold of 0.4. The creature does not feel very hungry until it has used 40% of
its energy.</div>

But the change at the threshold is not a sudden boolean flip; it is a smooth change in a relatively short distance.
To achieve this smoothness, the game uses a **sigmoid** function.

Note: sources can hold a negative value, but in practice they are always zero or above.

## The sigmoid, in plain words

<div class="cai-box def"><strong>Sigmoid</strong>
A sigmoid is a curve with the shape of the letter S. When applied to a number, that number will sit somewhere between
0 and 1. Large negative numbers become nearly 0. Large positive numbers become nearly 1. Zero becomes exactly 0.5.</div>

Think about a light dimmer, and the knob to control the level of light. Initially at first, when you turn the knob,
almost nothing happens. Near the middle, the light comes on fast and then a with a bit more turning the light is at full
power but if you turn the knob more, the light does not get brighter.

That is what sigmoid basically does. Many AI systems use sigmoids. They are useful when you want a "yes or no" answer
that is not too sharp. The answer can be "almost yes" or "a little bit yes". This might seem like a small detail
honestly, but it helps smooth out the creature's sources for fulfilling desires.

The creature puts each source through a sigmoid. The input is how far the source is above or below its threshold. The
output is the **drive**: how hard this source pushes its desire.

Move the slider. The yellow line is the game's curve. The blue line is a softer S-curve, for comparison.

<div class="cai" id="cai-sigmoid"><h4>Try it: the creature's sigmoid</h4></div>

The game's curve is very steep. Look at the steps in the yellow line; we can see the game does not calculate the curve
each time. It keeps 41 numbers in a lookup table, and it reads the nearest one. The reason for this is pretty simple: it
is fast and inexpensive, and back in 2001, Black & White needed every optimisation to run steadily as it was a bit of a
beast of a game to run.

The steep curve makes each source act almost like a switch; below the threshold, the drive is tiny and barely affects
the desire but above it, the drive quickly rises and the desire reaches its full effect.

There is one small surprise. Below the threshold, the drive is tiny, but it is almost never zero. Near the bottom
of the table, it is about 0.000000004. In most cases, while any source of a desire has a value, that desire does not
fade on its own. Desires go down when the creature does something about them.

## Why a sigmoid?

The code does not tell us why the designers chose a sigmoid specifically, but sigmoid is widespread in gamedev wherever
there's probability and decision-making logic. Think about the other ways we could turn a source into a drive:

**We could use the raw value.** This causes Hunger to start rising as soon as the creature uses any energy. This means
  there is no "I am fine for now" happy zone and a creature that just ate a minute ago is already a little bit hungry.

**Or we could use an on/off switch.** Hunger is off below the threshold and on above it but now the creature changes
  its mood in one big jump, not very realistic. When the energy moves up and down near the threshold, the drive goes
  on, off, on, off.

**Use a sigmoid.** Now when we're below the threshold, the creature is calm but Above it, the drive is full. Now when
  we're between the two, there is a short zone where the change is smooth.

<div class="cai" id="cai-why"><h4>Three ways to read the energy source for Hunger (threshold 0.4)</h4></div>

The sigmoid also gives Black & White four more good things:

1. **Every source has the same size.** A drive ranges from 0 to 1. A desire will be affected by all its drives, and
   because those drives are all the same size, a huge value cannot hide the other sources. Effectively normalising the
   sources from various areas of the game.
2. **The threshold can be changed via player input.** When you slap or stroke the creature, the game moves the
    threshold and the curve moves left or right, but its overall shape stays the same.
3. **It comes from neural networks.** The AI designer, Richard Evans, described each desire as a **perceptron**
   (AI Game Programming Wisdom (2002)). Without going into too much detail, a perceptron is the simplest artificial
   brain cell. It basically adds its inputs and puts the total through a sigmoid function. The creature's desires work
   in almost the same way. Marketing win!
4. **It is cheap.** The game reads one number from a table. It does no other calculation, and PCs were slow (Black
   & White had some very aggressive optimisations to get performance somewhere playable).

The game makes its curve very steep, so it's practically a switch, with only a short soft zone. Designers can easily
understand a switch like this so logic can be explained like so "the creature gets hungry at 40% energy".
The soft zone simply stops the rapid fast on/off changes.

If we take a source value, apply the sigmoid curve to that value, we get a **drive**. Each desire can have many drives.

One interesting thing to note, the same source can have different drives, and drives can be shared between desires. For
example, the Night source, which tells the creature how dark it is, is used to drive both Tiredness and Fear. The drives
differ slightly due to different thresholds which are covered in Part 3.

## From drive to desire

In each turn, the game adds all the drives of a desire then it divides the total by the desire's **growth time**.
The growth time in the table below tells us how fast the desires can grow in-game:

| Desire | Maximum | Growth time | Main sources |
|---|---|---|---|
| Hunger | 2.0 | 20 seconds | low energy |
| Tiredness | 2.0 | 2 seconds | exhaustion, night |
| Fear | 0.92 | 1 second | dark, damage, magic |
| Compassion | 0.8 | 5 seconds | four sources |
| Anger | 0.8 | 5 seconds | three sources |

With a full drive, Hunger goes up by 1 in 20 seconds. Fear goes up by 1 in 1 second. That is why a creature becomes
afraid very quickly, but its hunger grows slowly.

Try it below in the mini demo I've put together. Make the energy low, and Hunger grows. Make it night, and Fear and
Tiredness grow. The strongest desire will display as green. If you click "Eat a meal", you will see Hunger fall.

<div class="cai" id="cai-desires"><h4>Try it: desire bars</h4>
<p class="cai-note">This demo I've put together uses the game's real data; the thresholds, growth
times, and maximums (The fade speed when no source pushes is just for this demo).</p></div>

## When a desire is satisfied

So now we know what a desire is but how is it satisfied?

A desire only goes down when the creature finishes a plan for it, desires never lose value except through a plan. Every
creature action in the game has a factor, and when the creature finishes a meal, Hunger is multiplied by 0.3. So a
Hunger of 1.0 becomes 0.3.

Even with the above factors, some of the creature's desires have special rules applied to them:

* After the creature poos, the desire to poo stops for 60 seconds.
* After the creature sleeps, Tiredness becomes a little less than its currently weakest desire.
* After the creature tries to get your attention, that specific desire stops for 60 seconds.

## Opposite feelings

Finally, some creature desires block other desires. When the creature decides to help someone (Compassion desire),
its Anger stops for about 3.4 minutes. When it decides to attack (Anger), its Compassion stops for about 3.7 minutes.
The leashes can also affect desires in interesting ways (the leash is a in-game tool to control the creature's actions).

This makes the creature's mood stable. A creature that is kind now does not suddenly become cruel one second later.

## Summary

* The creature is basically an agent. It has beliefs, desires, and plans.
* It roughly follows BDI.
* It has 40 desires. Each desire is one number.
* The growth time for each desire sets how fast that desire grows.
* 61 sources push the desires up. Each source has a threshold.
* The steep sigmoid applied to sources turns "how far over the threshold" a source is into a drive from 0 to 1.
* A creature's desire falls when the creature completes the desire's plan.

Now the creature wants things due to Desires. But how does it choose what to do?
[Part 2]({% post_url 2026-10-27-creature-mind-part-2 %}) will go over this exact aspect of the creature's logic.
