import { REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

const commands = [
  new SlashCommandBuilder()
    .setName("journal")
    .setDescription("Criar um novo registro de leitura")

    .addStringOption((option) =>
      option.setName("livro").setDescription("Nome do livro").setRequired(true)
    )

    .addIntegerOption((option) =>
      option.setName("pagina").setDescription("Página atual").setRequired(true)
    )

    .addStringOption((option) =>
      option
        .setName("mood")
        .setDescription("Sua reação do momento (pode ser emoji)")
        .setRequired(true)
    )

    .addStringOption((option) =>
      option
        .setName("comentario")
        .setDescription("Comentário")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("spoiler")
        .setDescription("Tem spoiler no seu comentário?")
        .setRequired(false)
    ),
].map((command) => command.toJSON());

const rest = new REST({
  version: "10",
}).setToken(process.env.DISCORD_TOKEN!);

async function main() {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: commands,
    });

    console.log("✅ Commands registrados");
  } catch (error) {
    console.error(error);
  }
}

main();
