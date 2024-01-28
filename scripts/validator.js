import log from './logger.js';
import Settings from './settings.js';

/**
 * Ensures a token is a valid candidate for converting to loot or generating currency
 */
export default class Validator {
  constructor() {
    this._settings = new Settings();
  }

  /**
   * Checks if the provided token can have currency generated for it.
   *
   * @param {Actor5e} tokenDocument - the token to check
   * @returns {boolean} true if it can have currency genereated for it
   */
  shouldAutoGenerateCurrency(tokenDocument) {
    if (!tokenDocument) return false;

    if (!this._settings.enabled) {
      log("Refuse to generate treasure because you don't want me to");
      return false;
    }

    if (this._isPercentageLower()) {
      log(
        'Refuse to generate treasure because it did not pass the percent threshold'
      );
      return false;
    }

    if (this._isLootSheetNpc5e(tokenDocument)) {
      log('Refuse to generate treasure for existing loot sheets');
      return false;
    }

    if (tokenDocument.isLinked) {
      log('Refuse to generate treasure for linked characters');
      return false;
    }

    if (!this._isActorNpc(tokenDocument)) {
      log('Refuse to generate treasure for non-npc actors');
      return false;
    }

    if (!this._isMatchingType(tokenDocument)) {
      log('Refuse to generate treasure for non-matching type');
      return false;
    }

    if (tokenDocument.actor.hasPlayerOwner) {
      log('Refuse to generate treasure for player owned actors');
      return false;
    }

    if (!this._isGm()) {
      log('Refuse to generate treasure on the behest of mere players');
      return false;
    }

    return true;
  }

  _isPercentageLower() {
    return Math.random() < this._settings.chanceOfNoCurrency;
  }

  _isLootSheetNpc5e(tokenDocument) {
    return tokenDocument.actor.sheet.template.includes('lootsheetnpc5e');
  }

  _isActorNpc(tokenDocument) {
    return tokenDocument.actor.type == 'npc';
  }

  _isMatchingType(tokenDocument) {
    const actor = tokenDocument.actor;

    const creatureTypes = this._settings.creatureTypes;

    // Handle blank creature types by always saying they are valid
    if (creatureTypes.length === 0) return true;

    let actorType = this._getActorType(actor);
    let actorSubtype = this._getActorSubtype(actor);

    if (actorType === 'custom') {
      actorType = actor.system.details?.type?.custom?.toLowerCase().trim();
    }

    return creatureTypes.some(
      (type) => actorType?.startsWith(type) || actorSubtype?.startsWith(type)
    );
  }

  _getActorType(actor) {
    return actor.system.details?.type?.value?.toLowerCase().trim();
  }

  _getActorSubtype(actor) {
    return actor.system.details?.type?.subtype?.toLowerCase().trim();
  }

  _isGm() {
    return game.user.isGM;
  }
}
