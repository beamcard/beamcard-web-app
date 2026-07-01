import { afterEach, describe, expect, it } from 'vitest';
import i18n from './i18n';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('i18n', () => {
  it('translates the same key across en / de / uk', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('publicCard.saveContact')).toBe('Save contact');
    await i18n.changeLanguage('de');
    expect(i18n.t('publicCard.saveContact')).toBe('Kontakt speichern');
    await i18n.changeLanguage('uk');
    expect(i18n.t('publicCard.saveContact')).toBe('Зберегти контакт');
  });

  it('interpolates placeholders', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('editor.workplaceN', { n: 2 })).toBe('Workplace 2');
    await i18n.changeLanguage('de');
    expect(i18n.t('editor.workplaceN', { n: 2 })).toBe('Arbeitsort 2');
  });

  it('falls back to English for an unset language', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('publicCard.saveContact')).toBe('Save contact');
  });
});
