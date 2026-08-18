/**
 * The subset of the dnd5e NPC system data that this module reads
 */
interface Dnd5eNpcSystemData {
    details?: {
        type?: {
            value?: string;
            subtype?: string;
            custom?: string;
        };
    };
}

/**
 * Retrieves the dnd5e system data for an actor
 *
 * @param actor - The actor to get the system data from
 * @returns The system data, typed to the parts this module reads
 */
function getDnd5eSystemData(actor: Actor): Dnd5eNpcSystemData {
    return actor.system as Dnd5eNpcSystemData;
}

export { getDnd5eSystemData };
export type { Dnd5eNpcSystemData };
