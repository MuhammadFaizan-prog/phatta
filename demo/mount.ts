import { mediaHtml, SAMPLE } from './media';

type CreatePlayer = (mediaHtml: string, poster?: string) => HTMLElement;

/** Mount one skinned v10 player into #stage. */
export function mount(createSkinnedPlayer: CreatePlayer): void {
  const stage = document.getElementById('stage');
  if (!stage) throw new Error('#stage missing');
  stage.replaceChildren(createSkinnedPlayer(mediaHtml(), SAMPLE.poster));
}
