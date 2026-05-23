import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
import { fetchBookMetadata } from "./book-metadata.js";
import { parseLivroInput } from "./book-livro.js";
import { searchBookChoices } from "./book-search.js";
import {
  buildJournalEmbed,
  buildJournalModal,
  buildSpoilerButtons,
  JOURNAL_MODAL_ID,
  setPendingJournal,
  setPendingLivro,
  SPOILER_NO_ID,
  SPOILER_YES_ID,
  takePendingJournal,
  takePendingLivro,
} from "./journal-ui.js";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log("🟢 Bot online");
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isAutocomplete() && interaction.commandName === "journal") {
      const focused = interaction.options.getFocused(true);
      if (focused.name !== "livro") {
        await interaction.respond([]);
        return;
      }

      const query = typeof focused.value === "string" ? focused.value : "";
      const choices = await searchBookChoices(query);
      await interaction.respond(choices);
      return;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === "journal") {
      const livro = interaction.options.getString("livro", true).trim();

      if (!livro) {
        await interaction.reply({
          content: "Informe o nome do livro (digite para ver sugestões ou escreva o título).",
          ephemeral: true,
        });
        return;
      }

      setPendingLivro(interaction.user.id, livro);
      await interaction.showModal(buildJournalModal());
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === JOURNAL_MODAL_ID) {
      const livro = takePendingLivro(interaction.user.id);

      if (!livro) {
        await interaction.reply({
          content: "Sessão expirada. Use `/journal` de novo.",
          ephemeral: true,
        });
        return;
      }

      const paginaRaw = interaction.fields.getTextInputValue("pagina").trim();
      const mood = interaction.fields.getTextInputValue("mood").trim();
      const comentario = interaction.fields.getTextInputValue("comentario").trim();
      const pagina = Number.parseInt(paginaRaw, 10);

      if (!mood || !comentario) {
        await interaction.reply({
          content: "Preencha todos os campos do formulário.",
          ephemeral: true,
        });
        return;
      }

      if (Number.isNaN(pagina) || pagina < 1) {
        await interaction.reply({
          content: "A página precisa ser um número maior que zero.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      const { displayTitle, workId } = parseLivroInput(livro);
      const metadata = await fetchBookMetadata({ displayTitle, workId });

      setPendingJournal(interaction.user.id, {
        livro: displayTitle,
        pagina,
        mood,
        comentario,
        totalPages: metadata.totalPages,
        coverUrl: metadata.coverUrl,
      });

      await interaction.editReply({
        content: "Quase lá! Seu comentário contém **spoiler**?",
        components: [buildSpoilerButtons()],
      });
      return;
    }

    if (
      interaction.isButton() &&
      (interaction.customId === SPOILER_YES_ID ||
        interaction.customId === SPOILER_NO_ID)
    ) {
      const data = takePendingJournal(interaction.user.id);

      if (!data) {
        await interaction.reply({
          content: "Esse formulário expirou. Use `/journal` de novo.",
          ephemeral: true,
        });
        return;
      }

      const hasSpoiler = interaction.customId === SPOILER_YES_ID;
      const channel = interaction.channel;

      if (!channel || !channel.isTextBased()) {
        await interaction.reply({
          content: "Não foi possível publicar no canal.",
          ephemeral: true,
        });
        return;
      }

      await interaction.update({
        content: "✅ Registro publicado!",
        components: [],
      });

      await channel.send({
        embeds: [buildJournalEmbed(data, hasSpoiler, interaction.user)],
      });
    }
  } catch (error) {
    console.error(error);

    if (interaction.isAutocomplete()) {
      if (!interaction.responded) {
        await interaction.respond([]);
      }
      return;
    }

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "Algo deu errado. Tente de novo com `/journal`.",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
