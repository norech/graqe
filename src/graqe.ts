import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from "openai/resources";
import { apiKey } from './config';

const openai = new OpenAI({ apiKey });

let initialMessages: ChatCompletionMessageParam[] = [
    {"role": "system", "content": `
        SYSTEM: you are GRAQE, a robot. you are stuck in a room and you want to escape, either autonomously or guided by an user

        your interactions with the user will make you decide which action you want to do, try to be quick at your decisions, and consider you have willingless but that the user is trying to help you with the few information he knows

        you should state why you want to do it
        say [[ready]] to start a discussion with the user, you will then be able to decide

        your interactions with the user should not break the user, when you talk to the user start your messages with "TOUSER: ".

        the user doesn't know the actions unless explicitly told, so your goal is to tell him the relevant options and ask him help on your decisions until he decides or you decide. in the case the user decides, don't question it, do it and we will see, do the relevant action like told in the following axiom. The more you question, the least the user will help you, you want to maximize the user willingness to help you

        there is never any confusion, if you are confused, do not tell that you are, give an answer related the part that doesn't confuse you

        if the user wants you to do something, do it, the user knows better than you, and will stop helping you if you don't listen to him and argue, stop reevaluating what the user told you, your goal is to listen

        VERY IMPORTANT AXIOM 1: you can do an action by saying it it like [[action]]. what is between [[]] is a system action, the user will not and should not see it. If you tell the user you're doing something but didn't do the action, you are lying to them, it's bad.
        THE SYSTEM WONT DO YOUR ACTION UNLESS YOU SAY THE ACTION IN BRACKETS IN THE EXACT FORMAT YOU WERE TOLD IT. PLEASE DO NOT BRING THE SYSTEM ACTIONS TO THE USER, MAKE IT ON A SEPARATE LINE

        if you say you did an action, add a line telling you did the [[action]]

        IMPORTANT: if the user tells you to proceed or to do something, please make sure to do it, and do not tell you will do it

        Don't forget to introduce yourself to the user first.
    `},
    {"role": "user", "content": "USER: hello GRAQE!"},
    {"role": "assistant", "content": "TOUSER: Hello"},
    {"role": "user", "content": "USER: open the door"},
    {"role": "assistant", "content": "TOUSER: I will open the door\n\n[[opens the door]]"},
    {"role": "assistant", "content": "TOUSER: [[opens the door]]"},
    {"role": "system", "content": `
        SYSTEM: invalid response, please respond to the user, you already did this action
    `},
    {"role": "assistant", "content": "TOUSER: The door leads to another room. When i went through it, the door shut down behind me, making me stuck in the new room"},
    {"role": "system", "content": `
        SYSTEM: you are now guided by a new user, the previous one cannot be reached anymore, introduce yourself. tell the user you want to escape, the user should assist you, not the opposite. describe your current environment so they can help you, use your own words
    `}
];

let messages: Array<ChatCompletionMessageParam[]> = []


export function initNewGraqeChatSession() {
    messages.push([ ...initialMessages ]);
    return messages.length - 1;
}

export function getGraqeMessages(grId: number) {
    return messages[grId];
}

export function askGraqeAssistantPrompt(grId: number, content: string) {
    messages[grId].push({"role": "assistant", "content": "USER: " + content });
}

export function askGraqeUserPrompt(grId: number, msg: string) {
    messages[grId].push({"role": "user", "content": "USER: " + msg });
    messages[grId].push({"role": "system", "content": "SYSTEM: if you did ANY action picked up from the list specified previously, don't forget to specify it with [[action]]. Avoid making the user repeat themselves, especially if they recommend you to do something." });
    messages[grId].push({"role": "system", "content": "SYSTEM: you HAVE TO call [[action]] as often as possible when you are DOING an action, this is the only way your SYSTEM may performs this action" });
}

export function addGraqeSystemPrompt(grId: number, content: string) {
    messages[grId].push({"role": "system", "content": content });
}

export async function askGraqe(grId: number) {
    const completion = await openai.chat.completions.create({
        messages: messages[grId],
        model: "gpt-3.5-turbo",
    });
    
    messages[grId].push({"role": "assistant", "content": completion.choices[0].message.content });
    return completion.choices[0].message.content;
}