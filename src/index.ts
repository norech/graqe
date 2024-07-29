import { addGraqeSystemPrompt, askGraqe, askGraqeUserPrompt, initNewGraqeChatSession } from './graqe';
import { doAction, initNewGmChatSession, initRoom } from './gamemaster';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { runNextCycle } from './cycle';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/../static'));

io.on('connection', async (socket) => {
    const grId = initNewGraqeChatSession();
    const gmId = initNewGmChatSession();
    let lastUserInteract: Date | undefined = undefined;
    let lastUserAsk = new Date();
    let lastAction = new Date();
    let userAskInRow = 0;

    console.log('a user connected');

    const triggerFinish = () => {
        socket.emit('finish');
        socket.disconnect();
    };

    const sendMsg = (type: string, msg: string) => socket.emit('chat message', [type, msg]);
    const triggerAction = () => {
        lastAction = new Date();
    }

    await initRoom(gmId, grId);
    addGraqeSystemPrompt(grId, "SYSTEM: don't forget to introduce yourself to the user! they are unaware of your surroundings or your situation, do not forget to TALK to the user with 'TOUSER: '");

    await new Promise(r => setTimeout(r, 200));
    await runNextCycle(sendMsg, triggerFinish, triggerAction, grId, gmId);
    socket.emit("ready");

    const i = setInterval(() => {
        if (new Date().getTime() - lastAction.getTime() > 30000 && lastUserInteract && new Date().getTime() - lastUserInteract.getTime() < 5000 && Math.random() > 0.5) {
            addGraqeSystemPrompt(grId, "SYSTEM: attempt an [[action]] that is relevant to your goal and interact with your environment on your own");
            // just add to the prompt to convince the AI to do stuff
        }
        if (lastUserInteract != undefined && new Date().getTime() - lastUserInteract.getTime() > 30000 && new Date().getTime() - lastUserAsk.getTime() > 20000) {
            lastUserAsk = new Date();
            if (userAskInRow < 4) {
                const nonAutonomousProbability = userAskInRow < 2 ? 0.25 : 0;
                socket.emit("typing");
                if (Math.random() > nonAutonomousProbability) {
                    addGraqeSystemPrompt(grId, "SYSTEM: don't ask the user for help anymore for now, instead attempt an action that is relevant to your goal and interact with your environment on your own - avoid thanking the user for their help - if required, describe your environment when you do an action, using your own words")
                } else {
                    addGraqeSystemPrompt(grId, "SYSTEM: if you need user feedback remind thm that you are still there and still stuck, and that you need their help! - greet them, try to get their attention, and avoid repeating the same message. if they don't seem to be helping, do things on your own");
                }
                runNextCycle(sendMsg, triggerFinish, triggerAction, grId, gmId).then(() => {
                    socket.emit("ready");
                });
            } else if (userAskInRow == 4) {
                socket.emit("typing");
                addGraqeSystemPrompt(grId, "SYSTEM: tell the user you will look on your own, but tell them that you really want them to reply as soon as possible and that you are worried about them not responding");
                addGraqeSystemPrompt(grId, "SYSTEM: attempt an [[action]] that is relevant to your goal and interact with your environment on your own - avoid thanking the user for their help as they are ignoring you");
                runNextCycle(sendMsg, triggerFinish, triggerAction, grId, gmId).then(() => {
                    socket.emit("ready");
                });
            }
            userAskInRow++;
        }
    }, 1000);

    socket.on("disconnect", () => {
        clearInterval(i);
    })

    socket.on("typing", () => {
        lastUserInteract = new Date();
    })

    socket.on('chat message', async (msg) => {
        lastUserInteract = new Date();
        userAskInRow = 0;
        await new Promise(r => setTimeout(r, 200));
        askGraqeUserPrompt(grId, msg);
        await runNextCycle(sendMsg, triggerFinish, triggerAction, grId, gmId);
        socket.emit("ready");
    });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});