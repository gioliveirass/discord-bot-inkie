import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type APIEmbed,
  type User,
} from "discord.js";
import { formatProgressLine } from "./book-metadata.js";

export const JOURNAL_MODAL_ID = "journal_modal";
export const SPOILER_YES_ID = "journal_spoiler_yes";
export const SPOILER_NO_ID = "journal_spoiler_no";

export type PendingJournal = {
  livro: string;
  pagina: number;
  mood: string;
  comentario: string;
  totalPages?: number | undefined;
  coverUrl?: string | undefined;
};

const pendingByUser = new Map<string, PendingJournal>();
const pendingLivroByUser = new Map<string, string>();

export function setPendingLivro(userId: string, livro: string) {
  pendingLivroByUser.set(userId, livro);
}

export function takePendingLivro(userId: string): string | undefined {
  const livro = pendingLivroByUser.get(userId);
  if (livro) pendingLivroByUser.delete(userId);
  return livro;
}

export function setPendingJournal(userId: string, data: PendingJournal) {
  pendingByUser.set(userId, data);
}

export function takePendingJournal(userId: string): PendingJournal | undefined {
  const data = pendingByUser.get(userId);
  if (data) pendingByUser.delete(userId);
  return data;
}

export function buildJournalModal() {
  return new ModalBuilder()
    .setCustomId(JOURNAL_MODAL_ID)
    .setTitle("📖 Registro de leitura")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("pagina")
          .setLabel("Página atual")
          .setPlaceholder("Ex: 142")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(6)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("mood")
          .setLabel("Como você está se sentindo?")
          .setPlaceholder("Ex: 🤩 😭 📚 ✨")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(50)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("comentario")
          .setLabel("Comentário")
          .setPlaceholder("O que achou desta parte?")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000)
      )
    );
}

export function buildSpoilerButtons() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(SPOILER_YES_ID)
      .setLabel("Sim, tem spoiler")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("⚠️"),
    new ButtonBuilder()
      .setCustomId(SPOILER_NO_ID)
      .setLabel("Não tem spoiler")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("✅")
  );
}

export function buildJournalEmbed(
  data: PendingJournal,
  hasSpoiler: boolean,
  user: User
): APIEmbed {
  const embed: APIEmbed = {
    color: 0x8b1e3f,
    author: {
      name: user.username,
      icon_url: user.displayAvatarURL(),
    },
    title: "Novo histórico de leitura!",
    description:
      `${hasSpoiler ? "⚠️ CONTÉM SPOILER\n\n" : ""}` +
      `📖 **${data.livro}**\n` +
      `${formatProgressLine(data.pagina, data.totalPages)}\n` +
      `☁️ Mood: ${data.mood}\n\n` +
      data.comentario,
    timestamp: new Date().toISOString(),
  };

  if (data.coverUrl) {
    embed.thumbnail = { url: data.coverUrl };
  }

  return embed;
}
