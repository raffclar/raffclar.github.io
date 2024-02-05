---
layout: single
classes: wide
title:  "Black & White audio explained"
date:   2021-01-03 02:00:00 +0100
categories: cpp games 
---

# Summary
Sound in black & white 1 is bit of mess. The game's music and dialogue was considered too large for hard-drives back then so they decided to use various techniques to reduce the amount of MBs taken up. These techniques worked and they were able to ship the game.

## Music
* Compressed as MP2
* Stored on the game CD
* Split up into "sectors". This is for performance reasons. Reading an entire song from the CD and decoding it would have taken a couple of seconds
* Always stereo
* Sailor's song on Land 1 is treated as music

## Dialogue
* More than 90% of the dialogue is compressed as MP2 however there are a few that are raw
* Stored in the game directory
* Always mono for 3D and to save space

## FX
* More than 90% is uncompressed. A couple of FX sounds are compressed, namely the logo sound (which is also stereo) and the volcano ambience on the last campaign island.
* Compression is either MP2 or MS-ADPCM (Microsoft's Adaptive Delta Pulse Code Modulation)
* For MS-ADPCM it's worth looking into doing this ourselves as it's not too hard to decode ADPCM into PCM.
* 3D sounds have to be in mono which is why more than 99% of FX are in mono. Exclusions include looped ambience which are stereo (and heard from all directions)

## Sound variants found so far

| sound type      | sound format          | container | layout        | channels | sample rate | bit rate | possible ffmpeg alternative                    | license       |
|-----------------|-----------------------|-----------|---------------|----------|-------------|----------|------------------------------------------------|---------------|
| Music           | MPEG-1 Audio Layer II | mpg       | stereo        | 2        |             |          | [mpg123](https://en.wikipedia.org/wiki/Mpg123) | LGPLv2.1      |
| Dialogue        | MPEG-1 Audio Layer II | wav       | mono          | 1        | 22050       | 64       | [mpg123](https://en.wikipedia.org/wiki/Mpg123) | LGPLv2.1      |
| Dialogue        | PCM 16-bit            | wav       | mono          | 1        | 22050       | 43Ko/s   | [dr_wav](https://mackron.github.io/dr_wav)     | Public domain |
| FX              | PCM 16-bit            | wav       | mono          | 1        | 22050       | 43Ko/s   | [dr_wav](https://mackron.github.io/dr_wav)     | Public domain |
| FX              | MPEG-1 Audio Layer II | wav       | mono/stereo   | 1/2      | 22050       | 64       | [mpg123](https://en.wikipedia.org/wiki/Mpg123) | LGPLv2.1      |
| FX looped atmos | PCM 16-bit            | wav       | stereo        | 2        | 22050       | 86Ko/s   | [dr_wav](https://mackron.github.io/dr_wav)     | Public domain | 
| FX              | ADPCM 4-bit           | wav       | mono          | 1        | 22050       | 86Ko/s   | None that I could find                         |               | 

## Sounds pulled from the game
1. [dialog_pcm_mono](/assets/b_and_w/sounds/dialogue_pcm_mono_HELP_TEXT_TUTORIAL_LAND_26.wav)
2. [dialog_mp2_mono](/assets/b_and_w/sounds/dialogue_mp2_mono_HELP_TEXT_CITADEL_GUIDE_03.wav)
3. [fx_pcm_mono](/assets/b_and_w/sounds/fx_pcm_mono_wind01.wav)
4. [fx_pcm_stereo](/assets/b_and_w/sounds/fx_pcm_stereo_jungleloop4.wav)
5. [fx_mp2_mono](/assets/b_and_w/sounds/fx_mp2_mono_G_Volcano_02.wav)
6. [fx_mp2_stereo](/assets/b_and_w/sounds/fx_mp2_stereo_Logo.wav)
7. [fx_adpcm_mono](/assets/b_and_w/sounds/fx_msadpcm_mono_S_FireworkExplosion_01.wav)


Further reading:
1. [MS-ADPCM explained](https://wiki.multimedia.cx/index.php/Microsoft_ADPCM)
2. [dr_wav library](https://github.com/mackron/dr_libs/blob/master/dr_wav.h)
3. [mpg123 library](https://www.mpg123.de/)
4. [vcpkg supports mpg123](https://github.com/microsoft/vcpkg/tree/master/ports/mpg123)

