#include <stdio.h>
/* Amber callables and dusty pink constants. */
typedef struct { const char *name; int glow; } Horizon;
int main(void) {
    const Horizon sky = { "Afterglow", 84 };
    printf("%s: %d\n", sky.name, sky.glow);
    return 0;
}
