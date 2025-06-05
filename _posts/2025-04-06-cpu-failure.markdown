---
layout: single
classes: wide
title:  "CPU failure"
date:   2025-03-02 09:00:00 +0100
categories: hardware
---
# How my motherboard killed my CPU

My computer stopped working recently after two years of use at stock settings with no overclocking. Normally a restart with a reset of the UEFI settings fixes things but not in this particular case.
After a restart and a reset of the firmware using a motherboard switch, I was presented with a hanging POST. Thankfully my motherboard has a useful feature called "Q-CODE" which displays where it's at in the POST process. 

> Asus Q-CODE is a two-character alphanumeric diagnostic display found on many ASUS motherboards, especially mid to high-end models (like those in the ROG or TUF series). 
It shows POST (Power-On Self-Test) codes during boot to help identify the current status of the system or diagnose issues if something goes wrong.

For my particular issue it's at `00`. 
![motherboard stuck on POST](/assets/hardware/cpu_fail.png)

After a quick glance at my motherboard's manual to see what Asus's `Q_CODE 00` refers to...
![q code table](/assets/hardware/q_code_table.png)

...00 is not used. It's the code shown initially when booting. Time to search the web for clues.

A few posts on the Asus forums indicate CPU, motherboard or PSU. Experience tells me it's either the PSU or motherboard. CPU issues are rare especially after only two years of use.
At this point I'm two hours into my investigation and I've removed all the components from my PC except for the CPU, PSU and motherboard.

I decided to try one last fix before switching out the PSU. I went to Asus's support site and checked for firmware updates to apply the latest version. That's when I found out about these updates...
![bios updates on asus website](/assets/hardware/bios_updates.png)

Nice. I suspect Asus's faulty firmware had been setting the CPU SOC voltage beyond the maximum 1.3v even with EXPO (overclocking) disabled. The CPU is now dead.

After further testing and contacting support, I now have a new CPU and my PC once again works.
