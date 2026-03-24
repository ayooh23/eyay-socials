import { DEFAULT_DOC_EYAY_ABOUT } from "./docDefaults";
import {
  paginateAboutEyaSection,
  paginatePlainDocumentTextWithMaxPx,
  SECTION_TITLES,
} from "./proposalPaginate";

export interface DocCoverModel {
  projectName: string;
  clientName: string;
  docNumber: string;
  proposalDate: string;
  docType: string;
  preparedBy: string;
  studioEmail: string;
  studioAddress: string;
}

export type DocPage =
  | { kind: "cover"; key: string; cover: DocCoverModel }
  | {
      kind: "body";
      key: string;
      sectionTitle: string;
      continuation: boolean;
      body: string;
    }
  | {
      kind: "about-eya";
      key: string;
      continuation: boolean;
      showHeadline: boolean;
      headline: string;
      paragraphs: string[];
    };

export const DOC_ABOUT_EYA_TITLE = SECTION_TITLES["about-eya"];
const DOC_BODY_CONTENT_MAX_PX = 1380;
const DOC_ABOUT_CONTENT_MAX_PX = 1380;

export function buildDocPages(
  cover: DocCoverModel,
  sourceText: string,
  eyayAbout: { headline: string; body: string } = DEFAULT_DOC_EYAY_ABOUT,
): DocPage[] {
  const bodyChunks = paginatePlainDocumentTextWithMaxPx(
    sourceText,
    DOC_BODY_CONTENT_MAX_PX,
  );
  const aboutChunks = paginateAboutEyaSection(
    eyayAbout.headline,
    eyayAbout.body,
    DOC_ABOUT_CONTENT_MAX_PX,
  );

  const pages: DocPage[] = [];
  let k = 0;
  const key = () => `d-${k++}`;

  pages.push({ kind: "cover", key: key(), cover });

  const sectionTitle = cover.projectName.trim() || "Document";
  bodyChunks.forEach((body, i) => {
    pages.push({
      kind: "body",
      key: key(),
      sectionTitle,
      continuation: i > 0,
      body,
    });
  });

  aboutChunks.forEach((chunk) => {
    pages.push({
      kind: "about-eya",
      key: key(),
      continuation: chunk.continuation,
      showHeadline: chunk.showHeadline,
      headline: chunk.headline,
      paragraphs: chunk.paragraphs,
    });
  });

  return pages;
}
