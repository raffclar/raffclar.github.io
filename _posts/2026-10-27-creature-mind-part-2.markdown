---
layout: single
title:  "Black & White: Inside the creature's mind, part 2 how it chooses"
date:   2026-10-27 09:10:00 +0000
categories: ai games black-and-white
---
<link rel="stylesheet" href="/assets/creature_ai/creature-ai.css">
<script src="/assets/creature_ai/creature-ai.js" defer></script>
# Plans, and how the creature picks one

This is part 2 of a series about the creature AI in Black & White (2001).

* [Part 1: how it feels]({% post_url 2026-10-27-creature-mind-part-1 %}). Desires, and the curve that drives them.
* **Part 2: how it chooses.**  How it acts on those Desires with Plans, and how it picks one.
* [Part 3: how it learns]({% post_url 2026-10-27-creature-mind-part-3 %}). Player reward and punish system, decision
  trees, and copying what the villagers and the player do.

In part 1, we showed how the creature got 40 desires. How each desire is a number that grows.
Now the creature must act on those desires. So what does it do? If it's hungry, what does it eat? Where?
And when does it stop eating?

<figure class="cai-fig">
<img src="/assets/creature_ai/cow.png" alt="A cow creature stands on a grass field and looks at the god's hand in front of it.">
<figcaption>A cow creature stands on a grass field and looks at the god's hand in front of it.</figcaption>
</figure>

## A plan

A **plan** has three parts:

* a **desire**, for example, Hunger;
* an **action**, for example, "eat from the storage pit";
* an **object**, for example, the storage pit in your village.

The game has 328 actions. Each desire has a short list of actions that can satisfy it. Hunger has six:

1. Eat from a container.
2. Fish, then eat.
3. Look at something, then eat it.
4. Eat something alive.
5. Eat from a food pile.
6. Eat from a storage pit.

Each desire keeps its own plan. In each turn, the creature makes new plans for two desires. When there are three
creatures or more, it makes one plan each turn. This keeps the game fast in multiplayer and skirmish matches but does
drop the quality of the planner and the AI overall.

<div class="cai" id="cai-pipeline"><h4>How a plan is made</h4></div>

Not all actions are available for a new creature. Some actions are innate while others are learned.

## Step 1: choose an action

The creature gives each action a score. The score has two parts.

**Opinion.** The creature has an opinion about each action. You change this opinion when you slap or stroke it (part 3).
  The opinion gives a score from 0.500 to 0.505.

**Novelty.** Novelty means "something new". An action that the creature did not do for some time gets a bonus of up to
  0.010. The bonus is full after about 9 seconds. After the creature does the action, the bonus goes back to zero.

Let's look at those numbers closer:

The novelty bonus (0.010) is larger than the full range of the opinion (0.005). So the creature
likes to change what it does as it will get bored. If two actions have the same score, the action that is later in the
list wins.

The creature can only use actions that it knows. A creature that cannot fish does not try to fish and must be taught.

Most desires choose the action first, then the object. Some social desires do it the other way. They choose
**who** first. Anger first chooses who to be angry with. Compassion first chooses who to help.

There are some funny and bizarre actions in the game:

* `GO_TO_HILL_AND_WALK_ALONG_RIDGE` fills the Wanderlust desire.
* `BE_PATHETIC_TO_PLAYER` action tries to get the player's attention and fill that corresponding desire.
* `MOPE_ABOUT_WITH_FRIEND`, `TELL_FRIEND_A_JOKE` and `SIT_WIH_FRIEND` are all actions that the creature can take with
  another creature.

## Step 2: choose an object

Now the creature starts looking for an object for the action. "Eat from a storage pit" needs a storage pit that has
food in it.

(Note: a storage pit is an in-game building where you can put food and wood for villagers. It's a typical resource hold
found in many strategy games)

The creature gives each object a score. The score comes from what it has learnt about objects like this one. Part 3
shows how this is done. An object that the creature knows nothing about gets 0.1.

Then the score goes down with distance. Each desire has its own distance weight. Hunger has a small weight, so a hungry
creature walks far for food. Curiosity has a large weight, so a curious creature looks at things near it but not much
further beyond.

