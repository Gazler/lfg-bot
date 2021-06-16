const Discord = require('discord.js');
const chrono = require('chrono-node');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

client.once('ready', () => {
	console.log('Ready!');
});

const heroics = ["hc", "heroic"];

const dungeons = {
  hr: "Hellfire Ramparts",
  ramparts: "Hellfire Ramparts",
  bf: "The Blood Furnace",
  halls: "Shattered Halls",
  shh: "Shattered Halls",

  sp: "Slave Pens",
  ub: "The Underbog",
  sv: "The Steam Vaults",

  mt: "Mana-Tombs",
  ac: "Auchenai Crypts",
  sh: "Sethekk Halls",
  sl: "Shadow Labyrinth",
  slabs: "Shadow Labyrinth",
  labs: "Shadow Labyrinth",

  dh: "Escape from Durnholde",
  durn: "Escape from Durnholde",
  durnholde: "Escape From Durnholde",
  oh: "Escape from Durnholde",
  bm: "Black Morass",

  mech: "The Mechanar",
  bot: "The Botanica",
  arc: "The Arcatraz",
  arca: "The Arcatraz"
};

const messageTemplate = (contents, tank, healer, dps) => {
  const [head, signed] = contents.split("---");
  const signedMembers = signed.split("\n");
  const existingDPS = [];
  signedMembers.forEach((member) => {
    if (member.indexOf("*") > -1) {
      const role = member.split(":")[0].toLowerCase();
      const [_, id] = member.match(/<@!?(\d+)>/) || [];
      if (id && role === "tank") {
        tank = { presign: true, id };
      }

      if (id && role === "healer") {
        healer = { presign: true, id };
      }

      if (id && role === "dps") {
        existingDPS.push({ presign: true, id });
      }
    }
  });

  dps = existingDPS.concat(dps);


  return `
${head}---

Tank: ${tank ? (tank.presign ? "*" : "") + "<@" + tank.id + ">" : ""}
Healer: ${healer ? (healer.presign ? "*" : "") + "<@" + healer.id + ">" : ""}
DPS: ${dps[0] ? (dps[0].presign ? "*" : "") + "<@" + dps[0].id + ">" : ""}
DPS: ${dps[1] ? (dps[1].presign ? "*" : "") + "<@" + dps[1].id + ">" : ""}
DPS: ${dps[2] ? (dps[2].presign ? "*" : "") + "<@" + dps[2].id + ">" : ""}
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

const availableRoles = ["healer", "heal", "tank", "dps"];

client.on('message', async message => {
	if (message.content.indexOf("!lfg") === 0) {
    let content = message.content;
    content = content.replace("!lfg ", "");
    const date = chrono.parseDate(message.content, new Date(), { forwardDate: true });
    if (date) {
      const [{text}] = chrono.parse(message.content, new Date(), { forwardDate: true});
      content = content.replace(text, "");
    }
    const parts = message.content.split(" ");

    let roles = {
      heal: null,
      tank: null,
      dps: []
    };

    for (let i = 0; i < parts.length; i++) {
      let current = parts[i];
      if (current.match(/<@!?\d+>/g)) {
        content = content.replace(current, "");
        let next = parts[i + 1];
        content = content.replace(next, "");
        const roleIndex = availableRoles.indexOf(next);
        if (roleIndex > -1) {
          let currentRole = availableRoles[roleIndex];
          if (currentRole === "healer") {
            currentRole = "heal";
          }

          if (currentRole === "dps") {
            roles[currentRole].push(current);
          } else {
            roles[currentRole] = current;
          }
          i++;
        }
      }
    }


    let dungeon = parts.find((x) => dungeons[x.toLowerCase()]);
    let heroic;
    dungeon = dungeons[dungeon || "".toLowerCase()];
    if (dungeon && content.split(" ").filter((x) => x !== "").length < 3) {
      heroic = parts.find((x) => heroics.indexOf(x.toLowerCase()) > -1);
    } else {
      dungeon = content;
    }
    if (date) {
      const meridem = date.getHours() > 12 ? "PM" : "AM";
      const eventStr = `
**${dungeon}${heroic ? " (HEROIC)" : ""}**

**TIME: **${date.toDateString() + " " + date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0") + meridem}

Creator: <@${message.author.id}>
---

Tank: ${roles.tank ? "*" + roles.tank : ""}
Healer: ${roles.heal ? "*" + roles.heal : ""}
DPS: ${roles.dps[0] ? "*" + roles.dps[0] : ""}
DPS: ${roles.dps[1] ? "*" + roles.dps[1] : ""}
DPS: ${roles.dps[2] ? "*" + roles.dps[2] : ""}
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
