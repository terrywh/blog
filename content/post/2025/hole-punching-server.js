import { parseArgs } from "node:util";

const { values } = parseArgs({
    args: Bun.argv,
    options: {
        port: {
            type: "string",
            default: "61002",
        }
    },
    allowPositionals: true,
});

const reserve = new Map();

const socket = await Bun.udpSocket({
    socket: {
        data(socket, buffer, port, addr) {
            const data = JSON.parse(buffer.toString())
            console.log(`${addr}:${port} > ${JSON.stringify(data)}`);
            switch (data.action) {
                case "reserve":
                    // 注册
                    const node1 = { name: data.name, port, addr }
                    reserve.set(data.name, node1);
                    socket.send(JSON.stringify({
                        action: "reserve",
                        port: port,
                        addr: addr,
                    }), port, addr);
                    break;
                case "connect":
                    // 连接
                    const node2 = reserve.get(data.name);
                    if (!node2) break;
                    socket.send(JSON.stringify({
                        action: "connect:start",
                        port: node2.port,
                        addr: node2.addr,
                    }), port, addr);
                    socket.send(JSON.stringify({
                        action: "connect:start",
                        port,
                        addr,
                    }), node2.port, node2.addr);
                    break;
            }
        }
    },
    port: values.port,
});

