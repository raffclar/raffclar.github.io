---
layout: single
title:  "Black & White: Inside the creature's mind, part 3 how it learns"
date:   2026-10-27 09:20:00 +0000
categories: ai games black-and-white
---
<link rel="stylesheet" href="/assets/creature_ai/creature-ai.css">
<script src="/assets/creature_ai/creature-ai.js" defer></script>
# Player reward and punish system, decision trees, and copying

This is part 3 of a series about the creature AI in Black & White (2001).

* [Part 1: how it feels]({% post_url 2026-10-27-creature-mind-part-1 %}). Desires, and the curve that drives them.
* [Part 2: how it chooses]({% post_url 2026-10-27-creature-mind-part-2 %}). Plans, and how it picks one.
* **Part 3: how it learns.** Slaps, strokes, decision trees, and copying.

The creature learns in two ways. It learns from your in-game hand, when you slap or stroke it. And it learns when it
watches you or the villagers interact with the world.

## Your hand

When you hold the creature with the action button, the game enters the creature reward and punish system. It keeps a
**running total** from −1 to +1.

* **A stroke** adds 0.1.
* **A slap** removes value. A gentle slap takes away 0.1. A hard slap takes away 0.2. If the total is above 0.25, a slap
  takes away twice as much.

When you let go, the total goes to the creature as one lesson. A lesson smaller than 0.5 counts as 0.5. So one gentle
stroke teaches as much as five strokes. What does change is how much the creature feels about you, the more strokes,
the more the creature likes you.

<div class="cai" id="cai-hand"><h4>Try it: the hand's running total</h4></div>

<figure class="cai-fig">
<img src="/assets/creature_ai/stroke.png" alt="The god's hand strokes a cow creature. The Reward bar at the left shows Good Boy! 10%.">
<figcaption>A cow creature after one stroke. The Reward bar shows the stroke's 0.1 as 10%.</figcaption>
</figure>

<figure class="cai-fig">
<img src="/assets/creature_ai/p3-slap-cow.jpg" alt="A cow creature reels back from a slap. The Reward bar at the left shows Bad Boy 70%.">
<figcaption>A cow creature after a slap. The Reward bar shows the slap's strength.</figcaption>
</figure>

Finally, the game has creature development phases; a very young creature does not learn from your hand. Before it
reaches phase 2, a slap or a stroke changes only some of its feelings. The development phases line up with the
creature tutorial on the first level.

## Which plan gets the lesson?

Your slap comes some time after the bad thing. Let's imagine the creature ate a villager, and then threw a rock at
another. Which plan does the slap teach about?

The creature remembers its last five plans. Each plan gets a score:

* A plan that is still active gets the full score, 1.0.
* A plan that ended gets less. The score goes down to zero over a time that is set for each action. For eating, the time
  is 20 seconds. For a fight, it is 30 seconds. For throwing something, it is only 5 seconds.

The plan with the highest score gets the lesson. If no plan has a score, the creature learns nothing. Only its opinion
of you changes (like, dislike).

<div class="cai" id="cai-credit"><h4>Try it: which plan gets the lesson</h4>
<p class="cai-note">In this example, the creature ate a villager. Three seconds later, it threw a rock.</p></div>

This is a real problem in AI. It is called **credit assignment**: which earlier choice caused this reward? The game uses
a short memory and a timer for each action. It is simple, but it honestly works well when you slap the creature soon
after it does something.

## Four lessons from one slap

Each slap or stroke teaches four things:

1. **The desire.** Does the creature want this thing more, or less?
2. **The target.** For social desires: who to be kind to, or angry with.
3. **The object.** What to eat, what to throw.
4. **The action.** Was this a good way to do it?

### Lesson 1: the desire

A stroke makes the desire stronger. It grows faster. Its threshold goes down, so it starts sooner. Its maximum goes up a
little. A slap does the opposite.

An example: you slap the creature while it eats. Its Hunger growth time changes from 20 seconds to 25 seconds. The
energy threshold changes from 0.40 to 0.46. So the creature gets hungry later and more slowly.

