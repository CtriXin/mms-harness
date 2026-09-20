import { clientBundle } from '../tsdown.client.ts'

// hostPhase: the node half owns a Remote namespace (`mmsProjects`), so its
// typert faces must be generated alongside the client bundle.
export default clientBundle('@deepseek-ai/dsh-client-ui-mms', ['lib/types/index.js'], { hostPhase: true })
