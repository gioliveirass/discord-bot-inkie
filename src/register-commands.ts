import { REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

const commands = [
  new SlashCommandBuilder()
    .setName("journal")
    .setDescription("Registrar sua leitura do momento")
    .addStringOption((option) =>
      option
        .setName("livro")
        .setDescription("Digite para buscar o livro (Open Library)")
        .setAutocomplete(true)
        .setRequired(true)
        .setMaxLength(100)
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
