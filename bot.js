const { MessageAttachment, Client, Intents, MessageActionRow, MessageButton, MessageEmbed} = require("discord.js");
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES]
});
const axios = require('axios').default;
require('dotenv').config()
const schedule = require('node-schedule');
const prefix = ".";
                                                          

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const rule = new schedule.RecurrenceRule();
    rule.hour = [7, 13, 17];
    rule.minute = 0;
    rule.second = 0;
    const posting = schedule.scheduleJob(rule, postNews);
});

client.on("messageCreate", async (message) => {
    if(message.author.bot) return; // so bot wont trigger itself
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    args.shift();
    console.log(args);
    
    if (message.content.startsWith(`${prefix}news`)) { 
        postNews(args, message)
    }

    if (message.content.startsWith(`${prefix}server`)) {
        var serverIP; String;
        var content; String;
        if (args.length > 0) {
            serverIP = args[0];
            content = `Server information on ${args.join(" ")}`;
        }
        else {
            serverIP = 'mc.antriko.co.uk'
            content = "Server"
        }

        var server = await axios.get(`https://api.mcsrvstat.us/2/${serverIP}`);
        if (!server.data.online) {
            await message.channel.send("Offline or not found");
            return;
        }

        const serverEmbed = new MessageEmbed()
            .setColor('BLURPLE')
            .setTitle(serverIP)
            .setDescription(server.data.motd.clean[0])
            .setThumbnail(`https://api.mcsrvstat.us/icon/${serverIP}`)
            .addFields(
                {name: "Player count", value: `${server.data.players.online}/${server.data.players.max}`, inline: true},
                {name: "Version", value: server.data.version, inline: true},
                {name: "Software", value: server.data.software ? server.data.software : "Vanilla", inline: true}
            )
            // .setFooter({text: `Last updated ${new Date(server.data.last_updated * 1000).toLocaleString(("en-GB"))}`})

        if (server.data.players.online < 10 && server.data.players.online > 0) {
            var players = " ";
            for (var i = 0; i < server.data.players.list.length; i++) {
                players = players.concat("\n", server.data.players.list[i])
            }
            serverEmbed.addField("Players:", players, true)
        }
        
        await message.channel.send({embeds: [serverEmbed]})
    }

    if (message.content.startsWith(`${prefix}map`)) {
        const mapEmbed = new MessageEmbed()
            .setColor('BLURPLE')
            .setTitle("Server map")
            .setURL("http://mc.antriko.co.uk:8123")
        await message.channel.send({embeds: [mapEmbed]})
    }

    if (message.content.startsWith(`${prefix}prune`)) {
        if (message.member.permissions.has('MANAGE_MESSAGES') || message.member.id === `182204906751393795`) {
            if (args.length < 1) {
                message.channel.send('Prune how many? `' + prefix + 'prune [number]`')
            } 
            else if (!Number.isNaN(parseInt(args[0]))) {
                var prune = parseInt(args[0]);
                prune = ((prune) > 10 ? 10 : prune)
                prune = ((prune) <= 0 ? 1 : prune);
                message.channel.bulkDelete(prune+1);
            }
        } else {
            message.channel.send('No permission')
        }
    }
});

function getNewsEmbed(data, index) {
    const newsEmbed = new MessageEmbed()
        .setColor('BLURPLE')
        .setTitle(data[index].title)
        .setURL(data[index].url)
        .setDescription(data[index].description)
        .setImage(data[index].urlToImage)
        .addFields(
            {name: "Page", value: `${index+1} of ${data.length}`, inline: true},
            {name: "Source", value: data[index].source.name, inline: true}
            )
        .setFooter({ text: `Published on ${new Date(data[index].publishedAt).toLocaleString(("en-GB"))}`})
    return newsEmbed;

}

client.login(process.env.TOKEN)

async function postNews(args, message) {
    // Scheduler will pass time as 1st parameter
    channel = message ? message.channel : client.channels.cache.get('985898292678377544')

    if (!message) {
        console.log("Scheduled news posting")
        channel.send("Martins automatic news postings")
        req = `https://newsapi.org/v2/top-headlines?country=gb&language=en&apiKey=${process.env.NEWS_API}` 
        content = "Top headlines from UK"
    } else if (args.length > 0) {
        req = `https://newsapi.org/v2/everything?q=${args.join("_")}&language=en&apiKey=${process.env.NEWS_API}`
        content = `Articles about ${args.join(" ")}`;
    } else {
        req = `https://newsapi.org/v2/top-headlines?country=gb&language=en&apiKey=${process.env.NEWS_API}` 
        content = "Top headlines from UK"
    }


    var resp = await axios.get(req)
    var newsData = resp.data.articles;
    if (newsData.length === 0) {
        await channel.send("No articles found");
        return;
    }

    var response = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle('PRIMARY')
        )

    var index = 0;
    let news = await channel.send({content: content, embeds: [getNewsEmbed(newsData, index)], components: [response]})

    const collector = news.createMessageComponentCollector();
    collector.on('collect', async i => {
        if (i.customId === 'previous') {
            index--;
            if (index === -1) index = newsData.length - 1;
        }
        
        if (i.customId === 'next') {
            index++;
            if (index === newsData.length) index = 0;
        }

        news.edit({content: content, embeds: [getNewsEmbed(newsData, index)], components: [response]})
        i.deferUpdate();
    });
}