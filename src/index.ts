import { Client, GatewayIntentBits } from "discord.js";

import * as dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log("🟢 Bot online");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "journal") {
    const spoiler = interaction.options.get("spoiler");

    const livro = interaction.options.getString("livro");

    const pagina = interaction.options.getInteger("pagina");

    const mood = interaction.options.getString("mood");

    const comentario = interaction.options.getString("comentario");

    await interaction.reply({
      embeds: [
        {
          color: 0x8b1e3f,

          author: {
            name: interaction.user.username,
            icon_url: interaction.user.displayAvatarURL(),
          },

          description:
            `${spoiler ? "⚠️ CONTÉM SPOILER\n\n" : ""}` +
            `📖 **${livro ?? "Livro não informado"}**\n` +
            `🔖 Página ${pagina ?? "Página não informada"}\n` +
            `☁️ Mood: ${mood ?? "🙂"}\n\n` +
            `${comentario ?? "Sem comentário."}`,

          timestamp: new Date().toISOString(),
        },
      ],
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
