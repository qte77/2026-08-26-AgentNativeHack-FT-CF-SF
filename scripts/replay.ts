// `npm run replay` / `make replay` - reproduces the committed sample episode
// deterministically offline, no live API calls. This is the offline half of
// the "it runs" gate; /trigger on the deployed Worker is the live half.
import { renderEpisode } from "../src/checkpoint";
import sample from "../checkpoints/sample-episode.json";
import type { Episode } from "../src/types";

console.log(renderEpisode(sample as Episode));
