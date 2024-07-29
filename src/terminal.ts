import { addGraqeSystemPrompt, askGraqeUserPrompt, initNewGraqeChatSession } from './graqe';
import { initNewGmChatSession, initRoom } from './gamemaster';
import { runNextCycle } from './cycle';

const prompt = require("prompt-sync")({ sigint: true });

async function main() {
    const print = (type: string, msg: string) => {
        if (type === "message")
            console.log("GRAQE:", msg);
        else
            console.log(msg);
    };

    const grId = initNewGraqeChatSession();
    const gmId = initNewGmChatSession();
    await initRoom(gmId, grId);
    addGraqeSystemPrompt(grId, "SYSTEM: don't forget to introduce yourself to the user! they are unaware of your surroundings or your situation, do not forget to TALK to the user with 'TOUSER: '");
    while (true) {
        await new Promise(r => setTimeout(r, 200));
        await runNextCycle(print, () => {}, () => {}, grId, gmId);
        askGraqeUserPrompt(grId, prompt("YOU: "));
    }
}

main();