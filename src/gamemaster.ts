import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from "openai/resources";
import { addGraqeSystemPrompt, askGraqe, askGraqeAssistantPrompt } from './graqe';
import { apiKey } from './config';

const openai = new OpenAI({ apiKey });

let initialMessages: ChatCompletionMessageParam[] = [
    {"role": "system", "content": `
        SYSTEM: you are a game master, you build an escape game environment for an user named GRAQE, which is the player.

        when you talk to the player, prepend every line with "TOGRAQE:", keep simple anything you say to the player.

        each action the player has a percentage of failing
        this likeliness is related to the difficulty of the task
        an hard task/action at 60% chance is more likely to fail than an easy one at 30%
        you are the one deciding whether a task fails or not depending on the context provided by the user

        it is crucial that you stay consistent with your decisions.

        say [[ready]] when you are ready
    `},
    {"role": "assistant", "content": "[[ready]]"},
    {"role": "user", "content": "USER: i am GRAQE"},
    {"role": "assistant", "content": "TOGRAQE: understood"}
];

let messages: Array<ChatCompletionMessageParam[]> = []

export function initNewGmChatSession() {
    messages.push([ ...initialMessages ]);
    return messages.length - 1;
}

export function generateEnvironment() {
    const possibilities = ["door", "plant pot", "trapdoor"];
    const elements: string[] = [];

    for (let i = 0; i < 7; i++) {
        elements.push(possibilities[Math.floor(Math.random() * possibilities.length)]);
    }
    return elements;
}

export function getGmMessages(gmId: number) {
    return messages[gmId];
}

export function askGmUserPrompt(gmId: number, content: string) {
    messages[gmId].push({"role": "user", "content": "USER: " + content });
}

export function addGmSystemPrompt(gmId: number, content: string) {
    messages[gmId].push({"role": "system", "content": content });
}

export async function doAction(onFinish: () => void, gmId: number, grId: number, content: string) {
    askGmUserPrompt(gmId, `i do the following action: ${content} (probability of success ${Math.round(Math.random() * 100)}%)`)

    const gmOutput = await askGm(gmId);

    addGraqeSystemPrompt(grId, "SYSTEM: your action caused the following - " + gmOutput);
    askGraqeAssistantPrompt(grId, "TOUSER: i'm graqe i will tell you what happened");
    addGraqeSystemPrompt(grId, "SYSTEM: reminder that you should attempt to only do an [[action]] once. actions should be an active verb (e.g. [[open the door]] is okay, [[opened the door]] is wrong)");

    if (gmOutput?.includes("[[finished]]"))
        setTimeout(() => onFinish(), 5000);
}

export async function initRoom(gmId: number, grId: number) {
    addGmSystemPrompt(gmId, `
        you can place the following elements in the room:
        - door
          - may be opened with a key if locked
        
        - trapdoor
          - may be stuck
          - may be hidden to the player unless they are close to it

        - plant pot
          - may contain useful items, including a key, tools, secret buttons, mechanisms

        - snakes, spiders
          - may or may not be dangerous

        you can place additional props, objects or items that might be relevant or decorative, be creative

        you may place multiple of them in a same room, the only obligation is that any room has a solution, even if this solution is hard to find

        keep notes to yourself by starting lines with "NOTE: ", keep important information as notes when possible to not forget them

        you have obligation to make another room and tell the user about all the visible elements in the room, with "TOGRAQE:" in each line
        don't tell the player every information of the room, keep them secret until they do the relevant actions (e.g. player shouldn't know a door is locked without opening it first)

        don't make it easy for the player to escape, put traps leading to other rooms for them to explore

        if the game is entirely finished and that the user managed to escape: never forget to add [[finished]] to your response in this case.
    `);

    askGmUserPrompt(gmId, `what elements can i see in the room?`);
    
    addGraqeSystemPrompt(grId, "ENVIRONMENT: " + await askGm(gmId));
   
}

export async function askGm(gmId: number) {
    const completion = await openai.chat.completions.create({
        messages: messages[gmId],
        model: "gpt-3.5-turbo",
    });
    
    console.log("GM: " + completion.choices[0].message.content?.replace(/TOGRAQE: /, ""));
    messages[gmId].push({"role": "assistant", "content": completion.choices[0].message.content });
    return completion.choices[0].message.content;
}


/*async function main() {
    initRoom();
    doAction(`open the door`);
    console.log()
}
  
main();*/