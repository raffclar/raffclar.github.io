---
layout: single
classes: wide
title:  "Triangular Arrays"
date:   2018-10-03 02:37:18 +0100
categories: cpp algo 
---
An implementation of a triangular array (indexing method) in C.

```c
#include <stdio.h>
#include <inttypes.h>
#include <stdlib.h>
#include <assert.h>

size_t ang_size(size_t size) {
    return size * (size + 1) / 2;
}

void *ang_malloc(size_t type_size_bytes, size_t size) {
    return calloc(size, type_size_bytes);
}

size_t ang_index(size_t sz, intmax_t x, intmax_t y) {
    intmax_t i = (x < y) ? x : y;
    size_t j = (size_t) imaxabs(x - y) + (sz * i) - ((i * (i - 1)) / 2);
    return j;
}

int main(int argc, char *argv[]) {
    size_t triangle_size = 10000;
    printf("Triangle index size: %zu\n", triangle_size);
    size_t malloc_size = ang_size(triangle_size);
    printf("Memory index size: %zu\n", malloc_size);

    uint32_t *first_array = ang_malloc(sizeof(uint32_t), malloc_size);

    for (int x = 0; x < triangle_size; x++) {
            size_t i = ang_index(triangle_size, x, (triangle_size - x) - 1);
            first_array[i] = (uint32_t) abs(x) + 1;
    }

    size_t matches = 0;

    for (int x = 0; x < triangle_size; x++) {
        size_t i1 = ang_index(triangle_size, (triangle_size - x) - 1, x);
        size_t i2 = ang_index(triangle_size, x, (triangle_size - x) - 1);

        uint32_t val1 = first_array[i1];
        uint32_t val2 = first_array[i2];

        if (val1 == val2 && val1 != 0 && val2 != 0) {
            matches++;
        }
    }

    assert(matches == triangle_size);
    free(first_array);

    return 0;
}
```

Useful for commutative relationships e.g bidirectional node graphs
