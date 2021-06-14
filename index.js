const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

client.once('ready', () => {
	console.log('Ready!');
});

const heroics = ["hc", "heroic"];
const dungeons = {
  hr: "Hellfire Ramparts",
  ramparts: "Hellfire Ramparts",
  bf: "The Blood Furnace",
  sh: "Shattered Halls",
  halls: "Shattered Halls",

  sp: "Slave Pens",
  ub: "The Underbog",
  sv: "The Steam Vaults",

  mt: "Mana-Tombs",
  ac: "Auchenai Crypts",
  sh: "Sethekk Halls",
  sl: "Shadow Labyrinth",
  labs: "Shadow Labyrinth",

  dh: "Escape from Durnholde",
  durn: "Escape from Durnholde",
  durnholde: "Escape From Durnholde",

  mech: "The Mechanar",
  bot: "The Botanica",
  arc: "The Arcatraz",
  arca: "The Arcatraz"
};

const messageTemplate = (contents, tank, healer, dps) => {
  const [head] = contents.split("---");
  return `
${head}---

Tank: ${tank ? "<@" + tank.id + ">" : ""}
Healer: ${healer ? "<@" + healer.id + ">" : ""}
DPS: ${dps[0] ? "<@" + dps[0].id + ">" : ""}
DPS: ${dps[1] ? "<@" + dps[1].id + ">" : ""}
DPS: ${dps[2] ? "<@" + dps[2].id + ">" : ""}
`
};

const replaceRoles = async (reaction) => {
  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
    await reaction.message.fetch();
  } catch (error) {
    console.error('Something went wrong when fetching the message: ', error);
  }

  const reactions = await Promise.all(reaction.message.reactions.cache
                                      .map(async (reaction) => {
                                        await reaction.users.fetch();
                                        return reaction;
                                      }));

  const [tanks, healers, dpsers] = reactions.map((r) => r.users.cache.filter((u) => !u.bot));
  const tank = tanks.array()[0];
  const healer = healers.array()[0];
  const dps = dpsers.array();

  reaction.message.edit(messageTemplate(reaction.message.content, tank, healer, dps));
}

client.on('message', async message => {
	if (message.content.indexOf("!lfg") === 0) {
		// send back "Pong." to the channel the message was sent in
    const parts = message.content.split(" ");
    const matcher = new RegExp(/\d{1,2}:\d{2}/g);
    const time = parts.find((x) => x.match(matcher));
    let dungeon = parts.find((x) => dungeons[x.toLowerCase()]);
    let heroic;
    dungeon = dungeons[dungeon];
    if (dungeon) {
      heroic = parts.find((x) => heroics.indexOf(x.toLowerCase()) > -1);
    } else {
      dungeon = message.content.replace("!lfg ", "").replace(` ${time}`, "");
    }
    if (time) {
      const eventStr = `
**${dungeon}${heroic ? " (HEROIC)" : ""}**

**TIME: **${time}

Creator: <@${message.author.id}>

---

Tank:
Healer:
DPS:
DPS:
DPS:
    `;

      const event = await message.channel.send(eventStr);
      try {
        await event.react("854068302750154772");
        await event.react("854068302673739796");
        await event.react("854068302720401438");
      } catch (error) {
        console.log(error);
      }
    }
	}
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.me) {
    return;
  }

  replaceRoles(reaction);
});

client.on('messageReactionRemove', async (reaction, user) => {
  replaceRoles(reaction);
});

client.login(process.env.DISCORD_TOKEN);