Each desire has a different sensitivity. Hunger changes a lot. Compassion and Anger change their growth time by less
than 1%. For them, the threshold change is the important part.

### Lessons 2 and 3: decision trees

This part of the creature AI is probably the most interesting from an AI point. These two lessons (stroke, slap) affect
the **decision trees** of which there are many. The best way to describe the personality and memory of a creature is by
looking at its decision trees. So let's dig in.

<div class="cai-box def"><strong>Decision tree</strong>
A decision tree is a list of questions in the shape of a tree. You start at the top. You answer a question. The answer
tells you which branch to follow. At the end of a branch, there is a result. A game of "twenty questions" is a decision
tree and the creature's decision trees follow the same concept.</div>

The creature has two trees for each desire: 80 trees in total. Each tree answers one question: "Is this object good for
this desire?". There are two trees per desire, the **Activity** tree and the **ActOn** tree.

* **Activity** is the tree that tells us what a desire is about.
* **ActOn** is the tree that judges what the creature acts on: the food it eats, or the villager it throws.

After a few lessons: say you slap it each time it turns on your village, and stroke it when it attacks a rival god's
village. Its Anger Activity tree learns to ask "whose town is it?":
- Mine: bad, so my towns score near 0 as targets of the Anger desire.
- Another god's: good, so enemy towns score up to 0.125.

Let me give another example for the ActOn tree: you slap the creature after it eats a villager while trying to meet its
Hunger desire, and stroke it after it eats a sheep. Its Hunger ActOn tree learns to ask "is it a villager?":
- Yes: the verdict is bad, so villagers score near.
- No: the verdict is good, so sheep score up to 0.125.

The questions themselves come from the creature's **beliefs**. A belief is what the creature knows about one object.
For example:

* Is it mine?
* Is it alive?
* What kind of thing is it: a villager, an animal, a storage pit?
* For a villager: which tribe? Man or woman?

The creature does not get these trees from the designers. It builds them from **examples** and each lesson makes one
example: "this object, with these answers, got this lesson". Technically, as a player teaches its creature, it's
creating training data.

### How the creature builds a tree

The creature must choose the first question. It chooses the question that separates the good examples from the bad
examples best.

To measure "best", it uses **entropy**.

<div class="cai-box def"><strong>Entropy</strong>
Entropy measures how mixed a group is. A group with only good examples has an entropy of 0: it is not mixed.
A group with half good and half bad examples has high entropy: it is very mixed. A good question splits one mixed group
into groups that are not mixed.</div>

The game's entropy looks at two things. Two thirds of it is "good or bad". One third is "how good" or "how bad".
A question with many answers gets a penalty. Without the penalty, a question like "what kind of thing is it?" wins too
often, because it makes many small groups.

This method has a name. It is **ID3**, an algorithm that Ross Quinlan published in 1986. ID3 always asks
with the highest "information gain": the largest drop in entropy. The penalty for many answers comes from C4.5,
Quinlan's next version of ID3. C4.5 divides the gain by how many ways the question splits the examples. This is called
the "gain ratio". Black & White adds two changes of its own: the two-part entropy above, and no penalty at all
for a question with only two answers. It does not use the other parts of C4.5, such as cutting back a tree that has
grown too big.

The creature asks the best question first. Then, for each answer, it does the same again with the examples that remain.
It stops when a group is not mixed, or when it has no more questions to ask.