<div class="cai" id="cai-distance"><h4>Try it: distance and two desires</h4></div>

## Step 3: priority

Now the plan needs a **priority**: a number that tells how urgent it is. In simple words:

> priority = strength of the desire × score of the object × a fixed number

Note what is not in this formula: the action score. The game limits the action part to a fixed value. So
the action choice tells the creature **which** action to use, but does not affect **how urgent** the plan is. Urgency
comes from only the desire and the object with a fixed number irrespective of action.

**An example:** a creature has a Hunger of 1.0. There is a storage pit 60 m away but the creature knows nothing
about it, so the pit scores 0.1. The distance makes that 0.0985. The priority of the plan is 0.985. That's roughly
"medium" urgency compared to other plan priorities we see. Priorities are only ever compared against each other.

## Step 4: the double rule

Okay, let's imagine the creature is already doing something. Maybe it's looking around, or maybe it's sleeping.
Should it change to the new plan?

A simple rule we could follow is "always do the most urgent plan". But this rule has a huge problem. Desires go up and
down a little all the time from various drives. When two plans are nearly equal, the creature needs to decide which one 
to do, but if it's not careful, it will change from one to the other again and again. It will start to walk to the food,
then turns to look at a tree, then turns back to the food, and so on. That looks unnatural and not very clever.

So the game uses a better rule to deal with this problem:

> The creature changes to a new plan only when the new plan is **more than twice** as urgent as the current plan.

<div class="cai-box def"><strong>Hysteresis</strong>
Engineers call this kind of rule "hysteresis". A home thermostat uses it; the heater starts at 19 degrees, but it does
not stop until 21 degrees. That gap prevents fast on and off changes.</div>

The chart shows two plans over one minute. The numbers are examples, not game data. The red line is the bar that the
other plan must beat. Each green line is a change of plan. Turn off the double rule and count the changes.

<div class="cai" id="cai-switch"><h4>Try it: the double rule</h4></div>

There is no minimum priority. A creature with nothing to do has a current priority of zero. So it accepts any new plan.

Going back to our example in Step 3: If the priority is 0.985, a new priority of 1.97 or higher will cause the creature
to change plans. There are only two other desires that can produce priorities that can exceed 1.97:
Tiredness (maximum 2.0) and Restore Health (3.0).

## Step 5: the agenda

When the creature accepts a plan, it makes an **agenda**. An agenda is a list of small steps. Each agenda can have have
up to 33 steps and the creature does one step at a time.

The longest agenda that we've found at 33 steps is the creature's reaction to new music via the in-game MP3 player
addon.

<div class="cai" id="cai-agenda"><h4>A plan in action: eat from the storage pit</h4></div>

## How a plan ends

A plan can end in three ways.

**It succeeds.** The desire goes down, as part 1 shows. The novelty bonus of the action goes to zero. So next time,
  a different action has a small advantage.

**It fails.** Maybe the food is gone. The novelty bonus also goes to zero. There is no other penalty. The creature
  tries again in the next turn, often with a different action.

**Something stops it.** A more urgent plan can take its place. As the player you can also affect the creature mid-plan,
  by either slapping the creature or stroking it. This makes the creature devise a new plan.

<figure class="cai-fig">
<img src="/assets/creature_ai/p2-tired-tiger.jpg" alt="A tiger creature stands in front of a row of glass orbs. Bars at the left show Tiredness 75% and Reward Good Boy 10%.">
<figcaption>A tired creature with Its Tiredness at 75%. It must make a plan to sleep soon before it collapses from exhaustion.</figcaption>
</figure>

## Summary

* A plan is a desire, an action, and an object.
* The creature chooses an action by opinion and novelty. Novelty makes it want to change.
* It chooses an object by what it has learnt and by distance.
* Priority comes from the desire and the object.
* It changes plan only for a plan that is more than twice as urgent (hysteresis).
* An agenda breaks the plan into small steps.

But where do the opinions and object scores come from? The creature learns them from you.
[Part 3]({% post_url 2026-10-27-creature-mind-part-3 %}) will explain how learning works.
