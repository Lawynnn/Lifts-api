const { TypedEmitter } = require("tiny-typed-emitter");
const Discord = require("discord.js");

/**
 * @extends {TypedEmitter<{
 'client.add': (client: Discord.Client, timeout: NodeJS.Timeout, expire_timestamp: number, _id: string) => void
 'client.remove': (client: Discord.Client) => void
 'client.end': (client: Discord.Client) => void
 * }>}
 */
module.exports = class ClientStore extends TypedEmitter {
  constructor() {
    super();
    /**
     * @type {Map<_id, {client: Discord.Client, timeout: NodeJS.Timeout, expire_timestamp: number}>}
     */
    this.activeClients = new Map();
  }

  async add(
    token,
    _id,
    expire_timestamp = new Date().getTime(),
    intents = [
      new Discord.IntentsBitField(32767),
      Discord.GatewayIntentBits.MessageContent,
    ]
  ) {
    const client = new Discord.Client({
      intents: intents,
    });
    let success = await client.login(token).catch((err) => false);
    if (!success) return false;

    this.remove(_id);
    let timeout = setTimeout(() => {
      this.emit("client.end", client);
      this.remove(_id);
    }, expire_timestamp - new Date().getTime());

    this.activeClients.set(_id, { client, expire_timestamp, timeout });
    this.emit("client.add", client, timeout, expire_timestamp, _id);
    return { client: this.activeClients.get(_id), _id: _id };
  }

  remove(_id) {
    if (!this.activeClients.has(_id)) return false;

    const client = this.activeClients.get(_id);
    this.emit("client.remove", client.client);
    client.client.destroy();
    clearTimeout(client.timeout);
    this.activeClients.delete(_id);
    return true;
  }
};
