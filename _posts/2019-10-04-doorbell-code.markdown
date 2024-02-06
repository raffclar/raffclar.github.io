---
layout: single
classes: wide
title:  "Doorbell receiver source code"
date:   2019-10-04 11:00:00 +0100
categories: doorbell c
---

This wasn't possible without [rtl-sdr](https://osmocom.org/projects/rtl-sdr/wiki/Rtl-sdr)  

SDR is a NESDR SMArTee v2 (RTL2832U, R820T2)

I wrote this to test out the library, to capture signals to a file and to see how easy it is to write code using my SDR device.

```c
#include <stdlib.h>
#include <stdio.h>
#include <errno.h>
#include <getopt.h>
#include <unistd.h>
#include <string.h>
#include <assert.h>
#include <complex.h>
#include <math.h>
#include <stdbool.h>
#include <inttypes.h>
#include <sys/time.h>
#include <limits.h>

#include "rtl-sdr.h"

rtlsdr_dev_t *device;
FILE *record_file;

#define SAMPLE_RATE 250000
#define FREQUENCY 433920000
#define USE_RAW_DATA_FILE 0

typedef enum {
    short_pulse,
    short_gap,
    sync_gap,
    long_pulse,
    long_gap
} ook_modulation;

const uint32_t short_width = 360;
const uint32_t long_width = 1070;
const uint32_t gap_limit = 1200;

int get_sample_file(uint8_t *buffer, int buffer_length) {
    int len;
    len = fread(buffer, sizeof(uint8_t), buffer_length, record_file);
    return len == buffer_length;
}

int get_samples_rtl_sdr(uint8_t *buffer, int buffer_length) {
    int length;
    //length = fread(buffer, sizeof(uint8_t), buffer_length, record_file);
    rtlsdr_read_sync(device, buffer, buffer_length, &length);
    return length == buffer_length;
}

int32_t remove_dc_bias(int32_t sample, double weight, int32_t *previous_average) {
    *previous_average = (int32_t) round(weight * sample + (1 - weight) * *previous_average);
    return sample - *previous_average;
}

int32_t get_envelope(int32_t sample, double weight, int32_t previous_average) {
    return (int32_t) round(weight * sample + (1 - weight) * previous_average);
}

int32_t is_pulse(uint32_t envelope, uint32_t threshold) {
    if (envelope > threshold) {
        return true;
    }

    return false;
}

int main() {
    if (1) {
	printf("Using file.\n");
        record_file = fopen("good_sample_3", "r");

        if (!record_file) {
            return 3;
        }
    } else {
        if (!rtlsdr_get_device_count()) {
            return 1;
        }

        if (rtlsdr_open(&device, 0) != false) {
            return 2;
        }

        // Disable automatic gain control on the RTL2832U chip
	    printf("Setting AGC mode.\n");
        rtlsdr_set_agc_mode(device, 0);
        // Auto gain
	    printf("Setting gain mode.\n");
        rtlsdr_set_tuner_gain_mode(device, 0);
	
	    printf("Setting frequency and sample rate.\n");
        rtlsdr_set_center_freq(device, FREQUENCY);
        rtlsdr_set_sample_rate(device, SAMPLE_RATE);
	
	    printf("Flushing buffer.\n");
        // Flush the device buffer
        rtlsdr_reset_buffer(device);
    }

    size_t buffer_length = 2048;
    uint8_t *buffer = malloc(2048);

    // Signal is as follows:
    // |¯|________|¯¯|__|¯|_|¯|_|¯¯|_|¯¯|_|¯¯|_|¯¯|_|¯¯|__|¯|_|¯|_|¯¯|__|¯|__|¯|__|¯|_|¯¯|_|¯¯|_|¯¯|_|¯¯|
    ook_modulation protocol[] = {
            short_pulse,
            sync_gap,
            long_pulse,
            long_gap,
            short_pulse,
            long_gap,
            short_pulse,
            short_gap,
            long_pulse,
            short_gap,
            long_pulse,
            short_gap,
            long_pulse,
            short_gap,
            long_pulse,
            short_gap,
            long_pulse,
            long_gap,
            short_pulse,
            long_gap,
            short_pulse,
            short_gap,
            long_pulse,
            long_gap,
            short_pulse,
            long_gap,
            short_pulse,
            long_gap,
            short_pulse,
            short_gap,
            long_pulse,
            short_gap,
            long_pulse,
            short_gap,
            long_pulse,
            short_gap,
            long_pulse
    };

    int protocol_index = 0;
    int protocol_length = 37;

    if (get_sample_file(buffer, buffer_length) == false) {
        return 5;
    }

    int32_t dc_avg = buffer[0];
    int32_t env_avg = buffer[0];
    int start = 1;

    // Keep track of the duration of the current protocol step; pulse or the absence of a pulse
    uint32_t duration  = 0;
    // We will allow this amount of variance in the envelope signal when stepping through a pulse
    uint32_t tolerance = 0;
    // Threshold
    uint32_t threshold = 50;

    printf("Loop begin.\n");
    FILE *test = fopen("test", "w+");

    do {
        if (protocol_index + 1 == protocol_length) {
            fprintf(stdout, "OOK protocol match.\n");
            protocol_index = 0;
            tolerance = 0;
        }

        for (int i = start; i < buffer_length; i++) {
            int32_t sample = buffer[i];
            int32_t dc_sample = abs(remove_dc_bias(sample, 0.03, &dc_avg));
            env_avg = abs(get_envelope(dc_sample, 0.10, env_avg));
            uint8_t v = (uint8_t) env_avg;

            ook_modulation part = protocol[protocol_index];
    	    fwrite(&sample, sizeof(v), 1, test);

            switch (part) {
                case short_pulse: {
                    if (is_pulse(env_avg, threshold - tolerance)) {
                        tolerance = 10;
                        duration++;
                    } else {
                        if (duration > 130) {
                            protocol_index++;
                        } else {
                            protocol_index = 0;
                        }

                        tolerance = 0;
                        duration = 0;
                    }
                    break;
                }
                case short_gap: {
                    if (!is_pulse(env_avg, threshold - tolerance)) {
                        duration++;
                    } else {
                        if (duration > 130) {
                            protocol_index++;
                        } else {
                            protocol_index = 0;
                        }

                        tolerance = 0;
                        duration = 0;
                    }

                    break;
                }
                case long_pulse: {
                    if (is_pulse(env_avg, threshold - tolerance)) {
                        tolerance = 10;
                        duration++;
                    } else {
                        if (duration > 270) {
                            protocol_index++;
                        } else {
                            protocol_index = 0;
                        }

                        tolerance = 0;
                        duration = 0;
                    }

                    break;
                }
                case sync_gap: {
                    if (!is_pulse(env_avg, threshold - tolerance)) {
                        duration++;
                    } else {
                        if (duration > 2850) {
                            protocol_index++;
                        } else {
                            protocol_index = 0;
                        }

                        tolerance = 0;
                        duration = 0;
                    }

                    break;
                }
                case long_gap: {
                    if (!is_pulse(env_avg, threshold - tolerance)) {
                        duration++;
                    } else {
                        if (duration > 270) {
                            protocol_index++;
                        } else {
                            protocol_index = 0;
                        }

                        tolerance = 0;
                        duration = 0;
                    }

                    break;
                }
                default: {
                    printf("Finished reading file!\n");
                    exit(1);
                }
            }
        }

        start = 0;
    } while (get_samples_rtl_sdr(buffer, buffer_length) == true);

    return 0;
}
```
