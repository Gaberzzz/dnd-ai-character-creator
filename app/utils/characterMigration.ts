import type { CharacterData } from '~/types/character';

export const migrateCharacterData = (data: any): CharacterData => {
    // If data already has classes array with proper structure, return as is
    if (data.classes && Array.isArray(data.classes) && data.classes.length > 0) {
        return data;
    }

    // If data has old single-class format, convert to new format
    if (data.class && !data.classes) {
        const level = parseInt(data.level) || 1;
        return {
            ...data,
            classes: [{
                name: data.class,
                subclass: data.subclass || '',
                level: level,
                description: data.classDescription,
            }],
            // Keep old fields for compatibility
            level: data.level,
            class: data.class,
            subclass: data.subclass,
            classDescription: data.classDescription,
        };
    }

    // If no classes and no single class, create default
    if (!data.classes) {
        data.classes = [];
    }

    return data;
};
