import { doAction } from "./gamemaster";
import { askGraqe } from "./graqe";

type SendMsgFn = (type: string, s: string) => void;

export async function runNextCycle(sendMsg: SendMsgFn, triggerFinish: () => void, triggerAction: () => void, grId: number, gmId: number) {
    const content = (await askGraqe(grId))!.replace(/TOUSER: /g, "").trim();
    const displayedMessage = content.replace(/\[\[(.*)\]\]/gm, "");
    if (displayedMessage.length > 0)
        sendMsg("message", displayedMessage);

    for (const match of content.matchAll(/\[\[(.*)\]\]/gm)) {
        sendMsg("action", "[[GRAQE " + match[1].substring(0, 1).toLocaleLowerCase() + match[1].substring(1) + "]]")
        await doAction(triggerFinish, gmId, grId, content);
        triggerAction();
        await new Promise((r) => setTimeout(r, 200));
        await new Promise((rs, rj) => setImmediate(() => {
            runNextCycle(sendMsg, triggerFinish, triggerAction, grId, gmId).then(rs).catch(rj);
        }));
    }
}