The creature makes the full tree again after each new example. Each tree has room for 16 examples. The first 15
lessons fill 15 places, and they never change after that (we've checked). The 16th place holds only the latest
lesson: each new lesson replaces the one that was there before.

So after 16 lessons, the tree learns from the first 15 lessons and your most recent one. Lesson 17 removes lesson 16,
lesson 18 removes lesson 17, and so on. **The first lessons stay forever**, and a new lesson only lasts until the next
one. This counts lessons for each tree, not the creature's age: a tree that you have taught little still has room.
So teach each desire well the first time, because those early lessons are the ones that the creature keeps.

Those early lessons matter a lot.

Try it. Choose a food, then slap or stroke. Watch the tree grow. The tree uses the game's own method. The answers for
each object are our examples.

<div class="cai" id="cai-tree"><h4>Try it: teach the Hunger tree</h4></div>

Try this: slap once after the creature eats from the storage pit. The tree has only one example, so it has no question.
It says "bad" for all food. The creature has learnt "eating is bad", not "the storage pit is bad". Now stroke it for
eating a wolf. The tree must now separate the two examples, so it asks a question.

The number of examples that can exist is quite high given there's forty desires and two trees per desire with a minimum
of fifteen examples per tree. That comes to around 1200 potential examples. Note that many examples exist by default
when creating a new creature without the player giving lessons.

It's a simple but interesting system that behaves well in-game and gives a degree of freedom and allows for
emergent behaviour that at times can be surprising. There will be a lot of effort put into ensuring openblack and the
decomp match the game's original decision trees.

### Lesson 4: the action

The creature's opinion of the action moves 80% of the way to your lesson. Let's say the opinion of
"eat from the storage pit" is 0. After one slap of −0.5, it becomes −0.4. From part 2, you know that this changes the
action score only a little, but with the novelty bonus, it is enough to make the creature choose a different action next
time.

### Punishment is stronger than reward

The tree gives a verdict from −1 (bad) to +1 (good). The creature changes that into an object score for part 2. Look
at the shape:

<div class="cai" id="cai-useful"><h4>From verdict to object score</h4></div>

An object that the creature does not know scores 0.100. A good object can go up to 0.125. That is only 25% more. A bad
object can go down to 0. One slap takes the score down to 0.040. That is 60% less instantly from one slap.

So a slap teaches more than a stroke. Players often noticed and spoke about this on the forums

## After the lesson

After a **slap**, the desire becomes the weakest desire. The creature stops, and it does something different.

After a **stroke**, the creature does the same thing again, with the nearest object of the same type. You stroke it for
eating a sheep, so it eats another sheep.

There is one special case we noticed in the decompilation. If you stroke the creature while it holds food, it eats the
food at once. It learns "eat this" with the strongest lesson.

<figure class="cai-fig">
<img src="/assets/creature_ai/p3-held-food.jpg" alt="The god's hand holds food above a tiger creature in a walled pen.">
<figcaption>The first lesson in the game: give the creature food, then stroke it.</figcaption>
</figure>

Each slap and stroke also changes how the creature feels about **you**. A creature that you slap a lot does not like
you. It can even start to run away from you.

## Learning by watching

The creature also learns when it watches. This is a different system from the trees and is more rigid.
There are three parts to it.

**Skills.** Villagers build, fish, farm, and dance. The creature watches. After some seconds, it can do the same. 
It must watch a villager build for 7 seconds. It must watch a villager fish or dance for 6 seconds.

**Miracles.** The creature counts each miracle that it sees. If it is on the learning leash, each miracle counts three
times. Each kind of creature needs a different number of sightings. The game multiplies the number for each miracle by
a value for the species:

<div class="cai" id="cai-miracle"><h4>Sightings needed, for each species (a shorter bar learns faster)</h4></div>

The Ape learns miracles fastest. The Tiger needs about four times as many sightings as the Ape. The Chimp, the Lion, and
the Tortoise also learn fast.

The creature tries a miracle when it has half the sightings that it needs. Until it has enough sightings, the miracle
fails. But each failure counts as one more sighting. So the creature learns by trying too!

**Copying you.** When you are near the creature with the learning leash, it can copy what you do. If you throw a rock,
it can throw a rock. Then it can also take on the desire behind your action.

(Note: leashes in the game influence the creature's behaviour; there are three leashes, compassion, learning,
aggression)

<figure class="cai-fig">
<img src="/assets/creature_ai/p3-copies-sacrifice.jpg" alt="A tiger creature stands near a village altar. A red glow shows a miracle.">
<figcaption>The creature copies a deed that it saw: a sacrifice at the village altar.</figcaption>
</figure>

## Born different: the kind of creature affects the very beginning

At the start of the game, you choose your creature: an ape, a cow, a tiger, or another animal. This choice changes more
than its look. Each species has an inborn **character**. There are quite a few species in the game to choose from.

The game gives each species five character values, called **traits**. Each trait is a number from 0 to 1. Each
trait pushes one desire, all the time:

* **Kindness** pushes Compassion.
* **Friendliness** pushes the desire to be friends.
* **Communicativeness** pushes the desire to show its feelings.
* **Lethargy** pushes Tiredness.
* **Aggression** should push Anger. But in the game, this link is not connected. We found no part of the game that uses
  aggression.

The traits do not change the maximum of a desire. They change how soon a desire builds up by itself. Remember the steep
sigmoid from part 1. All traits are below the threshold, so their drives are small. But a small change in the trait
makes a large change in the drive. With only its trait to push it, a cow's Compassion is full in about half an hour.
A tiger's Compassion needs more than an in-game day.

Some examples:

* **The Cow** is kind and friendly. It wants to make friends after about 13 minutes.
* **The Tiger** and **the Wolf** are the least kind. They seldom feel compassion by themselves.
* **The Ape** shows its feelings very often. That desire is full after about 4 minutes. For most other species, it
  takes more than an in-game day.
* **Lethargy** has almost no effect. Its threshold is very high.

Each new creature is also a little different from others of its species. At birth, the game adds a small random change
to each trait, up to 0.1 either way. The kindest tiger can be as kind as the least kind cow. This randomisation makes
each creature unique even if they are of the same species!

Choose a species. Then click "A new creature is born" to see how much one creature can be different from another.

<div class="cai" id="cai-species"><h4>Try it: the character of each species</h4>
<p class="cai-note">The times use the game's real traits, thresholds, growth times, and maximums. They show the trait alone. In a real game, other sources push these desires too.</p></div>

The trait is only the start. Your lessons change the desire's threshold, as you saw above. So you can teach a tiger to
be kind. It only starts further away so it requires more time and effort.

The species also changes the body. A lion is strong, and a tortoise is weak and slow. A chimp gets more energy from a
meal. A tortoise takes the longest to grow up. The ape and the big cats like warm places, and many other species,
such as the polar bear, like the colder areas of the in-game maps (there's biomes with snow).

## Development phases

The creature does not learn everything at the start. It goes through 14 development phases, numbered 0 to 13. These
are not stages of growth rather each phase is a step of the creature tutorial, such as "Punishment", "Meet guide" or
"Impress town". The story of the game moves the creature from phase to phase. Each phase turns on new parts of the
mind:

* At phase 0, the creature is new. It has only ten desires out of the 40.
* At phase 1, the creature learns to take food and eat. It moves quickly from this to phase 2.
* At phase 2, lessons from your hand start to work.
* At phase 3, the creature can copy you.
* At phase 5, it can leave its pen.
* At phase 8, it can learn miracles.

Each phase also turns on new desires. A young creature does not want to impress a town. It has not learnt about towns
yet. The phases move very quickly as they're linked to the game's tutorial on the first level. Progressing through
phases 0 to 8 can take minutes.

Thanks to Snoonose for his help in checking these phases, and for spotting that they are development phases, not
stages of growth as I originally thought.

## The whole picture

So here is the full mind:

1. **Sources** read the body and the world.
2. A steep **sigmoid** changes each source into a drive.
3. The drives fill 40 **desires**.
4. Each desire makes a **plan**: an action, chosen by opinion and novelty, and an object, chosen by its score and
   distance. Plans are carried out using many steps called an agenda.
5. The creature changes plan only for a plan that is **twice as urgent**.
6. Your **hand** sends lessons. Each lesson changes a desire, an action opinion, and two **decision trees**.
7. The creature also learns when it **watches**.
8. Each **species** has its own inborn traits, and each creature is a little different from the others.

Overall, none of these parts are complex on their own. A sigmoid, some decision trees, desires, sources, drives, and a
few rules. But together they make a creature that exhibits novel behaviour and that players have come to love; Richard
Evan's in the book AI Programming Wisdom, calls this combination of parts, "Representational Promiscuity".

Quite an interesting system!
