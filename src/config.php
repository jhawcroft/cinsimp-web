<?php

/* enable debugging?
additional debug utilities are available and error messages contain potentially
sensitive information */
$config->debug = true;

/* move the stack's base path? */
$config->stacks = $config->base . '../../stacks/';

/* apply restrictions to this installation
for sanity or public security defense? */
$config->restrictions->enabled = true;

/* can new stacks be created at all? */
$config->restrictions->can_new_stack = false;

/* maximum stack file size? (use K, M or G suffix for KB, MB, GB respectively) */
$config->restrictions->max_stack_size = '10 M';

