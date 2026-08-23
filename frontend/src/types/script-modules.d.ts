declare module "*.mjs" {
  export function compareImages(options: {
    referencePath: string;
    actualPath: string;
    basename: string;
    reviewRootPath?: string;
  }): Promise<{
    width: number;
    height: number;
    referenceSha256: string;
    actualSha256: string;
    sideBySidePath: string;
    overlayPath: string;
    diffPath: string;
  }>;
}
