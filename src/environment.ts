export function generateEnvironment() {
    const possibilities = ["door", "plant pot", "trapdoor"];
    const elements: string[] = [];

    for (let i = 0; i < 7; i++) {
        elements.push(possibilities[Math.floor(Math.random() * possibilities.length)]);
        console.log(elements)
    }
    return elements;
}



const hitBreakableItem = [
    "it seems too strong to be broken (you are hurt)",
    "it seems to break (but you are hurt)",
    "it breaks"
]


export const items = {
    "door": {
        "open": [
            "it's locked",
            "it's open"
        ],
        "hit": hitBreakableItem,
        "touch": [
            "it's warm",
            "it's cold"
        ]
    },
    "trapdoor": {
        "hit": hitBreakableItem,
        "go through if it's broken": [
            "it leads me nowhere",
            "it leads me to another room",

        ]
    },
    "plant pot": {
        "lift": [
            "it's too heavy",
            "nothing is below",
            "something is below ([item])"
        ],
        "touch": [
            "it's warm",
            "it's cold",
            "it seems thick",
            "it seems thin",
            "it resonates"
        ],
        "look inside": [
            "nothing is inside",
            "something is inside ([item])"
        ]
    }
}

export const waysToAnotherRoom = [
    "door",
    "tropdoor",
    "hole"
]

export const dangers = [
    "snakes",
    "spiders",
    "dragons",
    "fire",
    "ice"
]

let actions: Array<{ text: string, reactions: string[] }> = [];

export function buildListActionsPrompt(itemNames: string[]) {
    const actionsList: string[] = [];
    actions = [];

    const elementsCount: {[key: string]: number} = {};

    for (const k in itemNames) {
        const item = itemNames[k];

        elementsCount[item] = (elementsCount[item] ?? 0) + 1;

        for (const [action, reactions] of Object.entries((items as any)[item])) {
            const actionText = `[[${action} the ${item} (${k})]]`;
            actionsList.push(actionText);
            actions.push({
                text: actionText,
                reactions: reactions as string[]
            });
        }
    }

    return `
        SYSTEM: you have the following actions possible:
        - ${actionsList.join("\n - ")}

        there are ${Object.entries(elementsCount).map(([name, c]) => `${c} ${name}`).join(", ")}

        DO NOT PICK ANY OPTION NOW, OR YOU ARE AT RISK, ASSESS CORRECTLY FROM THE USER INFORMATION
    `;
}