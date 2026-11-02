import type { Content, Region, Role, Sentence, SentenceContext, Stage, Word } from './types';
import regions from './regions.json';
import stages from './stages.json';
import words from './words.json';
import sentences from './sentences.json';
import roles from './roles.json';
import contexts from './contexts.json';

/** Gesamter Inhalt. JSON-Imports sind nur strukturell typisiert; die Form sichert tests/content.test.ts ab. */
export const content: Content = {
  regions: regions as Region[],
  stages: stages as Stage[],
  words: words as Word[],
  sentences: sentences as Sentence[],
  roles: roles as Role[],
  contexts: contexts as SentenceContext[],
};

export const audioUrl = (id: string) => `${import.meta.env.BASE_URL}audio/${id}.mp3`;
