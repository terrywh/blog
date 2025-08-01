import { randomUUIDv7, sleep } from "bun";
import { parseArgs } from "node:util";
import { Interface } from "node:readline/promises";

const { values } = parseArgs({
    args: Bun.argv,
    options: {
        server: {
            type: "string",
        },
        name: {
            type: "string",
            default: randomUUIDv7(),
        },
    },
    allowPositionals: true,
});

const server = {
    addr: values.server.split(":").shift(),
    port: parseInt(values.server.split(":").pop()),
};

const client = {
    name: values.name,
};

const socket = await Bun.udpSocket({
    socket: {
        data(socket, buffer, port, addr) {
            const data = JSON.parse(buffer.toString())
            switch (data.action) {
                case "reserve":
                    client.port = data.port;
                    client.addr = data.addr;
                    break;
                case "connect:start":
                    clearInterval(client._connect);
                    this._connect = setInterval(() => {
                        socket.send(JSON.stringify({
                            action: "connect",
                            name: client.name,
                        }), data.port, data.addr);
                    }, 3000);
                    clearTimeout(this._connectTo);
                    this._connectTo = setTimeout(() => {
                        clearInterval(this._connect);
                        if (client._reject) client._reject("failed to connect: timed out");
                        else console.error("failed to connect: timed out");
                    }, 20000);
                    break;
                case "connect":
                    socket.send(JSON.stringify({
                        action: "connect:done",
                    }), port, addr);
                    break;
                case "connect:done":
                    client.peer = Object.assign({}, client.peer, { port, addr });
                    clearTimeout(this._connectTo);
                    clearInterval(this._connect);
                    if (client._ac) client._ac.abort();
                    client._readline.write(`${Bun.color("green", "ansi-256")}connected:${Bun.color("black", "ansi-256")} ${addr}:${port}\r\n`);
                    if (client._resolve) client._resolve();
                    break;
                case "data":
                    client._ac.abort();
                    client._readline.write(`${Bun.color("gray", "ansi-256")}${data.data}${Bun.color("black", "ansi-256")}\r\n`);
                    break;
            }
        }
    },
});


function reserve() {
    const reservation = {
        _reserve() {
            socket.send(JSON.stringify({
                action: "reserve",
                name: client.name,
            }), server.port, server.addr);
            this.timeout = setTimeout(this._reserve.bind(this), 60000);
        },
        [Symbol.dispose]() {
            clearTimeout(this.timeout);
        }
    }
    reservation._reserve();
    return reservation;
};

async function connect(name) {
    client.peer = Object.assign({}, client.peer, { name });
    socket.send(JSON.stringify({
        action: "connect",
        name,
    }), server.port, server.addr);

    return new Promise((resolve, reject) => {
        client._resolve = resolve;
        client._reject = reject;
    });
}

async function publish(input) {
    socket.send(JSON.stringify({
        action: "data",
        data: input,
    }), client.peer.port, client.peer.addr);
}


await (async function () {
    using ticket = reserve();
    client._readline = new Interface({
        input: process.stdin,
        output: process.stdout,
    });

    let input;
    while (true) {
        client._ac = new AbortController();
        try {
            input = await client._readline.question("> ", { signal: client._ac.signal });
        } catch (ex) {
            continue;
        }
        client._ac = null;
        input = input.trim();

        if (input.startsWith("connect ")) {
            try {
                await connect(input.split(" ", 2).pop().trim())
            } catch (ex) {
                console.error("failed to connect:", ex)
                continue
            }
        } else if (input == "info") {
            client._readline.write(`${Bun.color("green", "ansi-256")}self: ${Bun.color("black", "ansi-256")}${client.name}\r\n`);
            if (client.peer)
                client._readline.write(`${Bun.color("green", "ansi-256")}peer: ${Bun.color("black", "ansi-256")} ${client.peer.name} ${client.peer.addr}:${client.peer.port}\r\n`);
        } else if (input == "exit") {
            break;
        } else {
            await publish(input);
        }
    }


    client._readline.close();
    socket.close();
})();